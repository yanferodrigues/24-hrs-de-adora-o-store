"use client";

import Link from "next/link";
import { ShoppingBag, ArrowLeft } from "lucide-react";
import { useStore } from "@/lib/store";

export default function ShopHeader() {
  const cart = useStore((s) => s.cart);
  const setCartOpen = useStore((s) => s.setCartOpen);
  const count = cart.reduce((n, c) => n + c.qty, 0);

  return (
    <header
      className="sticky top-0 z-40 border-b border-line"
      style={{
        background: "color-mix(in srgb, var(--bg) 86%, transparent)",
        backdropFilter: "blur(8px)",
      }}
    >
      <div className="wrap flex h-16 items-center justify-between">
        <Link
          href="/"
          className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.28em] text-ink"
        >
          <ArrowLeft size={14} className="text-mute" />
          24H DE ADORAÇÃO
        </Link>

        <button
          onClick={() => setCartOpen(true)}
          aria-label="Abrir carrinho"
          className="relative flex h-10 w-10 items-center justify-center rounded-full border border-line text-ink transition-colors hover:border-ink"
        >
          <ShoppingBag size={18} />
          {count > 0 && (
            <span
              className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full px-1 font-mono text-[10px] font-bold tabular-nums"
              style={{ background: "var(--accent)", color: "var(--accent-on)" }}
            >
              {count}
            </span>
          )}
        </button>
      </div>
    </header>
  );
}
