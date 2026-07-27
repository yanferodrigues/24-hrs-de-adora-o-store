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

const SLOTS: Slot[] = [
  { src: null, file: "/pessoas/01.webp", cap: "No corpo · 01" },
  { src: null, file: "/pessoas/02.webp", cap: "No corpo · 02" },
  { src: null, file: "/pessoas/03.webp", cap: "No corpo · 03" },
  { src: null, file: "/pessoas/04.webp", cap: "No corpo · 04" },
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
          <p className="mt-4 max-w-md text-[15px] leading-relaxed text-mute">
            A peça no corpo — na rua, no ensaio, no congresso.
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
                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                    <figcaption className="absolute bottom-3 left-3 font-mono text-[9px] uppercase tracking-[0.2em] text-gold-lite/90">
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
