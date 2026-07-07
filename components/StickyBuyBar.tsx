"use client";

import { useEffect, useState } from "react";
import { useStore } from "@/lib/store";
import BuyButton from "./BuyButton";

export default function StickyBuyBar() {
  const size = useStore((s) => s.size);
  const [show, setShow] = useState(false);

  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > window.innerHeight * 0.9);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-[65] transition-all duration-500"
      style={{
        transform: show ? "translateY(0)" : "translateY(120%)",
        opacity: show ? 1 : 0,
      }}
    >
      <div className="wrap pb-4">
        <div
          className="flex items-center justify-between gap-4 rounded-2xl border border-line px-5 py-3"
          style={{
            background: "color-mix(in srgb, var(--surface) 88%, transparent)",
            backdropFilter: "blur(12px)",
          }}
        >
          <div className="min-w-0">
            <div className="truncate font-mono text-[10px] uppercase tracking-[0.18em] text-mute-2">
              Camiseta Preta · tam. {size}
            </div>
            <div className="display text-2xl text-ink">R$ 80</div>
          </div>
          <BuyButton label="Comprar" />
        </div>
      </div>
    </div>
  );
}
