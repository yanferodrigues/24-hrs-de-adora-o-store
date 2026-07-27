"use client";

import { useState } from "react";
import Image from "next/image";
import { Minus, Plus, Truck, ShieldCheck, type LucideIcon } from "lucide-react";
import ShopHeader from "@/components/shop/ShopHeader";
import CartDrawer from "@/components/shop/CartDrawer";
import { PRODUCT, FITS } from "@/lib/data";
import { useStore, type Fit } from "@/lib/store";

type View = "frente" | "costas";
const VIEWS: { id: View; label: string; src: string }[] = [
  { id: "frente", label: "Frente", src: "/imagens/mockup-frente.webp" },
  { id: "costas", label: "Costas", src: "/imagens/mockup-costas.webp" },
];

export default function ProdutoPage() {
  const addToCart = useStore((s) => s.addToCart);

  const [size, setSize] = useState<string>("M");
  const [qty, setQty] = useState(1);
  const [view, setView] = useState<View>("frente");
  const [fit, setFit] = useState<Fit>("Regular");

  const unitPrice = FITS.find((f) => f.id === fit)?.price ?? PRODUCT.price;

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
            <Image
              src={view === "frente" ? "/imagens/mockup-frente.webp" : "/imagens/mockup-costas.webp"}
              alt={`Camiseta oficial — ${view}`}
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            {VIEWS.map((v) => (
              <button
                key={v.id}
                onClick={() => setView(v.id)}
                aria-pressed={view === v.id}
                aria-label={v.label}
                className="relative aspect-square overflow-hidden rounded-xl border-2 transition-colors"
                style={{
                  borderColor: view === v.id ? "var(--ink)" : "var(--line)",
                  background:
                    "radial-gradient(120% 120% at 50% 35%, var(--surface), var(--surface-2))",
                }}
              >
                <Image src={v.src} alt={v.label} fill sizes="120px" className="object-cover" />
                <span className="absolute bottom-1.5 left-1.5 font-mono text-[8px] uppercase tracking-wider text-white/80">
                  {v.label}
                </span>
              </button>
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
            Camiseta Oficial EDIÇÃO 2026
          </h1>

          <div className="mt-4 flex items-baseline gap-3">
            <span className="display text-4xl text-ink">R$ {unitPrice}</span>
            {fit === "Oversized" && (
              <span className="font-mono text-[11px] uppercase tracking-wider text-mute-2">
                Corte oversized
              </span>
            )}
          </div>

          <p className="mt-6 max-w-prose text-[15px] leading-relaxed text-mute">
            A camiseta oficial do congresso <b className="text-ink">24 Horas de
            Adoração</b>. Estampa do Rei montado no cavalo com a multidão em
            adoração (Apocalipse 19), impressa em algodão premium de gramatura
            alta. Corte oversized streetwear, acabamento reforçado e estampa de
            alta durabilidade.
          </p>

          {/* Corte */}
          <div className="mt-6">
            <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-mute-2">
              Corte · <span className="text-ink">{fit}</span>
            </span>
            <div className="mt-3 flex flex-wrap gap-2">
              {FITS.map((f) => (
                <button
                  key={f.id}
                  onClick={() => setFit(f.id)}
                  aria-pressed={fit === f.id}
                  className="flex h-11 items-center gap-2 rounded-full border px-4 font-mono text-xs transition-colors"
                  style={{
                    background: fit === f.id ? "var(--accent)" : "transparent",
                    color: fit === f.id ? "var(--accent-on)" : "var(--ink)",
                    borderColor: fit === f.id ? "var(--accent)" : "var(--line)",
                  }}
                >
                  {f.label}
                  <span className="opacity-60">R$ {f.price}</span>
                </button>
              ))}
            </div>
          </div>

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
                addToCart({ version: "Preta", fit, size, qty, price: unitPrice })
              }
              className="btn-magnetic flex-1"
            >
              Adicionar ao carrinho · R$ {qty * unitPrice}
            </button>
          </div>

          {/* Trust */}
          <div className="mt-10 grid gap-4 border-t border-line pt-8 sm:grid-cols-3">
            {(
              [
                { icon: Truck, label: "Entrega antes do congresso" },
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
