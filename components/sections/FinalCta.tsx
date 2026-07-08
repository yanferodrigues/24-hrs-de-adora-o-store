"use client";

import { motion } from "framer-motion";
import { Reveal } from "@/components/Reveal";
import BuyButton from "@/components/BuyButton";
import Countdown from "@/components/Countdown";
import { PRODUCT } from "@/lib/data";

const line = {
  hidden: { y: "110%" },
  show: (i: number) => ({
    y: "0%",
    transition: { duration: 0.9, delay: i * 0.12, ease: [0.16, 1, 0.3, 1] },
  }),
};

export default function FinalCta() {
  return (
    <section className="relative flex min-h-[100svh] flex-col justify-between py-24">
      <div className="wrap">
        <Reveal>
          <p className="eyebrow flex items-center gap-3">
            <span className="inline-block h-px w-8 bg-[var(--accent)]" />
            07 — Última chamada
          </p>
        </Reveal>
      </div>

      <div className="wrap mt-auto">
        <Reveal>
          <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-mute-2">
            O congresso começa em
          </span>
        </Reveal>
        {/* fora do Reveal (que isola o stacking context) para o blend dos números
            funcionar sobre a camiseta, igual aos títulos */}
        <div className="mt-4">
          <Countdown blend />
        </div>

        {/* blend-invert fora do Reveal (que isola o stacking context e quebra o
            blend) — animação nas máscaras internas, como no Hero. */}
        <h2
          className="display blend-invert mt-10"
          style={{ fontSize: "clamp(2.8rem,11vw,8rem)" }}
        >
          <span className="block overflow-hidden py-[0.14em] -my-[0.14em]">
            <motion.span
              custom={0}
              variants={line}
              initial="hidden"
              animate="show"
              className="block"
            >
              Feito para adorar.
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
              24 <span className="outline-text">HORAS</span>
            </motion.span>
          </span>
        </h2>

        <Reveal delay={0.2}>
          <div className="mt-8 flex flex-col items-start gap-4 sm:flex-row sm:items-center">
            <BuyButton label="Quero a minha" showPrice />
            <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-mute-2">
              Edição limitada · entrega até {PRODUCT.eventDateLabel}
            </span>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
