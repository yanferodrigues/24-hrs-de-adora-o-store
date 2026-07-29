"use client";

import { Reveal } from "@/components/Reveal";
import { FEATURES } from "@/lib/data";
import { Shirt, Ruler, Scissors, Sparkles } from "lucide-react";

const icons = [Shirt, Ruler, Scissors, Sparkles];

export default function Features() {
  return (
    <section className="relative py-28">
      <div className="wrap">
        <Reveal>
          <p className="sacred mb-4">O Tecido</p>
          <h2
            className="display max-w-2xl text-parchment"
            style={{ fontSize: "clamp(2rem,5.5vw,3.6rem)", lineHeight: 1.04 }}
          >
            Feita para a <span className="gold-text">adoração</span>
          </h2>
        </Reveal>

        <div className="mt-14 grid gap-4 sm:grid-cols-2">
          {FEATURES.map((f, i) => {
            const Icon = icons[i];
            return (
              <Reveal key={f.title} delay={i * 0.06}>
                <div className="card group h-full p-8 transition-colors hover:border-gold-deep">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-mute-2">
                      {f.tag}
                    </span>
                    <Icon
                      size={20}
                      className="text-gold-deep transition-colors group-hover:text-gold"
                    />
                  </div>
                  <h3 className="mt-6 text-lg font-semibold text-parchment">
                    {f.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-mute">
                    {f.body}
                  </p>
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
