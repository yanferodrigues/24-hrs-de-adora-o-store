import type { Metadata } from "next";
import { Cinzel, Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { createClient } from "@/lib/supabase/server";
import { toSessionUser } from "@/lib/supabase/session";
import SessionHydrator from "@/components/SessionHydrator";

// Display: Cinzel — serifa romana/inscricional (monumental, "coroação"),
// combina com o tema Apocalipse 19 e cobre acentos PT-BR (À Ã Ç Ó).
const display = Cinzel({
  subsets: ["latin"],
  weight: ["500", "600", "700", "800", "900"],
  variable: "--font-display",
  display: "swap",
});
const sans = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});
const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "VOLTAREI · Congresso de Louvor — Camiseta Oficial",
  description:
    "A camiseta oficial do VOLTAREI, congresso de louvor da Igreja Brasil Para Cristo — 15/10/2026. O Rei no cavalo branco, Apocalipse 19. Estampa dourada em algodão premium, edição limitada.",
  openGraph: {
    title: "VOLTAREI · Congresso de Louvor",
    description:
      "O Rei está voltando. Apocalipse 19. Camiseta oficial do congresso de louvor VOLTAREI — Igreja Brasil Para Cristo, 15/10/2026.",
    type: "website",
  },
  robots: { index: true, follow: true },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <html
      lang="pt-BR"
      className={`${display.variable} ${sans.variable} ${mono.variable}`}
    >
      <body>
        <SessionHydrator user={toSessionUser(user)} />
        {children}
        <div className="grain" aria-hidden="true" />
      </body>
    </html>
  );
}
