"use client";

import { useEffect, useState } from "react";
import { PRODUCT } from "@/lib/data";

function diff(target: number) {
  const now = Date.now();
  const d = Math.max(0, target - now);
  return {
    days: Math.floor(d / 86400000),
    hours: Math.floor((d % 86400000) / 3600000),
    mins: Math.floor((d % 3600000) / 60000),
    secs: Math.floor((d % 60000) / 1000),
  };
}

// Halo claro (cor do fundo) em volta do número: invisível sobre o fundo claro,
// destaca o número escuro ao passar sobre a camiseta. NÃO usa mix-blend-mode —
// por isso é estável no timer (que repinta a cada segundo e derrubaria o blend).
const HALO =
  "0 0 1px var(--bg), 1px 1px 0 var(--bg), -1px 1px 0 var(--bg), 1px -1px 0 var(--bg), -1px -1px 0 var(--bg), 0 0 10px var(--bg), 0 0 20px var(--bg)";

export default function Countdown({
  compact = false,
  blend = false,
}: {
  compact?: boolean;
  /** timer sobre a camiseta 3D: números escuros + halo claro (legível sobre claro e escuro) */
  blend?: boolean;
}) {
  const target = new Date(PRODUCT.eventDate).getTime();
  // inicia zerado para casar SSR/cliente (evita mismatch de hidratação)
  const [t, setT] = useState({ days: 0, hours: 0, mins: 0, secs: 0 });

  useEffect(() => {
    setT(diff(target));
    const id = setInterval(() => setT(diff(target)), 1000);
    return () => clearInterval(id);
  }, [target]);

  const cells: [number, string][] = [
    [t.days, "dias"],
    [t.hours, "hrs"],
    [t.mins, "min"],
    [t.secs, "seg"],
  ];

  return (
    <div className={`flex items-end ${compact ? "gap-3" : "gap-5"}`}>
      {cells.map(([v, l]) => (
        <div key={l} className="flex flex-col items-center">
          <span
            className={`display tabular-nums text-ink ${
              compact ? "text-3xl" : "text-5xl md:text-6xl"
            }`}
            style={{
              fontVariantNumeric: "tabular-nums",
              textShadow: blend ? HALO : undefined,
            }}
          >
            {String(v).padStart(2, "0")}
          </span>
          <span
            className="mt-1 font-mono text-[9px] uppercase tracking-[0.22em] text-mute-2"
            style={{ textShadow: blend ? HALO : undefined }}
          >
            {l}
          </span>
        </div>
      ))}
    </div>
  );
}
