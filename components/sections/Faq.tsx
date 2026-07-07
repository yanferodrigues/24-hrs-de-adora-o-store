"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Reveal } from "@/components/Reveal";
import { FAQ } from "@/lib/data";
import { Plus } from "lucide-react";

export default function Faq() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section
      className="relative z-10 py-28"
      style={{ background: "var(--bg)" }}
    >
      <div className="wrap grid gap-12 lg:grid-cols-[0.6fr_1fr]">
        <Reveal>
          <div>
            <p className="eyebrow mb-3">07 — Dúvidas</p>
            <h2 className="display text-ink" style={{ fontSize: "clamp(2rem,6vw,4rem)" }}>
              Tudo claro
            </h2>
          </div>
        </Reveal>

        <div className="divide-y divide-line border-y border-line">
          {FAQ.map((item, i) => {
            const isOpen = open === i;
            return (
              <div key={item.q}>
                <button
                  onClick={() => setOpen(isOpen ? null : i)}
                  className="flex w-full items-center justify-between gap-4 py-5 text-left"
                  aria-expanded={isOpen}
                >
                  <span className="text-[15px] font-medium text-ink">{item.q}</span>
                  <Plus
                    size={18}
                    className="shrink-0 text-mute transition-transform duration-300"
                    style={{ transform: isOpen ? "rotate(45deg)" : "none" }}
                  />
                </button>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.35, ease: [0.2, 0.7, 0.2, 1] }}
                      className="overflow-hidden"
                    >
                      <p className="max-w-xl pb-6 text-sm leading-relaxed text-mute">
                        {item.a}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
