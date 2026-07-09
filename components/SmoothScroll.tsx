"use client";

import { useEffect } from "react";
import Lenis from "lenis";
import { useStore } from "@/lib/store";

export default function SmoothScroll({
  children,
}: {
  children: React.ReactNode;
}) {
  const setScrollProgress = useStore((s) => s.setScrollProgress);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    // Celular/tablet (toque, sem mouse) → scroll NATIVO, sem Lenis (zero atraso).
    const isTouch = window.matchMedia("(hover: none) and (pointer: coarse)").matches;

    const update = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const p = max > 0 ? window.scrollY / max : 0;
      setScrollProgress(Math.min(1, Math.max(0, p)));
    };

    if (reduce || isTouch) {
      window.addEventListener("scroll", update, { passive: true });
      update();
      return () => window.removeEventListener("scroll", update);
    }

    // Desktop → scroll suave e fluido, mas responsivo (sem sequestrar o toque).
    const lenis = new Lenis({
      lerp: 2, // suavização leve: fluido no PC sem parecer atrasado
      wheelMultiplier: 1.5,
      smoothWheel: true,
      syncTouch: false,
    });

    lenis.on("scroll", update);

    let raf = 0;
    const loop = (time: number) => {
      lenis.raf(time);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    update();

    return () => {
      cancelAnimationFrame(raf);
      lenis.destroy();
    };
  }, [setScrollProgress]);

  return <>{children}</>;
}
