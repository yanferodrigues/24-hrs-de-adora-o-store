"use client";

import { Reveal } from "@/components/Reveal";
import { PRODUCT, SIZE_GUIDE, SIZE_GUIDE_SLIMFIT } from "@/lib/data";
import { useStore } from "@/lib/store";

export default function SizeGuide() {
  const size = useStore((s) => s.size);
  const setSize = useStore((s) => s.setSize);

  return (
    <section className="relative py-28">
      <div className="wrap grid gap-12 lg:grid-cols-2">
        <div className="lg:flex lg:flex-col lg:justify-center">
          <Reveal>
            <p className="sacred mb-4">Os Tamanhos</p>
            <h2
              className="display text-parchment"
              style={{ fontSize: "clamp(2rem,5.5vw,3.6rem)", lineHeight: 1.04 }}
            >
              Encontre seu tamanho ideal
            </h2>
            <span aria-hidden className="blood-mark mt-6" />
            <p className="mt-5 max-w-md text-sm leading-relaxed text-mute">
              Modelagem oversized: se quiser um caimento mais justo, considere um
              tamanho abaixo. Medidas em centímetros, peça plana.
            </p>
          </Reveal>

          <Reveal delay={0.1}>
            <div className="mt-8">
              <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-mute-2">
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
                      background: size === s ? "var(--gold)" : "transparent",
                      color: size === s ? "var(--accent-on)" : "var(--parchment)",
                      borderColor: size === s ? "var(--gold)" : "var(--line)",
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
          <div className="space-y-8">
            {[
              { modeling: "oversized", measurements: SIZE_GUIDE },
              { modeling: "slimfit", measurements: SIZE_GUIDE_SLIMFIT },
            ].map(({ modeling, measurements }) => (
              <div key={modeling}>
                <h3 className="display mb-3 text-xl text-parchment">
                  {modeling}
                </h3>
                <div className="overflow-hidden rounded-2xl border border-line">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-line text-left font-mono text-[10px] uppercase tracking-[0.14em] text-mute-2">
                        <th className="p-4">Tam.</th>
                        <th className="p-4">Largura (cm)</th>
                        <th className="p-4">Comprimento (cm)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {measurements.map((r) => (
                        <tr
                          key={r.size}
                          className="border-b border-line-soft transition-colors last:border-0"
                          style={{
                            background:
                              size === r.size
                                ? "var(--surface-2)"
                                : "transparent",
                          }}
                        >
                          <td className="p-4 font-semibold text-parchment">
                            {r.size}
                          </td>
                          <td className="p-4 tabular-nums text-mute">
                            {r.chest}
                          </td>
                          <td className="p-4 tabular-nums text-mute">
                            {r.length}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
    
  );
}
