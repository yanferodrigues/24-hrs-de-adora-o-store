import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Cancela um pagamento Pix pendente no Mercado Pago (quando o cliente desiste).
 * Evita que um QR abandonado continue pagável. Best-effort: se o pagamento já
 * não puder ser cancelado (ex.: já aprovado), retorna ok:false sem quebrar o front.
 *
 * POST /api/checkout/cancel  body: { id: number }
 */
export async function POST(req: Request) {
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
  // logada consegue cancelar um Pix pendente cujo id ela adivinhe.
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { id } = (await req.json().catch(() => ({}))) as { id?: number | string };
  if (!id) {
    return NextResponse.json({ error: "missing_id" }, { status: 400 });
  }

  const resp = await fetch(`https://api.mercadopago.com/v1/payments/${id}`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ status: "cancelled" }),
  });

  return NextResponse.json({ ok: resp.ok });
}
