"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { MSG, isValidPassword } from "@/lib/auth-validation";

import { INPUT_CLASS, LABEL_CLASS } from "./fields";

export default function NovaSenhaForm() {
  const router = useRouter();
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(false);

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    if (!isValidPassword(senha)) return setErro(MSG.senha);

    setCarregando(true);
    try {
      const { error } = await createClient().auth.updateUser({
        password: senha,
      });
      if (error) {
        // Mensagem crua da API do Supabase (em inglês) nunca vai pra tela;
        // a causa mais provável aqui é o link de recuperação ter expirado.
        setErro(MSG.novaSenha);
        return;
      }
      router.replace("/produto");
      router.refresh();
    } catch {
      setErro(MSG.rede);
    } finally {
      setCarregando(false);
    }
  }

  return (
    <form onSubmit={enviar} noValidate>
      <label
        className={LABEL_CLASS}
        htmlFor="senha"
      >
        Nova senha
      </label>
      <input
        id="senha"
        type="password"
        className={INPUT_CLASS}
        value={senha}
        onChange={(e) => setSenha(e.target.value)}
        placeholder="mínimo 8 caracteres"
        autoComplete="new-password"
      />

      {erro && (
        <p className="mt-4 text-center text-xs" style={{ color: "var(--blood)" }}>
          {erro}
        </p>
      )}

      <button
        type="submit"
        disabled={carregando}
        className="btn-magnetic mt-5 w-full disabled:cursor-not-allowed disabled:opacity-50"
      >
        {carregando ? (
          <>
            <Loader2 size={16} className="animate-spin" />
            Salvando…
          </>
        ) : (
          "Salvar senha"
        )}
      </button>
    </form>
  );
}
