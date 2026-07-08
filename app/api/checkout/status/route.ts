import { NextResponse } from "next/server";

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
