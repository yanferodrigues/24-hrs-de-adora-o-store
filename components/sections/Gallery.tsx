"use client";

import Image from "next/image";
import { Reveal } from "@/components/Reveal";

const FRENTE = "/imagens/mockup-frente.webp";
const COSTAS = "/imagens/mockup-costas.webp";

// grid editorial com as fotos reais (frente + costas) e dois close-ups da estampa
const TILES = [
  {
    src: COSTAS,
    span: "sm:col-span-2 sm:row-span-2",
    ratio: "aspect-[4/5]",
    cap: "Costas · Apocalipse 19",
    fit: "object-cover object-top",
    zoom: "group-hover:scale-105",
  },
  {
    src: COSTAS,
    span: "",
    ratio: "aspect-square",
    cap: "Close · estampa",
    fit: "object-cover",
    zoom: "scale-[1.9] object-[50%_38%] group-hover:scale-[2.02]",
  },
  {
    src: FRENTE,
    span: "",
    ratio: "aspect-square",
    cap: "Detalhe · lettering",
    fit: "object-cover",
    zoom: "scale-[1.7] object-[50%_34%] group-hover:scale-[1.82]",
  },
  {
    src: FRENTE,
    span: "sm:col-span-2",
    ratio: "aspect-[16/9]",
    cap: "Frente · Voltarei",
    fit: "object-cover object-top",
    zoom: "group-hover:scale-105",
  },
];

export default function Gallery() {
  return (
    <section className="relative z-10 py-28" style={{ background: "var(--bg)" }}>
      <div className="wrap">
        <Reveal>
          <p className="eyebrow mb-3">04 — Galeria</p>
          <h2 className="display text-ink" style={{ fontSize: "clamp(2rem,6vw,4rem)" }}>
            Vestida na vida real
          </h2>
        </Reveal>

        <div className="mt-12 grid auto-rows-[minmax(0,1fr)] grid-cols-2 gap-3 sm:grid-cols-4">
          {TILES.map((t, i) => (
            <Reveal key={i} delay={i * 0.05} className={t.span}>
              <figure
                className={`group relative h-full w-full overflow-hidden rounded-xl border border-line ${t.ratio}`}
              >
                <Image
                  src={t.src}
                  alt={t.cap}
                  fill
                  sizes="(max-width: 640px) 50vw, 25vw"
                  className={`${t.fit} ${t.zoom} transition-transform duration-700`}
                />
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                <figcaption className="absolute bottom-3 left-3 font-mono text-[9px] uppercase tracking-[0.2em] text-white/80">
                  {t.cap}
                </figcaption>
              </figure>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
