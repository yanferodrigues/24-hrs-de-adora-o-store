"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { Minus, Plus, Truck, RefreshCw, ShieldCheck, type LucideIcon } from "lucide-react";
import ShopHeader from "@/components/shop/ShopHeader";
import CartDrawer from "@/components/shop/CartDrawer";
import { PRODUCT } from "@/lib/data";
import { useStore } from "@/lib/store";

const ProductViewer3D = dynamic(
  () => import("@/components/shop/ProductViewer3D"),
  { ssr: false }
);

const DETAILS = ["Costas", "Detalhe · gola", "Detalhe · estampa"];

export default function ProdutoPage() {
  const addToCart = useStore((s) => s.addToCart);

  const [size, setSize] = useState<string>("M");
  const [qty, setQty] = useState(1);

  return (
    <div className="min-h-screen" style={{ background: "var(--bg)" }}>
      <ShopHeader />

      <main className="wrap grid gap-10 py-10 lg:grid-cols-2 lg:gap-16 lg:py-14">
        {/* ---------- Galeria ---------- */}
        <div className="flex flex-col gap-3">
          <div
            className="relative aspect-square overflow-hidden rounded-2xl border border-line"
            style={{
              background:
                "radial-gradient(120% 120% at 50% 35%, var(--surface), var(--surface-2))",
            }}
          >
            <ProductViewer3D />
            <span className="pointer-events-none absolute bottom-4 left-4 font-mono text-[10px] uppercase tracking-[0.2em] text-mute-2">
              Arraste para girar · 360°
            </span>
          </div>

          <div className="grid grid-cols-4 gap-3">
            {/* miniatura ativa = viewer */}
            <div
              className="aspect-square rounded-xl border-2"
              style={{
                borderColor: "var(--ink)",
                background:
                  "radial-gradient(120% 120% at 50% 35%, var(--surface), var(--surface-2))",
              }}
            />
            {DETAILS.map((d) => (
              <div
                key={d}
                className="relative aspect-square overflow-hidden rounded-xl border border-line"
                style={{ background: "var(--surface)" }}
              >
                <div
                  className="absolute inset-0 opacity-[0.06]"
                  style={{
                    backgroundImage:
                      "repeating-linear-gradient(45deg, var(--ink) 0 1px, transparent 1px 12px)",
                  }}
                />
                <span className="absolute bottom-1.5 left-1.5 font-mono text-[8px] uppercase tracking-wider text-mute-2">
                  {d}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* ---------- Info ---------- */}
        <div className="flex flex-col">
          <div className="eyebrow mb-4">Início · Camisetas</div>

          <h1
            className="display text-ink"
            style={{ fontSize: "clamp(2rem,5vw,3.2rem)" }}
          >
            Camiseta Oficial — O Rei no Cavalo
          </h1>

          <div className="mt-4 flex items-baseline gap-3">
            <span className="display text-4xl text-ink">{PRODUCT.priceLabel}</span>
            <span className="font-mono text-[11px] uppercase tracking-wider text-mute-2">
              ou 12x de R$ 6,67
            </span>
          </div>

          <p className="mt-6 max-w-prose text-[15px] leading-relaxed text-mute">
            A camiseta oficial do congresso <b className="text-ink">24 Horas de
            Adoração</b>. Estampa do Rei montado no cavalo com a multidão em
            adoração (Apocalipse 19), impressa em algodão premium de gramatura
            alta. Corte oversized streetwear, acabamento reforçado e estampa de
            alta durabilidade.
          </p>

          {/* Tamanho */}
          <div className="mt-6">
            <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-mute-2">
              Tamanho · <span className="text-ink">{size}</span>
            </span>
            <div className="mt-3 flex flex-wrap gap-2">
              {PRODUCT.sizes.map((s) => (
                <button
                  key={s}
                  onClick={() => setSize(s)}
                  aria-pressed={size === s}
                  className="h-11 w-11 rounded-full border font-mono text-xs transition-colors"
                  style={{
                    background: size === s ? "var(--accent)" : "transparent",
                    color: size === s ? "var(--accent-on)" : "var(--ink)",
                    borderColor: size === s ? "var(--accent)" : "var(--line)",
                  }}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Quantidade + adicionar */}
          <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="flex items-center gap-4 rounded-full border border-line px-3 py-2">
              <button
                onClick={() => setQty((q) => Math.max(1, q - 1))}
                aria-label="Diminuir"
                className="text-mute transition-colors hover:text-ink"
              >
                <Minus size={16} />
              </button>
              <span className="w-6 text-center font-mono tabular-nums text-ink">
                {qty}
              </span>
              <button
                onClick={() => setQty((q) => q + 1)}
                aria-label="Aumentar"
                className="text-mute transition-colors hover:text-ink"
              >
                <Plus size={16} />
              </button>
            </div>

            <button
              onClick={() =>
                addToCart({ version: "Preta", size, qty, price: PRODUCT.price })
              }
              className="btn-magnetic flex-1"
            >
              Adicionar ao carrinho · R$ {qty * PRODUCT.price}
            </button>
          </div>

          {/* Trust */}
          <div className="mt-10 grid gap-4 border-t border-line pt-8 sm:grid-cols-3">
            {(
              [
                { icon: Truck, label: "Entrega antes do congresso" },
                { icon: RefreshCw, label: "Troca em 7 dias" },
                { icon: ShieldCheck, label: "Pagamento seguro · Pix" },
              ] as { icon: LucideIcon; label: string }[]
            ).map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-2 text-mute">
                <Icon size={16} className="text-ink" />
                <span className="text-xs">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </main>

      <CartDrawer />
    </div>
  );
}
