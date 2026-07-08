"use client";

import { motion } from "framer-motion";
import BuyButton from "@/components/BuyButton";

const line = {
  hidden: { y: "110%" },
  show: (i: number) => ({
    y: "0%",
    transition: { duration: 0.9, delay: 0.15 + i * 0.12, ease: [0.16, 1, 0.3, 1] },
  }),
};

export default function Hero() {
  return (
    <section
      id="top"
      className="relative flex min-h-[100svh] flex-col justify-between pt-28 pb-10"
    >
      <div className="wrap">
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1, duration: 0.8 }}
          className="eyebrow flex items-center gap-3"
        >
          <span className="inline-block h-px w-8 bg-[var(--accent)]" />
          Edição 2026 · Estoque limitado
        </motion.p>
      </div>

      <div className="wrap">
        <h1 className="display blend-invert" style={{ fontSize: "clamp(3.6rem,15vw,12rem)" }}>
          <span className="block overflow-hidden py-[0.14em] -my-[0.14em]">
            <motion.span custom={0} variants={line} initial="hidden" animate="show" className="block">
              24 HORAS
            </motion.span>
          </span>
          <span className="block overflow-hidden py-[0.14em] -my-[0.14em]">
            <motion.span custom={1} variants={line} initial="hidden" animate="show" className="block">
              DE <span className="outline-text">ADORAÇÃO</span>
            </motion.span>
          </span>
        </h1>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.8 }}
          className="mt-7 flex flex-col gap-6 md:flex-row md:items-end md:justify-between"
        >
          <p className="max-w-md text-[15px] leading-relaxed text-mute">
            A camiseta oficial do evento.—{" "}
            <b className="text-ink">o Rei está voltando</b> — em algodão premium.
            Edição limitada, entrega antes do evento.
          </p>
          <div className="flex flex-col items-start gap-3">
            <BuyButton showPrice />
            <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-mute-2">
              Pix · entrega antes do congresso ·
            </span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
