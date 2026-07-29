import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { createClient } from "@/lib/supabase/server";
import { isValidName, normalizeName } from "@/lib/auth-validation";
import { FITS, MAX_QTY_POR_ITEM, PRODUCT } from "@/lib/data";

/**
 * Cria um pagamento Pix no Mercado Pago quando MP_ACCESS_TOKEN estiver definido.
 * Sem a chave, responde { configured: false } para o front degradar com elegância.
 * (Usa a API REST do Mercado Pago via fetch — sem dependência extra no bundle.)
 *
 * Retorna o QR Code (imagem base64) e o "copia e cola" para exibir no próprio site.
 */

/**
 * O corpo vem do navegador, então nada aqui é confiável — nem o `price` que o
 * carrinho manda junto (ele existe só para a UI somar o subtotal). Tratamos
 * cada campo como texto cru e resolvemos versão/corte/tamanho/preço contra o
 * catálogo de `lib/data.ts` antes de falar com o Mercado Pago.
 */
interface RawCartItem {
  version?: unknown;
  fit?: unknown;
  size?: unknown;
  qty?: unknown;
}

interface ValidItem {
  version: string;
  fit: string;
  size: string;
  qty: number;
  price: number;
}

/** Única versão do produto — o carrinho não deveria mandar outra coisa. */
const VERSION = "Preta";

/**
 * Devolve o item já normalizado a partir do catálogo, ou `null` se qualquer
 * campo não existir na loja. O preço vem SEMPRE de `FITS`: é isso que impede
 * alguém de editar o corpo do POST e comprar a camiseta por R$ 1.
 */
function validateItem(raw: RawCartItem): ValidItem | null {
  if (raw?.version !== VERSION) return null;

  const fit = FITS.find((f) => f.id === raw?.fit);
  if (!fit) return null;

  const size = PRODUCT.sizes.find((s) => s === raw?.size);
  if (!size) return null;

  const qty = raw?.qty;
  if (typeof qty !== "number" || !Number.isInteger(qty)) return null;
  if (qty < 1 || qty > MAX_QTY_POR_ITEM) return null;

  return { version: VERSION, fit: fit.id, size, qty, price: fit.price };
}

export async function POST(req: Request) {
  const key = process.env.MP_ACCESS_TOKEN;

  const { items, email, name } = (await req.json().catch(() => ({}))) as {
    items?: RawCartItem[];
    email?: string;
    name?: string;
  };

  if (!key) {
    return NextResponse.json({ configured: false });
  }

  // O middleware já bloqueia esta rota, mas confirmamos aqui também: é a
  // única garantia se o matcher for mexido por engano no futuro.
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  if (!Array.isArray(items) || items.length === 0) {
    return NextResponse.json(
      { configured: true, error: "empty_cart" },
      { status: 400 }
    );
  }

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json(
      { configured: true, error: "invalid_email" },
      { status: 400 }
    );
  }

  if (!name || !isValidName(name)) {
    return NextResponse.json(
      { configured: true, error: "invalid_name" },
      { status: 400 }
    );
  }

  // Preço e catálogo são decididos aqui, nunca pelo corpo do POST.
  const validos: ValidItem[] = [];
  for (const raw of items) {
    const item = validateItem(raw);
    if (!item) {
      return NextResponse.json(
        { configured: true, error: "invalid_items" },
        { status: 400 }
      );
    }
    validos.push(item);
  }

  const total = validos.reduce((n, i) => n + i.qty * i.price, 0);
  const comprador = normalizeName(name);
  // A descrição é o que reconcilia o pedido no painel do Mercado Pago, então
  // ela também só usa valores já validados contra o catálogo.
  const description = validos
    .map((i) => `Camiseta ${i.version} ${i.fit} (${i.size}) x${i.qty}`)
    .join(" · ");

  // QR expira em 30 minutos.
  const expiration = new Date(Date.now() + 30 * 60 * 1000).toISOString();

  const resp = await fetch("https://api.mercadopago.com/v1/payments", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      "X-Idempotency-Key": randomUUID(),
    },
    body: JSON.stringify({
      transaction_amount: total,
      payment_method_id: "pix",
      description: `${comprador} · ${description} · 24 Horas de Adoração`,
      payer: { email, first_name: comprador },
      date_of_expiration: expiration,
    }),
  });

  if (!resp.ok) {
    return NextResponse.json(
      { configured: true, error: "mp_error" },
      { status: 502 }
    );
  }

  const payment = await resp.json();
  const tx = payment?.point_of_interaction?.transaction_data;

  return NextResponse.json({
    configured: true,
    paymentId: payment.id,
    status: payment.status,
    qrCode: tx?.qr_code ?? null,
    qrCodeBase64: tx?.qr_code_base64 ?? null,
  });
}
