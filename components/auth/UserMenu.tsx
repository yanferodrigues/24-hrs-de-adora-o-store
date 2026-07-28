"use client";

import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store";
import { createClient } from "@/lib/supabase/client";

/** Nome de quem está logado + sair. Nada quando não há sessão. */
export default function UserMenu() {
  const user = useStore((s) => s.user);
  const setUser = useStore((s) => s.setUser);
  const router = useRouter();

  if (!user) return null;

  const primeiroNome = (user.name || user.email).split(" ")[0];

  async function sair() {
    await createClient().auth.signOut();
    setUser(null);
    router.replace("/");
    router.refresh();
  }

  return (
    <div className="flex items-center gap-3">
      <span className="hidden font-mono text-[10px] uppercase tracking-[0.16em] text-mute sm:inline">
        {primeiroNome}
      </span>
      <button
        onClick={sair}
        className="font-mono text-[10px] uppercase tracking-[0.16em] text-mute-2 underline underline-offset-4 transition-colors hover:text-ink"
      >
        Sair
      </button>
    </div>
  );
}
