"use client";

import { useState } from "react";
import { Loader2, MailCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { MSG, isValidEmail, normalizeEmail } from "@/lib/auth-validation";

import { INPUT_CLASS, LABEL_CLASS } from "./fields";

export default function ResetForm() {
  const [email, setEmail] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(false);
  const [enviado, setEnviado] = useState(false);

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    if (!isValidEmail(email)) return setErro(MSG.email);

    setCarregando(true);
    try {
      const { error } = await createClient().auth.resetPasswordForEmail(
        normalizeEmail(email),
        {
          redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent("/nova-senha")}`,
        }
      );
      if (error) {
        setErro(error.status === 429 ? MSG.tentativas : MSG.rede);
        return;
      }
      // Sempre confirma, mesmo que o e-mail não exista: dizer "esse e-mail
      // não tem conta" deixaria descobrir quem está cadastrado.
      setEnviado(true);
    } catch {
      setErro(MSG.rede);
    } finally {
      setCarregando(false);
    }
  }

  if (enviado) {
    return (
      <div className="flex flex-col items-center gap-4 text-center">
        <MailCheck size={40} className="gold-text" />
        <p className="text-sm leading-relaxed text-mute">
          Se existir uma conta com esse e-mail, o link para criar uma senha nova
          já está a caminho. Confira também a caixa de spam.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={enviar} noValidate>
      <label
        className={LABEL_CLASS}
        htmlFor="email"
      >
        E-mail da conta
      </label>
      <input
        id="email"
        type="email"
        inputMode="email"
        className={INPUT_CLASS}
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="voce@email.com"
        autoComplete="email"
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
            Enviando…
          </>
        ) : (
          "Enviar link"
        )}
      </button>
    </form>
  );
}
