"use client";

import { Reveal } from "@/components/Reveal";

export default function Manifesto() {
  return (
    <section
      className="relative z-10 py-32"
      style={{ background: "var(--bg)" }}
    >
      <div className="wrap">
        <Reveal>
          <p className="eyebrow mb-8">01 — Manifesto</p>
        </Reveal>
        <Reveal delay={0.05}>
          <p
            className="max-w-4xl font-cond text-ink"
            style={{
              fontSize: "clamp(1.6rem,4.4vw,3rem)",
              lineHeight: 1.18,
              fontWeight: 400,
            }}
          >
            Não é apenas uma camiseta.
            É também um lembrete {" "}
             — <span className="text-mute"> O REI ESTÁ VOLTANDO. </span>
          </p>
        </Reveal>
      </div>
    </section>
  );
}
