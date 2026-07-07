"use client";

import { useEffect, useState } from "react";
import { useStore } from "@/lib/store";

export default function Topbar() {
  const mood = useStore((s) => s.mood);
  const setMood = useStore((s) => s.setMood);
  const [progress, setProgress] = useState(0);

  // reflete o mood no <html data-mood> para a troca de tema
  useEffect(() => {
    document.documentElement.setAttribute("data-mood", mood);
  }, [mood]);

  useEffect(() => {
    const unsub = useStore.subscribe((s) => setProgress(s.scrollProgress));
    return unsub;
  }, []);

  return (
    <>
      <div
        aria-hidden
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          height: 2,
          width: `${progress * 100}%`,
          background: "var(--accent)",
          zIndex: 71,
          transition: "width .1s linear",
        }}
      />
      <header
        className="fixed left-0 right-0 top-0 z-[70] flex items-center justify-between px-7 py-4"
        style={{
          background: "linear-gradient(180deg, var(--bg), rgba(0,0,0,0))",
          backdropFilter: "blur(7px)",
        }}
      >
        <a
          href="#top"
          className="font-mono text-[11px] uppercase tracking-[0.28em] text-ink"
        >
          24H DE <b className="font-semibold">ADORAÇÃO</b>
        </a>

        <div
          role="group"
          aria-label="Momento do dia"
          className="flex items-center gap-0.5 rounded-full border border-line bg-surface p-[3px]"
        >
          {(["night", "dawn"] as const).map((m) => (
            <button
              key={m}
              aria-pressed={mood === m}
              onClick={() => setMood(m)}
              className="rounded-full px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.16em] transition-colors"
              style={{
                color: mood === m ? "var(--accent-on)" : "var(--mute)",
                background: mood === m ? "var(--accent)" : "transparent",
                fontWeight: mood === m ? 700 : 400,
              }}
            >
              {m === "night" ? "Noite" : "Amanhecer"}
            </button>
          ))}
        </div>
      </header>
    </>
  );
}
