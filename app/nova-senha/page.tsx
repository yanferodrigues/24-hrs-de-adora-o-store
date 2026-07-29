import { redirect } from "next/navigation";
import AuthShell from "@/components/auth/AuthShell";
import NovaSenhaForm from "@/components/auth/NovaSenhaForm";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Nova senha · VOLTAREI" };

export default async function NovaSenhaPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Só chega aqui quem veio do link do e-mail, que já criou a sessão no
  // /auth/callback. Sem sessão, não há o que trocar.
  if (!user) redirect("/recuperar-senha");

  return (
    <AuthShell rotulo="Apocalipse 19" titulo="Nova senha">
      <NovaSenhaForm />
    </AuthShell>
  );
}
