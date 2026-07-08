"use client";

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
