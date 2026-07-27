import type { Metadata } from "next";
import { Cinzel, Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

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
  title: "VOLTAREI · 24 Horas de Adoração — Camiseta Oficial",
  description:
    "A camiseta oficial do congresso 24 Horas de Adoração. VOLTAREI — o Rei no cavalo branco, Apocalipse 19. Estampa dourada em algodão premium. Edição limitada, entrega antes de 15/10/2026.",
  openGraph: {
    title: "VOLTAREI · 24 Horas de Adoração",
    description:
      "O Rei está voltando. Apocalipse 19. Camiseta oficial do congresso — edição limitada.",
    type: "website",
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="pt-BR"
      className={`${display.variable} ${sans.variable} ${mono.variable}`}
    >
      <body>
        {children}
        <div className="grain" aria-hidden="true" />
      </body>
    </html>
  );
}
