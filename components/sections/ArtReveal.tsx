"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { Reveal } from "@/components/Reveal";

const line = {
  hidden: { y: "110%" },
  show: (i: number) => ({
    y: "0%",
    transition: { duration: 0.9, delay: i * 0.12, ease: [0.16, 1, 0.3, 1] },
  }),
};

const points = [
  { n: "A", label: "O Cavaleiro", desc: "Fiel e Verdadeiro, montado no cavalo (Ap 19)." },
  { n: "B", label: "A multidão", desc: "Todo joelho se dobra em adoração." },
  { n: "C", label: "Os raios", desc: "A glória rompendo a escuridão." },
];

export default function ArtReveal() {
  return (
    <section className="relative min-h-[100svh] py-24">
      {/* palco: a camiseta 3D aparece atrás (canvas fixo) */}
      <div className="wrap flex h-full flex-col justify-between">
        {/* grid comum (não isola stacking context) — título à esquerda, foto à direita */}
        <div className="grid items-center gap-10 lg:grid-cols-2">
          <div className="max-w-md">
            <Reveal>
              <p className="eyebrow mb-4">02 — A Arte</p>
            </Reveal>
            {/* blend-invert fora de qualquer wrapper que isole o stacking context
                (Reveal cria um) — animação nas máscaras internas, como no Hero. */}
            <h2 className="display blend-invert" style={{ fontSize: "clamp(2.4rem,7vw,5rem)" }}>
              <span className="block overflow-hidden py-[0.14em] -my-[0.14em]">
                <motion.span
                  custom={0}
                  variants={line}
                  initial="hidden"
                  animate="show"
                  className="block"
                >
                  Uma cena.
                </motion.span>
              </span>
              <span className="block overflow-hidden py-[0.14em] -my-[0.14em]">
                <motion.span
                  custom={1}
                  variants={line}
                  initial="hidden"
                  animate="show"
                  className="block"
                >
                  Impressa para adorar.
                </motion.span>
              </span>
            </h2>
          </div>

          {/* foto real das costas — irmã do título, pode usar Reveal à vontade */}
          <Reveal delay={0.15} className="justify-self-center lg:justify-self-end">
            <figure className="relative w-[min(78vw,420px)] overflow-hidden rounded-2xl border border-line/70 shadow-2xl">
              <Image
                src="/imagens/mockup-costas.webp"
                alt="Costas da camiseta — o Rei montado no cavalo (Apocalipse 19)"
                width={990}
                height={1400}
                sizes="(max-width: 1024px) 78vw, 420px"
                className="h-auto w-full"
              />
              <figcaption className="absolute bottom-3 left-3 font-mono text-[9px] uppercase tracking-[0.2em] text-white/80">
                Costas · impressão premium
              </figcaption>
            </figure>
          </Reveal>
        </div>

        <div className="mt-auto grid gap-4 pt-16 sm:grid-cols-3">
          {points.map((p, i) => (
            <Reveal key={p.n} delay={i * 0.1}>
              <div className="rounded-xl border border-line/70 bg-[color-mix(in_srgb,var(--surface)_70%,transparent)] p-4 backdrop-blur-sm">
                <span className="display text-2xl text-ink">{p.n}</span>
                <div className="mt-1 text-sm font-semibold text-ink">{p.label}</div>
                <div className="text-xs text-mute">{p.desc}</div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
