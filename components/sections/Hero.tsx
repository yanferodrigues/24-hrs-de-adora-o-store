"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import BuyButton from "@/components/BuyButton";
import { PRODUCT } from "@/lib/data";

const ease = [0.16, 1, 0.3, 1] as const;

export default function Hero() {
  return (
    <section
      id="top"
      className="relative flex min-h-[100svh] flex-col items-center justify-center overflow-hidden px-6 pb-16 pt-28 text-center"
    >
      {/* tag sagrada de abertura */}
      <motion.p
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.9, ease }}
        className="sacred mb-10"
      >
        24 Horas de Adoração
      </motion.p>

      {/* relíquia: o lettering dourado brilhando no escuro */}
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 18 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 1.2, ease, delay: 0.1 }}
        className="relic relic-ink w-[min(92vw,780px)]"
      >
        <Image
          src="/designs/front.webp"
          alt="VOLTAREI — Congresso de Louvor, Apocalipse 19"
          width={2048}
          height={832}
          priority
          sizes="(max-width: 780px) 92vw, 780px"
          className="h-auto w-full"
        />
      </motion.div>

      {/* o que é: congresso de louvor — o nome (VOLTAREI) está na arte acima */}
      <motion.h1
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, ease, delay: 0.45 }}
        className="display mt-8 text-parchment"
        style={{
          fontSize: "clamp(1.15rem,3.2vw,2rem)",
          letterSpacing: "0.14em",
          lineHeight: 1.15,
        }}
      >
        Congresso de Louvor
      </motion.h1>

      {/* o traço da estampa, repetido sob o nome do congresso */}
      <motion.span
        aria-hidden
        initial={{ opacity: 0, scaleX: 0.2 }}
        animate={{ opacity: 1, scaleX: 1 }}
        transition={{ duration: 0.9, ease, delay: 0.55 }}
        className="blood-mark blood-mark-long mt-5"
      />

      {/* onde e quando */}
      <motion.p
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, ease, delay: 0.52 }}
        className="mt-4 font-mono text-[11px] uppercase tracking-[0.22em] text-gold-lite/90"
      >
        Igreja Brasil Para Cristo · 15 · 10 · 2026
      </motion.p>

      <motion.p
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, ease, delay: 0.6 }}
        className="mx-auto mt-5 max-w-md text-[15px] leading-relaxed text-mute"
      >
        A camiseta oficial do congresso. O Rei no cavalo branco —{" "}
        <span className="text-parchment">Voltará</span>. Estampa
        dourada em algodão premium, edição limitada.
      </motion.p>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, ease, delay: 0.7 }}
        className="mt-9 flex flex-col items-center gap-4"
      >
        <BuyButton showPrice />
        <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-mute-2">
          Pix · entrega antes de {PRODUCT.eventDateLabel}
        </span>
      </motion.div>
    </section>
  );
}
