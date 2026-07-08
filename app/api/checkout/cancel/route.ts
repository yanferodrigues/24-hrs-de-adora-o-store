import { NextResponse } from "next/server";

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
