import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isAdminEmail } from "@/lib/admin";

/**
 * Reconsulta no Mercado Pago os pedidos ainda pendentes e corrige o status.
 * Existe porque a confirmação é por polling no navegador: quem paga e fecha a
 * aba deixa a linha em `pending` para sempre. O webhook resolveria de vez e
 * segue na lista de pendências do CLAUDE.md.
 *
 * POST /api/admin/sync → { updated, checked }
 */

/** Teto por clique, para a requisição não estourar o tempo limite da função. */
const MAX_POR_CLIQUE = 60;

export async function POST() {
  // Checagem repetida de propósito (o middleware não basta — ver invariante 3
  // do CLAUDE.md). 404 para não confirmar que a rota existe.
  const {
    data: { user },
  } = await createClient().auth.getUser();
  if (!isAdminEmail(user?.email)) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const key = process.env.MP_ACCESS_TOKEN;
  if (!key) {
    return NextResponse.json({ configured: false });
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("pedidos")
    .select("payment_id")
    .eq("status", "pending")
    .order("created_at", { ascending: false })
    .limit(500);

  if (error) {
    console.error("[sync] falha ao listar pendentes:", error.message);
    return NextResponse.json({ error: "db_error" }, { status: 502 });
  }

  // Um Pix com vários itens tem várias linhas com o mesmo payment_id: uma
  // consulta por pagamento, não por linha.
  const ids = [...new Set((data ?? []).map((r) => r.payment_id))].slice(
    0,
    MAX_POR_CLIQUE
  );

  let updated = 0;
  for (const id of ids) {
    const resp = await fetch(`https://api.mercadopago.com/v1/payments/${id}`, {
      headers: { Authorization: `Bearer ${key}` },
      cache: "no-store",
    });
    if (!resp.ok) continue;

    const payment = await resp.json();
    if (!payment?.status || payment.status === "pending") continue;

    const { error: upErr } = await admin
      .from("pedidos")
      .update({ status: payment.status })
      .eq("payment_id", id);

    if (upErr) {
      console.error(`[sync] falha ao atualizar ${id}:`, upErr.message);
      continue;
    }
    updated++;
  }

  return NextResponse.json({ updated, checked: ids.length });
}
