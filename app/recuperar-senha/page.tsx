import Link from "next/link";
import AuthShell from "@/components/auth/AuthShell";
import ResetForm from "@/components/auth/ResetForm";

export const metadata = { title: "Recuperar senha · VOLTAREI" };

export default function RecuperarSenhaPage() {
  return (
    <AuthShell
      rotulo="Apocalipse 19"
      titulo="Recuperar senha"
      rodape={
        <Link href="/login" className="gold-text underline underline-offset-4">
          Voltar para o login
        </Link>
      }
    >
      <ResetForm />
    </AuthShell>
  );
}
