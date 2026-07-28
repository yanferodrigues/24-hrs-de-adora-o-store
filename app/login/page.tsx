import Link from "next/link";
import { redirect } from "next/navigation";
import AuthShell from "@/components/auth/AuthShell";
import AuthPanel from "@/components/auth/AuthPanel";
import { createClient } from "@/lib/supabase/server";
import { safeNext, MSG } from "@/lib/auth-validation";

export const metadata = { title: "Entrar · VOLTAREI" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: { next?: string; erro?: string };
}) {
  const next = safeNext(searchParams.next);

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Quem já entrou não tem o que fazer nesta tela.
  if (user) redirect(next);

  return (
    <AuthShell
      rotulo="Apocalipse 19"
      titulo="Entrar"
      rodape={
        <>
          Ainda não tem conta?{" "}
          <Link
            href={`/cadastro?next=${encodeURIComponent(next)}`}
            className="gold-text underline underline-offset-4"
          >
            Criar conta
          </Link>
        </>
      }
    >
      {searchParams.erro === "oauth" && (
        <p className="mb-4 text-center text-xs" style={{ color: "var(--blood)" }}>
          {MSG.oauth}
        </p>
      )}
      <AuthPanel mode="login" next={next} />
    </AuthShell>
  );
}
