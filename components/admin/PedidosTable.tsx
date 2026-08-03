import { formatPhone } from "@/lib/auth-validation";
import { resumirPagos, type PedidoRow } from "@/lib/pedidos";
import { PRODUCT } from "@/lib/data";
import SyncButton from "./SyncButton";

/**
 * Data e hora são formatadas aqui, no servidor, com o fuso fixo em São Paulo.
 * Sem o fuso explícito o servidor de produção (UTC) mostraria a hora do pedido
 * três horas adiantada. Formatar no servidor também evita divergência de
 * hidratação, já que o relógio do visitante não participa.
 */
const FMT_DATA = new Intl.DateTimeFormat("pt-BR", {
  timeZone: "America/Sao_Paulo",
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});
const FMT_HORA = new Intl.DateTimeFormat("pt-BR", {
  timeZone: "America/Sao_Paulo",
  hour: "2-digit",
  minute: "2-digit",
});

/** Status do Mercado Pago em pt-BR. Tela só de admin, então um status novo do
 *  MP aparece cru — é diagnóstico útil, não mensagem para comprador. */
const STATUS: Record<string, string> = {
  approved: "Pago",
  pending: "Pendente",
  in_process: "Em análise",
  rejected: "Recusado",
  cancelled: "Cancelado",
  refunded: "Devolvido",
};

const TH =
  "whitespace-nowrap px-3 py-3 text-left font-mono text-[10px] uppercase tracking-[0.16em] text-mute-2";
const TD = "whitespace-nowrap px-3 py-3 text-sm text-ink";

export default function PedidosTable({
  pedidos,
  falhouLeitura,
}: {
  pedidos: PedidoRow[];
  falhouLeitura: boolean;
}) {
  // A ordem do catálogo é a ordem da quebra por tamanho.
  const resumo = resumirPagos(pedidos, PRODUCT.sizes);

  return (
    <main className="min-h-screen" style={{ background: "var(--bg)" }}>
      <div className="wrap py-12">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-mute-2">
              24 Horas de Adoração
            </p>
            <h1 className="display mt-2 text-3xl text-ink">Pedidos</h1>
          </div>
          <SyncButton />
        </div>

        {falhouLeitura && (
          <p className="mt-6 text-sm" style={{ color: "var(--blood)" }}>
            Não foi possível carregar os pedidos agora. Recarregue a página.
          </p>
        )}

        {/* Resumo: só o que foi pago — é o número que vai para a estamparia. */}
        <div className="card mt-8 flex flex-wrap items-center gap-x-10 gap-y-4 p-6">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-mute-2">
              Camisetas pagas
            </p>
            <p className="display mt-1 text-2xl tabular-nums text-ink">
              {resumo.camisetas}
            </p>
          </div>
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-mute-2">
              Recebido
            </p>
            <p className="display mt-1 text-2xl tabular-nums text-ink">
              R$ {resumo.receita}
            </p>
          </div>
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-mute-2">
              Por tamanho
            </p>
            <p className="mt-1 font-mono text-sm tabular-nums text-ink">
              {resumo.porTamanho.map((t) => `${t.size} ${t.qty}`).join("  ·  ")}
            </p>
          </div>
        </div>

        {pedidos.length === 0 ? (
          <p className="mt-10 text-sm text-mute">
            Nenhum pedido ainda. Assim que alguém gerar um Pix, ele aparece
            aqui.
          </p>
        ) : (
          /* Dez colunas não cabem num celular: a tabela rola dentro do próprio
             contêiner, e a página nunca rola na horizontal. */
          <div className="mt-8 overflow-x-auto rounded-xl border border-line">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-line">
                  <th className={TH}>Nome</th>
                  <th className={TH}>E-mail</th>
                  <th className={TH}>Telefone</th>
                  <th className={TH}>Modelo</th>
                  <th className={TH}>Tam.</th>
                  <th className={TH}>Qtd.</th>
                  <th className={TH}>Valor</th>
                  <th className={TH}>Data</th>
                  <th className={TH}>Hora</th>
                  <th className={TH}>Status</th>
                </tr>
              </thead>
              <tbody>
                {pedidos.map((p) => {
                  const quando = new Date(p.created_at);
                  return (
                    <tr
                      key={p.id}
                      className="border-b border-line-soft last:border-0"
                    >
                      <td className={TD}>{p.nome}</td>
                      <td className={TD}>{p.email}</td>
                      <td className={`${TD} font-mono tabular-nums`}>
                        {formatPhone(p.telefone)}
                      </td>
                      <td className={TD}>{p.fit}</td>
                      <td className={`${TD} font-mono`}>{p.size}</td>
                      <td className={`${TD} font-mono tabular-nums`}>{p.qty}</td>
                      <td className={`${TD} font-mono tabular-nums`}>
                        R$ {p.total}
                      </td>
                      <td className={`${TD} font-mono tabular-nums`}>
                        {FMT_DATA.format(quando)}
                      </td>
                      <td className={`${TD} font-mono tabular-nums`}>
                        {FMT_HORA.format(quando)}
                      </td>
                      <td
                        className={`${TD} font-mono text-[11px] uppercase tracking-wider`}
                      >
                        {STATUS[p.status] ?? p.status}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}
