"use client";

import Image from "next/image";
import { Reveal } from "@/components/Reveal";

/**
 * Espaços reservados para as fotos de pessoas vestindo a camiseta.
 *
 * Para publicar uma foto: coloque o arquivo em `public/pessoas/` com o nome
 * indicado abaixo (webp de preferência, retrato ~3:4, ≤ ~400kb) e troque o
 * `src: null` pelo mesmo caminho. Enquanto for `null`, o slot aparece como
 * moldura vazia — de propósito, para lembrar de preencher antes de publicar.
 */
type Slot = {
  src: string | null;
  file: string;
  cap: string;
  /** enquadramento quando a foto entrar (ex.: "object-cover object-top") */
  fit?: string;
};

/* Duas fileiras de quatro no desktop: em cima a frente (o lettering), embaixo
   as costas (a cena do Rei) e o close do peito. Quem rola vê o produto inteiro
   sem precisar abrir a página do produto. */
const SLOTS: Slot[] = [
  { src: "/pessoas/01.webp", file: "/pessoas/01.webp", cap: "Frente · 01" },
  { src: "/pessoas/02.webp", file: "/pessoas/02.webp", cap: "Frente · 02" },
  { src: "/pessoas/03.webp", file: "/pessoas/03.webp", cap: "Frente · 03" },
  { src: "/pessoas/04.webp", file: "/pessoas/04.webp", cap: "Frente · 04" },
  {
    src: "/pessoas/05-costas.jpg",
    file: "/pessoas/05-costas.jpg",
    cap: "Costas · o Rei",
    fit: "object-cover object-top",
  },
  {
    src: "/pessoas/07-costas.jpg",
    file: "/pessoas/07-costas.jpg",
    cap: "Costas · Apocalipse 19",
    fit: "object-cover object-top",
  },
  {
    src: "/pessoas/06-costas.jpg",
    file: "/pessoas/06-costas.jpg",
    cap: "Costas · no corpo",
    fit: "object-cover object-top",
  },
  {
    src: "/pessoas/08-detalhe.jpg",
    file: "/pessoas/08-detalhe.jpg",
    cap: "Detalhe · lettering",
  },
];

export default function PeopleWearing() {
  return (
    <section id="vestindo" className="relative py-24">
      <div className="wrap">
        <Reveal>
          <p className="sacred mb-4">Vestindo</p>
          <h2
            className="display text-parchment"
            style={{ fontSize: "clamp(1.8rem,4.6vw,3rem)", lineHeight: 1.06 }}
          >
            Quem já está com ela
          </h2>
          <span aria-hidden className="blood-mark mt-6" />
          <p className="mt-4 max-w-md text-[15px] leading-relaxed text-mute">
            A peça no corpo — frente e costas, sem retoque.
          </p>
        </Reveal>

        {/* trilho: rola no celular, vira grade no desktop */}
        <div className="no-scrollbar mt-12 flex snap-x snap-mandatory gap-3 overflow-x-auto pb-2 sm:grid sm:grid-cols-4 sm:overflow-visible sm:pb-0">
          {SLOTS.map((slot, i) => (
            <Reveal
              key={slot.file}
              delay={i * 0.06}
              className="w-[68vw] shrink-0 snap-start sm:w-auto"
            >
              <figure className="group relative aspect-[3/4] w-full overflow-hidden rounded-xl border border-line">
                {slot.src ? (
                  <>
                    <Image
                      src={slot.src}
                      alt={slot.cap}
                      fill
                      sizes="(max-width: 640px) 68vw, 25vw"
                      className={`${
                        slot.fit ?? "object-cover object-center"
                      } transition-transform duration-700 group-hover:scale-105`}
                    />
                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />
                    <figcaption className="cap-foto absolute bottom-3 left-3 font-mono text-[9px] uppercase tracking-[0.2em]">
                      {slot.cap}
                    </figcaption>
                  </>
                ) : (
                  <EmptySlot file={slot.file} cap={slot.cap} />
                )}
              </figure>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/** moldura vazia — hairline dourada tracejada + o caminho do arquivo esperado */
function EmptySlot({ file, cap }: { file: string; cap: string }) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-[var(--surface-2)] p-4 text-center">
      <span
        aria-hidden
        className="absolute inset-2 rounded-lg border border-dashed border-gold-deep/60"
      />
      <span className="font-mono text-[22px] leading-none text-gold-deep">+</span>
      <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-mute-2">
        {cap}
      </span>
      <span className="max-w-full break-all font-mono text-[9px] text-gold-deep/80">
        {file}
      </span>
    </div>
  );
}
