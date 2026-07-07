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

    const update = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const p = max > 0 ? window.scrollY / max : 0;
      setScrollProgress(Math.min(1, Math.max(0, p)));
    };

    if (reduce) {
      window.addEventListener("scroll", update, { passive: true });
      update();
      return () => window.removeEventListener("scroll", update);
    }

    const lenis = new Lenis({
      lerp: 1, // interpolação leve e responsiva (sem o arrasto do modo duration)
      wheelMultiplier: 1.2,
      smoothWheel: true,
      syncTouch: true,
      touchMultiplier: 1.2,
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
