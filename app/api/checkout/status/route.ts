import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

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
  // A posse do pagamento é conferida logo abaixo, contra a tabela `pedidos`.
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

  // Agora existe vínculo pagamento→usuário, então conferimos a posse. Sem
  // isso, qualquer pessoa logada leria o status de um pagamento cujo id ela
  // adivinhasse.
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
    headers: { Authorization: `Bearer ${key}` },
    cache: "no-store",
  });

  if (!resp.ok) {
    return NextResponse.json({ error: "mp_error" }, { status: 502 });
  }

  const payment = await resp.json();

  // Guarda o desfecho: é o que faz a tela do admin sair de "Pendente" sem
  // depender de ninguém clicar em sincronizar.
  if (payment?.status && payment.status !== "pending") {
    const { error } = await admin
      .from("pedidos")
      .update({ status: payment.status })
      .eq("payment_id", String(id));
    if (error) {
      console.error("[status] falha ao atualizar o pedido:", error.message);
    }
  }

  return NextResponse.json({ status: payment.status });
}
