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

export default function Countdown({ compact = false }: { compact?: boolean }) {
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
            style={{ fontVariantNumeric: "tabular-nums" }}
          >
            {String(v).padStart(2, "0")}
          </span>
          <span className="mt-1 font-mono text-[9px] uppercase tracking-[0.22em] text-mute-2">
            {l}
          </span>
        </div>
      ))}
    </div>
  );
}
