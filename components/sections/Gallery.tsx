"use client";

import Image from "next/image";
import { Reveal } from "@/components/Reveal";

const FRENTE = "/imagens/mockup-frente.webp";
const COSTAS = "/imagens/mockup-costas.webp";

/* Grade editorial: as fotos de estúdio da peça (frente + costas) ao lado de
   duas fotos no corpo. O mockup mostra a estampa inteira e reta; a foto no
   corpo mostra o tamanho real dela em quem vai vestir — uma coisa não
   substitui a outra, então a grade tem as duas. */
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
    src: "/pessoas/07-costas.jpg",
    span: "",
    ratio: "aspect-square",
    cap: "Costas · no corpo",
    fit: "object-cover object-[50%_62%]",
    zoom: "scale-[1.15] group-hover:scale-[1.22]",
  },
  {
    src: "/pessoas/08-detalhe.jpg",
    span: "",
    ratio: "aspect-square",
    cap: "Detalhe · lettering",
    fit: "object-cover object-center",
    zoom: "group-hover:scale-105",
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
    <section className="relative py-28">
      <div className="wrap">
        <Reveal>
          <p className="sacred mb-4">A Peça</p>
          <h2
            className="display text-parchment"
            style={{ fontSize: "clamp(2rem,5.5vw,3.6rem)", lineHeight: 1.04 }}
          >
            Ouro sobre o preto
          </h2>
          <span aria-hidden className="blood-mark mt-6" />
        </Reveal>

        <div className="mt-14 grid auto-rows-[minmax(0,1fr)] grid-cols-2 gap-3 sm:grid-cols-4">
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
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />
                <figcaption className="cap-foto absolute bottom-3 left-3 font-mono text-[9px] uppercase tracking-[0.2em]">
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
