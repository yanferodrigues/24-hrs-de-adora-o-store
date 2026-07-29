"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import {
  MSG,
  isValidEmail,
  isValidName,
  isValidPassword,
  normalizeEmail,
  normalizeName,
} from "@/lib/auth-validation";
import { INPUT_CLASS, LABEL_CLASS } from "./fields";

/**
 * Ícone do Google em SVG inline — o site não carrega assets externos.
 * As cores são as da marca, exigidas pelas diretrizes do Google: é a única
 * exceção à regra de usar só tokens do tema.
 */
function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#4285F4" d="M45.1 24.5c0-1.6-.1-3.2-.4-4.7H24v8.9h11.8c-.5 2.8-2 5.1-4.4 6.7v5.5h7.1c4.2-3.8 6.6-9.5 6.6-16.4z" />
      <path fill="#34A853" d="M24 46c6 0 11-2 14.6-5.4l-7.1-5.5c-2 1.3-4.5 2.1-7.5 2.1-5.8 0-10.6-3.9-12.4-9.1H4.3v5.7C7.9 41 15.4 46 24 46z" />
      <path fill="#FBBC05" d="M11.6 28.1c-.4-1.3-.7-2.7-.7-4.1s.3-2.8.7-4.1v-5.7H4.3A22 22 0 0 0 2 24c0 3.6.8 6.9 2.3 9.8l7.3-5.7z" />
      <path fill="#EA4335" d="M24 10.8c3.3 0 6.2 1.1 8.5 3.3l6.3-6.3C35 4.3 30 2 24 2 15.4 2 7.9 7 4.3 14.2l7.3 5.7c1.8-5.2 6.6-9.1 12.4-9.1z" />
    </svg>
  );
}

export default function AuthPanel({
  mode,
  next,
}: {
  mode: "login" | "register";
  next: string;
}) {
  const router = useRouter();
  const supabase = createClient();

  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(false);

  const registrando = mode === "register";

  async function entrarComGoogle() {
    setErro(null);
    setCarregando(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
      },
    });
    if (error) {
      setErro(MSG.oauth);
      setCarregando(false);
    }
    // Em caso de sucesso o browser navega para o Google; não desligamos o
    // "carregando" para o botão não voltar ao normal durante a saída.
  }

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);

    if (registrando && !isValidName(nome)) return setErro(MSG.nome);
    if (!isValidEmail(email)) return setErro(MSG.email);
    if (!isValidPassword(senha)) return setErro(MSG.senha);

    setCarregando(true);
    try {
      if (registrando) {
        const { data, error } = await supabase.auth.signUp({
          email: normalizeEmail(email),
          password: senha,
          options: { data: { name: normalizeName(nome) } },
        });

        // O Supabase responde SUCESSO quando o e-mail já existe, para não
        // deixar ninguém descobrir quais e-mails estão cadastrados. A única
        // pista é a lista de identities vir vazia.
        if (!error && data.user && data.user.identities?.length === 0) {
          setErro(MSG.emailEmUso);
          return;
        }
        if (error) {
          setErro(error.status === 429 ? MSG.tentativas : MSG.cadastro);
          return;
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: normalizeEmail(email),
          password: senha,
        });
        if (error) {
          setErro(error.status === 429 ? MSG.tentativas : MSG.credenciais);
          return;
        }
      }

      router.replace(next);
      router.refresh();
    } catch {
      setErro(MSG.rede);
    } finally {
      setCarregando(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={entrarComGoogle}
        disabled={carregando}
        className="btn-magnetic btn-ghost w-full disabled:cursor-not-allowed disabled:opacity-50"
      >
        <GoogleIcon />
        Entrar com Google
      </button>

      <div className="seam my-6">
        <span className="font-mono text-[10px] uppercase tracking-[0.2em]">
          ou
        </span>
      </div>

      <form onSubmit={enviar} noValidate>
        {registrando && (
          <div className="mb-4">
            <label className={LABEL_CLASS} htmlFor="nome">
              Nome completo
            </label>
            <input
              id="nome"
              className={INPUT_CLASS}
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Yan Felipe"
              autoComplete="name"
            />
          </div>
        )}

        <div className="mb-4">
          <label className={LABEL_CLASS} htmlFor="email">
            E-mail
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
        </div>

        <div className="mb-5">
          <label className={LABEL_CLASS} htmlFor="senha">
            Senha
          </label>
          <input
            id="senha"
            type="password"
            className={INPUT_CLASS}
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            placeholder={registrando ? "mínimo 8 caracteres" : "••••••••"}
            autoComplete={registrando ? "new-password" : "current-password"}
          />
        </div>

        {erro && (
          <p className="mb-4 text-center text-xs" style={{ color: "var(--blood)" }}>
            {erro}
          </p>
        )}

        <button
          type="submit"
          disabled={carregando}
          className="btn-magnetic w-full disabled:cursor-not-allowed disabled:opacity-50"
        >
          {carregando ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              {registrando ? "Criando conta…" : "Entrando…"}
            </>
          ) : registrando ? (
            "Criar conta"
          ) : (
            "Entrar"
          )}
        </button>
      </form>

      {!registrando && (
        <p className="mt-5 text-center">
          <Link
            href="/recuperar-senha"
            className="font-mono text-[10px] uppercase tracking-[0.16em] text-mute-2 underline underline-offset-4 transition-colors hover:text-ink"
          >
            Esqueci minha senha
          </Link>
        </p>
      )}
    </>
  );
}
