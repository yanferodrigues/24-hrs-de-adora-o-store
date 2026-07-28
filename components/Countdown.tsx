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
    <div className={`flex items-end ${compact ? "gap-3" : "gap-4 sm:gap-6"}`}>
      {cells.map(([v, l], i) => (
        <div key={l} className="flex items-end gap-4 sm:gap-6">
          <div className="flex flex-col items-center">
            <span
              className={`font-mono font-semibold tabular-nums text-parchment ${
                compact ? "text-2xl" : "text-4xl sm:text-6xl"
              }`}
              style={{ fontVariantNumeric: "tabular-nums" }}
            >
              {String(v).padStart(2, "0")}
            </span>
            <span className="mt-2 font-mono text-[9px] uppercase tracking-[0.24em] text-mute-2">
              {l}
            </span>
          </div>
          {i < cells.length - 1 && (
            <span
              className={`text-gold-deep ${compact ? "text-xl" : "text-3xl sm:text-5xl"} -translate-y-1`}
              aria-hidden
            >
              ·
            </span>
          )}
        </div>
      ))}
    </div>
  );
}
