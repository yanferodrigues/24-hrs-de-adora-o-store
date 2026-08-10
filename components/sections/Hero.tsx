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
      className="on-shot relative flex min-h-[100svh] flex-col items-center justify-center overflow-hidden px-6 pb-28 pt-28 text-center"
    >
      {/* A foto de abertura: o congresso já vestindo a peça. `z-0` no wrapper
          cria o contexto de empilhamento, então o véu (::before/::after, z 1 e
          2) cobre a imagem e o conteúdo (z-10) fica acima de tudo. */}
      <div aria-hidden className="shot-veil absolute inset-0 z-0">
        <Image
          src="/imagens/fundo-principal.jpg"
          alt=""
          fill
          priority
          quality={82}
          sizes="100vw"
          className="object-cover object-center"
        />
      </div>

      <div className="relative z-10 flex w-full flex-col items-center">
        {/* tag sagrada de abertura */}
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, ease }}
          className="sacred mb-10"
        >
          CONGRESSO DE LOUVOR E ADORAÇÃO
        </motion.p>

        {/* relíquia: o lettering dourado brilhando no escuro */}
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 18 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 1.2, ease, delay: 0.1 }}
          className="relic relic-shot w-[min(88vw,720px)]"
        >
          <Image
            src="/designs/front.webp"
            alt="VOLTAREI — Congresso de Louvor, Apocalipse 19"
            width={2048}
            height={832}
            priority
            sizes="(max-width: 720px) 88vw, 720px"
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
          24 HORAS DE ADORAÇÃO
        </motion.h1>

        {/* onde e quando */}
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease, delay: 0.52 }}
          className="mt-4 font-mono text-[11px] uppercase tracking-[0.22em] text-gold-lite"
        >
          Igreja Brasil Para Cristo · 23 e 24 de Outubro
        </motion.p>



        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease, delay: 0.6 }}
          className="mx-auto mt-5 max-w-md text-[15px] leading-relaxed text-mute"
        >
          
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease, delay: 0.7 }}
          className="mt-9 flex flex-col items-center gap-4"
        >
          <BuyButton showPrice />
          <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-mute-2">
            Pix · Faça seu pedido até {PRODUCT.eventDateLabel}
          </span>
        </motion.div>

                <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease, delay: 0.7 }}
          className="mt-9 flex flex-col items-center gap-4"
        >
        </motion.div>
      </div>
    </section>
  );
}
