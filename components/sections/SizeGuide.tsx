"use client";

import { Reveal } from "@/components/Reveal";
import { SIZE_GUIDE, PRODUCT } from "@/lib/data";
import { useStore } from "@/lib/store";

export default function SizeGuide() {
  const size = useStore((s) => s.size);
  const setSize = useStore((s) => s.setSize);

  return (
    <section
      className="relative z-10 py-28"
      style={{ background: "var(--bg)" }}
    >
      <div className="wrap grid gap-12 lg:grid-cols-2">
        <div>
          <Reveal>
            <p className="eyebrow mb-3">06 — Tamanhos</p>
            <h2 className="display text-ink" style={{ fontSize: "clamp(2rem,6vw,4rem)" }}>
              Escolha sem erro
            </h2>
            <p className="mt-4 max-w-md text-sm text-mute">
              Modelagem oversized: se quiser um caimento mais justo, considere um
              tamanho abaixo. Medidas em centímetros, peça plana.
            </p>
          </Reveal>

          <Reveal delay={0.1}>
            <div className="mt-8">
              <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-mute-2">
                Seu tamanho
              </span>
              <div className="mt-3 flex flex-wrap gap-2">
                {PRODUCT.sizes.map((s) => (
                  <button
                    key={s}
                    onClick={() => setSize(s)}
                    aria-pressed={size === s}
                    className="h-11 w-11 rounded-full border font-mono text-xs transition-colors"
                    style={{
                      background: size === s ? "var(--accent)" : "transparent",
                      color: size === s ? "var(--accent-on)" : "var(--ink)",
                      borderColor: size === s ? "var(--accent)" : "var(--line)",
                    }}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </Reveal>
        </div>

        <Reveal delay={0.05}>
          <div className="overflow-hidden rounded-2xl border border-line">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line text-left font-mono text-[10px] uppercase tracking-[0.14em] text-mute-2">
                  <th className="p-4">Tam.</th>
                  <th className="p-4">Peito (cm)</th>
                  <th className="p-4">Comprimento (cm)</th>
                </tr>
              </thead>
              <tbody>
                {SIZE_GUIDE.map((r) => (
                  <tr
                    key={r.size}
                    className="border-b border-line-soft transition-colors last:border-0"
                    style={{
                      background:
                        size === r.size ? "var(--surface-2)" : "transparent",
                    }}
                  >
                    <td className="p-4 font-semibold text-ink">{r.size}</td>
                    <td className="p-4 tabular-nums text-mute">{r.chest}</td>
                    <td className="p-4 tabular-nums text-mute">{r.length}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
