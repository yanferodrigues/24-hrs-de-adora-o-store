"use client";

import { Reveal } from "@/components/Reveal";
import { FEATURES } from "@/lib/data";
import { Shirt, Ruler, Scissors, Sparkles } from "lucide-react";

const icons = [Shirt, Ruler, Scissors, Sparkles];

export default function Features() {
  return (
    <section
      className="relative z-10 py-28"
      style={{ background: "var(--bg)" }}
    >
      <div className="wrap">
        <Reveal>
          <p className="eyebrow mb-3">03 — Diferenciais</p>
          <h2
            className="display text-ink"
            style={{ fontSize: "clamp(2rem,6vw,4rem)" }}
          >
            Feita para durar a vigília
          </h2>
        </Reveal>

        <div className="mt-12 grid gap-px overflow-hidden rounded-2xl border border-line bg-line sm:grid-cols-2">
          {FEATURES.map((f, i) => {
            const Icon = icons[i];
            return (
              <Reveal key={f.title} delay={i * 0.06}>
                <div
                  className="group h-full p-8 transition-colors"
                  style={{ background: "var(--surface)" }}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-mute-2">
                      {f.tag}
                    </span>
                    <Icon size={20} className="text-mute transition-colors group-hover:text-ink" />
                  </div>
                  <h3 className="mt-5 text-lg font-semibold text-ink">{f.title}</h3>
                  <p className="mt-2 text-sm text-mute">{f.body}</p>
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
