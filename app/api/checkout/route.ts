import { NextResponse } from "next/server";
import { randomUUID } from "crypto";

/**
 * Cria um pagamento Pix no Mercado Pago quando MP_ACCESS_TOKEN estiver definido.
 * Sem a chave, responde { configured: false } para o front degradar com elegância.
 * (Usa a API REST do Mercado Pago via fetch — sem dependência extra no bundle.)
 *
 * Retorna o QR Code (imagem base64) e o "copia e cola" para exibir no próprio site.
 */

interface CartItem {
  version: string;
  size: string;
  qty: number;
  price: number;
}

export async function POST(req: Request) {
  const key = process.env.MP_ACCESS_TOKEN;

  const { items, email } = (await req.json().catch(() => ({}))) as {
    items?: CartItem[];
    email?: string;
  };

  if (!key) {
    return NextResponse.json({ configured: false });
  }

  if (!items?.length) {
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

  const total = items.reduce((n, i) => n + i.qty * i.price, 0);
  const description = items
    .map((i) => `Camiseta ${i.version} (${i.size}) x${i.qty}`)
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
      description: `${description} · 24 Horas de Adoração`,
      payer: { email },
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
