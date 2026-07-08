"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  X,
  Minus,
  Plus,
  Trash2,
  ShoppingBag,
  Copy,
  Check,
  Loader2,
  QrCode,
  CheckCircle2,
} from "lucide-react";
import Link from "next/link";
import { useStore } from "@/lib/store";

type Step = "cart" | "pix" | "pago";

interface PixData {
  paymentId: number;
  qrCode: string;
  qrCodeBase64: string;
}

export default function CartDrawer() {
  const open = useStore((s) => s.cartOpen);
  const setOpen = useStore((s) => s.setCartOpen);
  const cart = useStore((s) => s.cart);
  const setQty = useStore((s) => s.setQty);
  const removeFromCart = useStore((s) => s.removeFromCart);
  const clearCart = useStore((s) => s.clearCart);

  const subtotal = cart.reduce((n, c) => n + c.qty * c.price, 0);
  const count = cart.reduce((n, c) => n + c.qty, 0);

  const [step, setStep] = useState<Step>("cart");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pix, setPix] = useState<PixData | null>(null);
  const [copied, setCopied] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  // ---- Gera o pagamento Pix ----
  async function gerarPix() {
    if (!emailOk || cart.length === 0) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: cart, email }),
      });
      const data = await res.json();

      if (data.configured === false) {
        setError(
          "O pagamento ainda está sendo configurado. Tente novamente em breve."
        );
        return;
      }
      if (!res.ok || !data.qrCode) {
        setError("Não foi possível gerar o Pix. Confira o e-mail e tente de novo.");
        return;
      }

      setPix({
        paymentId: data.paymentId,
        qrCode: data.qrCode,
        qrCodeBase64: data.qrCodeBase64,
      });
      setStep("pix");
    } catch {
      setError("Falha de conexão. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  // ---- Polling do status enquanto o Pix está pendente ----
  useEffect(() => {
    if (step !== "pix" || !pix) return;

    pollRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/checkout/status?id=${pix.paymentId}`, {
          cache: "no-store",
        });
        const data = await res.json();
        if (data.status === "approved") {
          setStep("pago");
        } else if (data.status === "rejected" || data.status === "cancelled") {
          setError("O pagamento não foi concluído. Gere um novo Pix.");
          setStep("cart");
          setPix(null);
        }
      } catch {
        /* ignora erros pontuais de rede — tenta de novo no próximo tick */
      }
    }, 4000);

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [step, pix]);

  // ---- Ao entrar em "pago", esvazia o carrinho ----
  useEffect(() => {
    if (step === "pago") clearCart();
  }, [step, clearCart]);

  async function cancelarPix() {
    // para o polling e volta ao carrinho na hora
    if (pollRef.current) clearInterval(pollRef.current);
    const id = pix?.paymentId;
    setStep("cart");
    setPix(null);
    setError(null);
    // cancela no Mercado Pago em segundo plano (best-effort)
    if (id) {
      fetch("/api/checkout/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      }).catch(() => {});
    }
  }

  async function copiar() {
    if (!pix) return;
    try {
      await navigator.clipboard.writeText(pix.qrCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard indisponível — o usuário ainda pode copiar manualmente */
    }
  }

  function fechar() {
    setOpen(false);
    // se já pagou, reseta o fluxo ao fechar
    if (step === "pago") {
      setStep("cart");
      setPix(null);
      setEmail("");
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={fechar}
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
                {step === "cart"
                  ? `Carrinho (${count})`
                  : step === "pix"
                  ? "Pague com Pix"
                  : "Tudo certo"}
              </span>
              <button
                onClick={fechar}
                aria-label="Fechar"
                className="text-mute transition-colors hover:text-ink"
              >
                <X size={20} />
              </button>
            </div>

            {/* ===================== PAGAMENTO CONFIRMADO ===================== */}
            {step === "pago" ? (
              <div className="flex flex-1 flex-col items-center justify-center gap-5 px-8 text-center">
                <CheckCircle2 size={56} className="text-ink" />
                <div>
                  <p className="display text-2xl text-ink">Pagamento confirmado</p>
                  <p className="mt-3 text-sm leading-relaxed text-mute">
                    Recebemos seu Pix. Retire sua camiseta no congresso — leve o
                    e-mail usado na compra como confirmação.
                  </p>
                </div>
                <button onClick={fechar} className="btn-magnetic mt-2">
                  Fechar
                </button>
              </div>
            ) : /* ===================== TELA DO PIX ===================== */
            step === "pix" && pix ? (
              <div className="flex flex-1 flex-col overflow-y-auto px-6 py-6">
                <div className="mx-auto flex w-full max-w-[280px] flex-col items-center text-center">
                  <div className="rounded-2xl border border-line bg-white p-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={`data:image/png;base64,${pix.qrCodeBase64}`}
                      alt="QR Code Pix"
                      className="h-56 w-56"
                    />
                  </div>
                  <p className="mt-5 text-sm text-mute">
                    Abra o app do seu banco, escaneie o QR Code ou use o código
                    copia e cola abaixo.
                  </p>

                  <div className="mt-5 w-full">
                    <div className="flex items-center gap-2 rounded-lg border border-line px-3 py-2.5">
                      <QrCode size={16} className="shrink-0 text-mute-2" />
                      <span className="flex-1 overflow-hidden text-ellipsis whitespace-nowrap font-mono text-[11px] text-mute">
                        {pix.qrCode}
                      </span>
                    </div>
                    <button
                      onClick={copiar}
                      className="btn-magnetic mt-3 flex w-full items-center justify-center gap-2"
                    >
                      {copied ? <Check size={16} /> : <Copy size={16} />}
                      {copied ? "Copiado!" : "Copiar código Pix"}
                    </button>
                  </div>

                  <div className="mt-6 flex items-center gap-2 text-mute-2">
                    <Loader2 size={15} className="animate-spin" />
                    <span className="font-mono text-[11px] uppercase tracking-wider">
                      Aguardando pagamento…
                    </span>
                  </div>
                  <p className="mt-4 font-mono text-[10px] uppercase tracking-wider text-mute-2">
                    O código expira em 30 minutos
                  </p>

                  <button
                    onClick={cancelarPix}
                    className="mt-6 font-mono text-[11px] uppercase tracking-[0.16em] text-mute-2 underline underline-offset-4 transition-colors hover:text-ink"
                  >
                    Cancelar e voltar ao carrinho
                  </button>
                </div>
              </div>
            ) : /* ===================== CARRINHO VAZIO ===================== */
            cart.length === 0 ? (
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
              /* ===================== CARRINHO ===================== */
              <>
                <div className="flex-1 overflow-y-auto px-6 py-4">
                  {cart.map((item) => (
                    <div
                      key={item.id}
                      className="flex gap-4 border-b border-line-soft py-5 last:border-0"
                    >
                      <div
                        className="h-20 w-16 shrink-0 rounded-lg border border-line"
                        style={{ background: "#0f0f11" }}
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
                    <span className="display text-2xl text-ink">R$ {subtotal}</span>
                  </div>

                  <label className="mb-2 block font-mono text-[10px] uppercase tracking-wider text-mute-2">
                    Seu e-mail (para o comprovante)
                  </label>
                  <input
                    type="email"
                    inputMode="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="voce@email.com"
                    className="mb-3 w-full rounded-lg border border-line bg-transparent px-3 py-2.5 text-sm text-ink outline-none transition-colors placeholder:text-mute-2 focus:border-[var(--ink)]"
                  />

                  {error && (
                    <p className="mb-3 text-center text-xs text-red-500">{error}</p>
                  )}

                  <button
                    onClick={gerarPix}
                    disabled={!emailOk || loading}
                    className="btn-magnetic flex w-full items-center justify-center gap-2 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {loading ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        Gerando Pix…
                      </>
                    ) : (
                      "Pagar com Pix"
                    )}
                  </button>
                  <p className="mt-3 text-center font-mono text-[10px] uppercase tracking-wider text-mute-2">
                    Pagamento via Pix · retirada no congresso
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
