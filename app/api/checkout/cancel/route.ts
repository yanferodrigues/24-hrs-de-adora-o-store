import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

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
  // A posse do pagamento é conferida logo abaixo, contra a tabela `pedidos`.
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

  // Só o dono cancela. Antes da tabela `pedidos` isso era impossível de
  // verificar, e qualquer pessoa logada derrubava um Pix cujo id adivinhasse.
  const admin = createAdminClient();
  const { data: linhas } = await admin
    .from("pedidos")
    .select("id")
    .eq("payment_id", String(id))
    .eq("user_id", user.id)
    .limit(1);

  if (!linhas || linhas.length === 0) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const resp = await fetch(`https://api.mercadopago.com/v1/payments/${id}`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ status: "cancelled" }),
  });

  if (resp.ok) {
    const { error } = await admin
      .from("pedidos")
      .update({ status: "cancelled" })
      .eq("payment_id", String(id));
    if (error) {
      console.error("[cancel] falha ao marcar cancelado:", error.message);
    }
  }

  return NextResponse.json({ ok: resp.ok });
}
