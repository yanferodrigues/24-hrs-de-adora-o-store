import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

/** Moldura compartilhada por login, cadastro e recuperação de senha. */
export default function AuthShell({
  rotulo,
  titulo,
  children,
  rodape,
}: {
  rotulo: string;
  titulo: string;
  children: ReactNode;
  rodape?: ReactNode;
}) {
  return (
    <div
      className="flex min-h-screen flex-col items-center justify-center px-6 py-16"
      style={{ background: "var(--bg)" }}
    >
      <Link href="/" className="relic relic-ink mb-10 block w-full max-w-[280px]">
        <Image
          src="/designs/front.webp"
          alt="VOLTAREI — Apocalipse 19"
          width={2048}
          height={832}
          priority
          className="h-auto w-full"
        />
      </Link>

      <div className="card w-full max-w-[400px] px-7 py-8">
        <p className="sacred mb-2">{rotulo}</p>
        <h1 className="display mb-7 text-3xl">{titulo}</h1>
        {children}
      </div>

      {rodape && (
        <div className="mt-6 text-center text-sm text-mute">{rodape}</div>
      )}
    </div>
  );
}
