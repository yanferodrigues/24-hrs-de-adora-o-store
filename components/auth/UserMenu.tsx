"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store";
import { createClient } from "@/lib/supabase/client";

/** Nome de quem está logado + sair. Nada quando não há sessão. */
export default function UserMenu() {
  const user = useStore((s) => s.user);
  const setUser = useStore((s) => s.setUser);
  const router = useRouter();
  const [erro, setErro] = useState(false);
  const [saindo, setSaindo] = useState(false);

  if (!user) return null;

  const primeiroNome = (user.name || user.email).split(" ")[0];

  async function sair() {
    setErro(false);
    setSaindo(true);
    try {
      // Sem tratar o erro, um signOut que falha (rede caída, Supabase fora do
      // ar) deixava o botão "Sair" mudo: a pessoa clicava e continuava logada
      // sem entender por quê. Só limpamos a sessão local se de fato saiu.
      const { error } = await createClient().auth.signOut();
      if (error) {
        console.error("[auth] signOut falhou:", error.message);
        setErro(true);
        return;
      }
      setUser(null);
      router.replace("/");
      router.refresh();
    } catch (e) {
      console.error("[auth] signOut falhou:", e);
      setErro(true);
    } finally {
      setSaindo(false);
    }
  }

  return (
    <div className="flex items-center gap-3">
      <span className="hidden font-mono text-[10px] uppercase tracking-[0.16em] text-mute sm:inline">
        {primeiroNome}
      </span>
      {erro && (
        <span
          role="status"
          className="font-mono text-[10px] uppercase tracking-[0.16em] text-blood-lite"
        >
          Não foi possível sair
        </span>
      )}
      <button
        onClick={sair}
        disabled={saindo}
        className="font-mono text-[10px] uppercase tracking-[0.16em] text-mute-2 underline underline-offset-4 transition-colors hover:text-ink disabled:opacity-50"
      >
        {saindo ? "Saindo…" : erro ? "Tentar de novo" : "Sair"}
      </button>
    </div>
  );
}
