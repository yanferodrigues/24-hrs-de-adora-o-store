import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isAdminEmail } from "@/lib/admin";
import PedidosTable from "@/components/admin/PedidosTable";
import type { PedidoRow } from "@/lib/pedidos";

export const metadata = { title: "Pedidos · 24 Horas de Adoração" };
// A tabela muda a cada compra: nada de cache.
export const dynamic = "force-dynamic";

export default async function AdminPage() {
  // O middleware garante que existe sessão; aqui decidimos autorização.
  // A checagem é repetida de propósito — o Next 14.2 teve um CVE que pulava
  // o matcher do middleware inteiro.
  const {
    data: { user },
  } = await createClient().auth.getUser();

  // 404, não 403: um 403 confirmaria que a rota existe.
  if (!isAdminEmail(user?.email)) notFound();

  const { data, error } = await createAdminClient()
    .from("pedidos")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(2000);

  if (error) {
    // A mensagem crua do Postgres não vai para a tela: só o fato.
    console.error("[admin] falha ao ler pedidos:", error.message);
  }

  return (
    <PedidosTable
      pedidos={(data ?? []) as PedidoRow[]}
      falhouLeitura={Boolean(error)}
    />
  );
}
