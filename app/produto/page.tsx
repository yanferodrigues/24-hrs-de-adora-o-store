"use client";

import { useState } from "react";
import Image from "next/image";
import { Minus, Plus, Truck, ShieldCheck, type LucideIcon } from "lucide-react";
import ShopHeader from "@/components/shop/ShopHeader";
import CartDrawer from "@/components/shop/CartDrawer";
import { PRODUCT, FITS, MAX_QTY_POR_ITEM } from "@/lib/data";
import { useStore, type Fit } from "@/lib/store";

/* Galeria da PDP: os dois mockups (estampa inteira, reta) e três fotos no
   corpo. `fit` vem junto porque as fotos são retrato 2:3 dentro de um quadro
   quadrado — sem `object-top` o corte come a cabeça de quem está vestindo. */
type View = { id: string; label: string; src: string; fit: string };

const VIEWS: View[] = [
  {
    id: "frente",
    label: "Frente",
    src: "/imagens/mockup-frente.webp",
    fit: "object-cover object-center",
  },
  {
    id: "costas",
    label: "Costas",
    src: "/imagens/mockup-costas.webp",
    fit: "object-cover object-center",
  },
  {
    id: "slimfit",
    label: "Frente",
    src: "/imagens/modelo slimfit.png",
    fit: "object-cover object-center",
  },
  {
    id: "slimfit costas",
    label: "Frente",
    src: "/imagens/modelo slimfit costas.png",
    fit: "object-cover object-center",
  },
  {
    id: "no-corpo",
    label: "No corpo",
    src: "/pessoas/01.webp",
    fit: "object-cover object-top",
  },
  {
    id: "costas-corpo",
    label: "Costas no corpo",
    src: "/pessoas/05-costas.jpg",
    fit: "object-cover object-top",
  },
  {
    id: "detalhe",
    label: "Detalhe",
    src: "/pessoas/08-detalhe.jpg",
    fit: "object-cover object-center",
  },
];

export default function ProdutoPage() {
  const addToCart = useStore((s) => s.addToCart);
  const cart = useStore((s) => s.cart);

  const [size, setSize] = useState<string>("M");
  const [qty, setQty] = useState(1);
  const [viewId, setViewId] = useState<string>(VIEWS[0].id);
  const [fit, setFit] = useState<Fit>("Oversized");
  const [addWarning, setAddWarning] = useState<string | null>(null);

  const unitPrice = FITS.find((f) => f.id === fit)?.price ?? PRODUCT.price;
  const view = VIEWS.find((v) => v.id === viewId) ?? VIEWS[0];

  // Quantas unidades desse corte+tamanho já estão no carrinho — o teto vale
  // para a soma, não só para o que está sendo adicionado agora.
  const cartId = `Preta-${fit}-${size}`;
  const alreadyInCart = cart.find((c) => c.id === cartId)?.qty ?? 0;
  const wouldExceedCap = alreadyInCart + qty > MAX_QTY_POR_ITEM;

  function handleAddToCart() {
    if (wouldExceedCap) {
      setAddWarning(
        alreadyInCart > 0
          ? `Você já tem ${alreadyInCart} nesse tamanho no carrinho — máximo de ${MAX_QTY_POR_ITEM} por tamanho.`
          : `Máximo de ${MAX_QTY_POR_ITEM} por tamanho.`
      );
    } else {
      setAddWarning(null);
    }
    addToCart({ version: "Preta", fit, size, qty, price: unitPrice });
  }

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
              src={view.src}
              alt={`Camiseta oficial — ${view.label}`}
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 50vw"
              className={view.fit}
            />
          </div>

          <div className="grid grid-cols-5 gap-2">
            {VIEWS.map((v) => (
              <button
                key={v.id}
                onClick={() => setViewId(v.id)}
                aria-pressed={v.id === viewId}
                aria-label={v.label}
                title={v.label}
                className="relative aspect-square overflow-hidden rounded-xl border-2 transition-colors"
                style={{
                  borderColor: v.id === viewId ? "var(--ink)" : "var(--line)",
                  background:
                    "radial-gradient(120% 120% at 50% 35%, var(--surface), var(--surface-2))",
                }}
              >
                <Image src={v.src} alt={v.label} fill sizes="120px" className={v.fit} />
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
            A camiseta oficial do <b className="text-ink">VOLTAREI</b>,
            congresso de louvor da Igreja Brasil Para Cristo (23/10/2026).
            Estampa do Rei montado no cavalo com a multidão em
            adoração (Apocalipse 19), impressa em algodão premium de gramatura
            alta. Acabamento reforçado e estampa de alta durabilidade.
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
                onClick={() => {
                  setQty((q) => Math.max(1, q - 1));
                  setAddWarning(null);
                }}
                aria-label="Diminuir"
                className="text-mute transition-colors hover:text-ink"
              >
                <Minus size={16} />
              </button>
              <span className="w-6 text-center font-mono tabular-nums text-ink">
                {qty}
              </span>
              <button
                onClick={() => {
                  setQty((q) => Math.min(MAX_QTY_POR_ITEM, q + 1));
                  setAddWarning(null);
                }}
                disabled={qty >= MAX_QTY_POR_ITEM}
                aria-label="Aumentar"
                className="text-mute transition-colors hover:text-ink disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:text-mute"
              >
                <Plus size={16} />
              </button>
            </div>

            <button onClick={handleAddToCart} className="btn-magnetic flex-1">
              Adicionar ao carrinho · R$ {qty * unitPrice}
            </button>
          </div>

          {(qty >= MAX_QTY_POR_ITEM || addWarning) && (
            <p className="mt-2 font-mono text-[10px] uppercase tracking-wider text-mute-2">
              {addWarning ?? `Máximo de ${MAX_QTY_POR_ITEM} por tamanho.`}
            </p>
          )}

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
