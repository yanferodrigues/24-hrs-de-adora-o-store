import Link from "next/link";
import { redirect } from "next/navigation";
import AuthShell from "@/components/auth/AuthShell";
import AuthPanel from "@/components/auth/AuthPanel";
import { createClient } from "@/lib/supabase/server";
import { safeNext } from "@/lib/auth-validation";

export const metadata = { title: "Criar conta · VOLTAREI" };

export default async function CadastroPage({
  searchParams,
}: {
  searchParams: { next?: string };
}) {
  const next = safeNext(searchParams.next);

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) redirect(next);

  return (
    <AuthShell
      rotulo="Apocalipse 19"
      titulo="Criar conta"
      rodape={
        <>
          Já tem conta?{" "}
          <Link
            href={`/login?next=${encodeURIComponent(next)}`}
            className="gold-text underline underline-offset-4"
          >
            Entrar
          </Link>
        </>
      }
    >
      <AuthPanel mode="register" next={next} />
    </AuthShell>
  );
}
