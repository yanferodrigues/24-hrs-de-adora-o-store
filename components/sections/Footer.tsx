"use client";

import { Instagram, Youtube, ShieldCheck } from "lucide-react";

export default function Footer() {
  return (
    <footer
      className="relative z-10 border-t border-line py-14"
      style={{ background: "var(--bg)" }}
    >
      <div className="wrap flex flex-col gap-10">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div className="display text-4xl text-ink">
            Da noite à glória
          </div>
          <div className="flex gap-4 text-mute">
            <a href="#" aria-label="Instagram" className="transition-colors hover:text-ink">
              <Instagram size={20} />
            </a>
            <a href="#" aria-label="YouTube" className="transition-colors hover:text-ink">
              <Youtube size={20} />
            </a>
          </div>
        </div>

        <div className="flex flex-col gap-4 border-t border-line-soft pt-6 sm:flex-row sm:items-center sm:justify-between">
          <span className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.18em] text-mute-2">
            <ShieldCheck size={14} /> Pagamento seguro · Pix e cartão
          </span>
          <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-mute-2">
            © {new Date().getFullYear()} 24 Horas de Adoração · Store — Feito para adorar.
          </span>
        </div>
      </div>
    </footer>
  );
}
