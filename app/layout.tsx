import type { Metadata } from "next";
import { Oswald, Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

// Oswald: condensada bold estilo Nike, COM acentos completos (Bebas/Anton falham em À/Ó)
const display = Oswald({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});
const sans = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});
const cond = Oswald({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-cond",
  display: "swap",
});
const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "24 Horas de Adoração · Camiseta Oficial do Congresso",
  description:
    "A camiseta oficial do congresso 24 Horas de Adoração. O Rei no cavalo, em algodão premium. Edição limitada, entrega antes de 15/10/2026.",
  openGraph: {
    title: "24 Horas de Adoração · Camiseta Oficial",
    description:
      "A camiseta oficial do congresso. Da noite à glória. Edição limitada — estoque limitado.",
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
      className={`${display.variable} ${sans.variable} ${cond.variable} ${mono.variable}`}
    >
      <body>
        {children}
        <div className="grain" aria-hidden="true" />
      </body>
    </html>
  );
}
