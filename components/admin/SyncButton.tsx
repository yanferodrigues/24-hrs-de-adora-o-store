"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, RefreshCw } from "lucide-react";

/**
 * Único componente client da tela de admin. Reconsulta os pendentes no Mercado
 * Pago e recarrega a página (Server Component) para a tabela refletir.
 */
export default function SyncButton() {
  const router = useRouter();
  const [rodando, setRodando] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);

  async function sincronizar() {
    setRodando(true);
    setAviso(null);
    try {
      const res = await fetch("/api/admin/sync", { method: "POST" });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setAviso("Não foi possível sincronizar agora.");
        return;
      }
      if (data.configured === false) {
        setAviso("O pagamento ainda não está configurado (falta o token).");
        return;
      }

      setAviso(
        data.updated > 0
          ? `${data.updated} pedido(s) atualizado(s).`
          : `Nada mudou (${data.checked} pendente(s) conferido(s)).`
      );
      router.refresh();
    } catch {
      setAviso("Falha de conexão. Tente novamente.");
    } finally {
      setRodando(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <button
        type="button"
        onClick={sincronizar}
        disabled={rodando}
        className="btn-magnetic btn-ghost flex items-center gap-2 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {rodando ? (
          <Loader2 size={15} className="animate-spin" />
        ) : (
          <RefreshCw size={15} />
        )}
        {rodando ? "Sincronizando…" : "Sincronizar status"}
      </button>
      {aviso && (
        <span
          role="status"
          className="font-mono text-[10px] uppercase tracking-[0.16em] text-mute"
        >
          {aviso}
        </span>
      )}
    </div>
  );
}
