"use client";

import { Reveal } from "@/components/Reveal";
import BuyButton from "@/components/BuyButton";
import Countdown from "@/components/Countdown";
import { PRODUCT } from "@/lib/data";

export default function FinalCta() {
  return (
    <section className="relative overflow-hidden py-32">
      <div className="wrap max-w-3xl text-center">
        <Reveal>
          <p className="seam mb-10">
            <span className="sacred">Última chamada</span>
          </p>
        </Reveal>

        <Reveal delay={0.05}>
          <span className="font-mono text-[11px] uppercase tracking-[0.24em] text-mute-2">
            O congresso começa em
          </span>
          <div className="mt-5 flex justify-center">
            <Countdown />
          </div>
        </Reveal>

        <Reveal delay={0.1}>
          <h2
            className="display mt-12 text-parchment"
            style={{ fontSize: "clamp(2.4rem,8vw,5.5rem)", lineHeight: 1.0 }}
          >
            Garanta sua <span className="gold-text"> camiseta</span>
          </h2>
          <span aria-hidden className="blood-mark blood-mark-long mx-auto mt-8" />
        </Reveal>

        <Reveal delay={0.18}>
          <div className="mt-10 flex flex-col items-center gap-4">
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
