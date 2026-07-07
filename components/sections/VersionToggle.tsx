"use client";

import { Reveal } from "@/components/Reveal";
import { useStore } from "@/lib/store";

export default function VersionToggle() {
  const mood = useStore((s) => s.mood);
  const setMood = useStore((s) => s.setMood);

  return (
    <section
      className="relative z-10 py-28"
      style={{ background: "var(--bg)" }}
    >
      <div className="wrap">
        <Reveal>
          <p className="eyebrow mb-3">04 — As duas versões</p>
          <h2
            className="display text-ink"
            style={{ fontSize: "clamp(2rem,6vw,4rem)" }}
          >
            A mesma estampa.<br />Dois mundos.
          </h2>
        </Reveal>

        <div className="mt-12 grid gap-5 md:grid-cols-2">
          <Reveal>
            <button
              onClick={() => setMood("night")}
              className="group relative flex h-64 w-full flex-col justify-end overflow-hidden rounded-2xl border p-7 text-left"
              style={{
                background: "#0a0a0b",
                borderColor: mood === "night" ? "#ffffff" : "#262629",
              }}
            >
              <span className="font-mono text-[10px] uppercase tracking-[0.24em] text-[#9a9aa0]">
                Versão preta
              </span>
              <span className="display mt-2 text-4xl text-white">
                Noite
              </span>
              <span className="mt-1 text-sm text-[#9a9aa0]">
                Fundo preto, camiseta clara. A vigília no escuro.
              </span>
            </button>
          </Reveal>

          <Reveal delay={0.08}>
            <button
              onClick={() => setMood("dawn")}
              className="group relative flex h-64 w-full flex-col justify-end overflow-hidden rounded-2xl border p-7 text-left"
              style={{
                background: "#fafaf8",
                borderColor: mood === "dawn" ? "#0a0a0b" : "#e3e3de",
              }}
            >
              <span className="font-mono text-[10px] uppercase tracking-[0.24em] text-[#5f5f63]">
                Versão branca
              </span>
              <span className="display mt-2 text-4xl text-[#0a0a0b]">
                Amanhecer
              </span>
              <span className="mt-1 text-sm text-[#5f5f63]">
                Fundo branco, camiseta escura. A luz da vitória.
              </span>
            </button>
          </Reveal>
        </div>
        <Reveal>
          <p className="mt-6 font-mono text-[11px] uppercase tracking-[0.14em] text-mute-2">
            Toque numa versão — o site inteiro troca de tema, sem recarregar.
          </p>
        </Reveal>
      </div>
    </section>
  );
}
