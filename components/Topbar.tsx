"use client";

import { useEffect, useState } from "react";
import { useStore } from "@/lib/store";

export default function Topbar() {
  const [progress, setProgress] = useState(0);

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
      </header>
    </>
  );
}
