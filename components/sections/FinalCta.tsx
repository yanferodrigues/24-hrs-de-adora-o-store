"use client";

import { Reveal } from "@/components/Reveal";
import BuyButton from "@/components/BuyButton";
import Countdown from "@/components/Countdown";
import { PRODUCT } from "@/lib/data";

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
          <div className="mt-4">
            <Countdown />
          </div>
        </Reveal>

        <Reveal delay={0.1}>
          <h2
            className="display blend-invert mt-10"
            style={{ fontSize: "clamp(2.8rem,11vw,8rem)" }}
          >
            Feito para durar<br />a <span className="outline-text">vigília</span>
          </h2>
        </Reveal>

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
