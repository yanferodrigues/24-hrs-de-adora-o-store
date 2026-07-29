import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Consulta o status de um pagamento no Mercado Pago (usado pelo polling do front).
 * O token nunca vai para o navegador — a chamada acontece só aqui no servidor.
 *
 * GET /api/checkout/status?id=<paymentId>
 * → { status: "pending" | "approved" | "rejected" | "cancelled" | ... }
 */
export async function GET(req: Request) {
  const key = process.env.MP_ACCESS_TOKEN;
  if (!key) {
    return NextResponse.json({ configured: false });
  }

  // O middleware já bloqueia esta rota, mas confirmamos aqui também: é a
  // única garantia se o matcher for mexido por engano no futuro.
  //
  // LIMITAÇÃO CONHECIDA: só sabemos que existe *alguém* logado, não que este
  // pagamento seja dele. Amarrar o paymentId ao usuário exige persistência de
  // pedidos (um banco), que ainda não temos — enquanto isso, qualquer pessoa
  // logada consegue ler o status de um pagamento cujo id ela adivinhe.
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const id = new URL(req.url).searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "missing_id" }, { status: 400 });
  }

  const resp = await fetch(`https://api.mercadopago.com/v1/payments/${id}`, {
    headers: { Authorization: `Bearer ${key}` },
    cache: "no-store",
  });

  if (!resp.ok) {
    return NextResponse.json({ error: "mp_error" }, { status: 502 });
  }

  const payment = await resp.json();
  return NextResponse.json({ status: payment.status });
}
