"use client";

import { Reveal } from "@/components/Reveal";

export default function Manifesto() {
  return (
    <section className="relative py-32">
      <div className="wrap max-w-3xl text-center">
        <Reveal>
          <p className="seam mb-10">
            <span className="sacred">24 horas de adoração</span>
          </p>
        </Reveal>
        <Reveal delay={0.05}>
          <p
            className="display text-parchment"
            style={{
              fontSize: "clamp(1.9rem,5.2vw,3.6rem)",
              lineHeight: 1.16,
              fontWeight: 600,
            }}
          >
            Não é apenas uma camiseta.
            <br />É uma{" "}
            <span className="gold-text">declaração</span>: Ele virá!
          </p>
        </Reveal>
        <Reveal delay={0.09}>
          <span aria-hidden className="blood-mark mx-auto mt-8" />
        </Reveal>
        <Reveal delay={0.12}>
          <p className="mx-auto mt-8 max-w-xl text-[15px] leading-relaxed text-mute">
            &ldquo;“Eis que venho sem demora.”&rdquo;  — Apocalipse 22:12
          </p>
        </Reveal>
      </div>
    </section>
  );
}
