"use client";

import { AnimatePresence, motion } from "framer-motion";
import { X, Minus, Plus, Trash2, ShoppingBag } from "lucide-react";
import Link from "next/link";
import { useStore } from "@/lib/store";
import { PRODUCT } from "@/lib/data";

export default function CartDrawer() {
  const open = useStore((s) => s.cartOpen);
  const setOpen = useStore((s) => s.setCartOpen);
  const cart = useStore((s) => s.cart);
  const setQty = useStore((s) => s.setQty);
  const removeFromCart = useStore((s) => s.removeFromCart);

  const subtotal = cart.reduce((n, c) => n + c.qty * c.price, 0);
  const count = cart.reduce((n, c) => n + c.qty, 0);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-[80] bg-black/50"
          />
          <motion.aside
            key="drawer"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "tween", duration: 0.35, ease: [0.2, 0.7, 0.2, 1] }}
            className="fixed right-0 top-0 z-[81] flex h-full w-full max-w-md flex-col border-l border-line"
            style={{ background: "var(--bg)" }}
          >
            <div className="flex items-center justify-between border-b border-line px-6 py-5">
              <span className="font-mono text-[11px] uppercase tracking-[0.24em] text-ink">
                Carrinho ({count})
              </span>
              <button
                onClick={() => setOpen(false)}
                aria-label="Fechar"
                className="text-mute transition-colors hover:text-ink"
              >
                <X size={20} />
              </button>
            </div>

            {cart.length === 0 ? (
              <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
                <ShoppingBag size={32} className="text-mute-2" />
                <p className="text-sm text-mute">Seu carrinho está vazio.</p>
                <Link
                  href="/produto"
                  onClick={() => setOpen(false)}
                  className="font-mono text-[11px] uppercase tracking-[0.16em] text-ink underline underline-offset-4"
                >
                  Ver produto
                </Link>
              </div>
            ) : (
              <>
                <div className="flex-1 overflow-y-auto px-6 py-4">
                  {cart.map((item) => (
                    <div
                      key={item.id}
                      className="flex gap-4 border-b border-line-soft py-5 last:border-0"
                    >
                      <div
                        className="h-20 w-16 shrink-0 rounded-lg border border-line"
                        style={{
                          background:
                            item.version === "Preta" ? "#0f0f11" : "#eaeae7",
                        }}
                      />
                      <div className="flex flex-1 flex-col">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="text-sm font-semibold text-ink">
                              Camiseta {item.version}
                            </div>
                            <div className="font-mono text-[10px] uppercase tracking-wider text-mute-2">
                              Tam. {item.size}
                            </div>
                          </div>
                          <button
                            onClick={() => removeFromCart(item.id)}
                            aria-label="Remover"
                            className="text-mute-2 transition-colors hover:text-ink"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                        <div className="mt-auto flex items-center justify-between pt-3">
                          <div className="flex items-center gap-3 rounded-full border border-line px-2 py-1">
                            <button
                              onClick={() => setQty(item.id, item.qty - 1)}
                              aria-label="Diminuir"
                              className="text-mute transition-colors hover:text-ink"
                            >
                              <Minus size={13} />
                            </button>
                            <span className="w-5 text-center font-mono text-xs tabular-nums text-ink">
                              {item.qty}
                            </span>
                            <button
                              onClick={() => setQty(item.id, item.qty + 1)}
                              aria-label="Aumentar"
                              className="text-mute transition-colors hover:text-ink"
                            >
                              <Plus size={13} />
                            </button>
                          </div>
                          <span className="font-mono text-sm tabular-nums text-ink">
                            R$ {item.qty * item.price}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="border-t border-line px-6 py-5">
                  <div className="mb-4 flex items-center justify-between">
                    <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-mute">
                      Subtotal
                    </span>
                    <span className="display text-2xl text-ink">
                      R$ {subtotal}
                    </span>
                  </div>
                  <button className="btn-magnetic w-full">Comprar</button>
                  <p className="mt-3 text-center font-mono text-[10px] uppercase tracking-wider text-mute-2">
                    Frete e pagamento na próxima etapa
                  </p>
                </div>
              </>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
