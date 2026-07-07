"use client";

import { Reveal } from "@/components/Reveal";

// placeholders editoriais — troque por fotos on-body (WebP/AVIF) quando tiver
const TILES = [
  { span: "sm:col-span-2 sm:row-span-2", ratio: "aspect-[4/5]", cap: "On body · congresso" },
  { span: "", ratio: "aspect-square", cap: "Close · estampa" },
  { span: "", ratio: "aspect-square", cap: "Detalhe · gola" },
  { span: "sm:col-span-2", ratio: "aspect-[16/9]", cap: "Editorial · movimento" },
];

export default function Gallery() {
  return (
    <section
      className="relative z-10 py-28"
      style={{ background: "var(--bg)" }}
    >
      <div className="wrap">
        <Reveal>
          <p className="eyebrow mb-3">04 — Galeria</p>
          <h2 className="display text-ink" style={{ fontSize: "clamp(2rem,6vw,4rem)" }}>
            Vestida na vida real
          </h2>
        </Reveal>

        <div className="mt-12 grid auto-rows-[minmax(0,1fr)] grid-cols-2 gap-3 sm:grid-cols-4">
          {TILES.map((t, i) => (
            <Reveal key={i} delay={i * 0.05} className={t.span}>
              <figure
                className={`group relative h-full w-full overflow-hidden rounded-xl border border-line ${t.ratio}`}
              >
                <div
                  className="absolute inset-0 transition-transform duration-700 group-hover:scale-105"
                  style={{
                    background:
                      "radial-gradient(120% 120% at 30% 20%, var(--surface), var(--surface-2))",
                  }}
                />
                <div
                  className="absolute inset-0 opacity-[0.06]"
                  style={{
                    backgroundImage:
                      "repeating-linear-gradient(45deg, var(--ink) 0 1px, transparent 1px 14px)",
                  }}
                />
                <figcaption className="absolute bottom-3 left-3 font-mono text-[9px] uppercase tracking-[0.2em] text-mute-2">
                  {t.cap}
                </figcaption>
              </figure>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
