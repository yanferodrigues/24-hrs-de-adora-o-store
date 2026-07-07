"use client";

import { motion, useReducedMotion, type Variants } from "framer-motion";
import type { ReactNode } from "react";

interface RevealProps {
  children: ReactNode;
  delay?: number;
  y?: number;
  blur?: boolean;
  className?: string;
  as?: "div" | "section" | "span" | "li" | "h1" | "h2" | "p";
}

export function Reveal({
  children,
  delay = 0,
  y = 26,
  blur = true,
  className,
}: RevealProps) {
  const reduce = useReducedMotion();

  // Sem filter no repouso: um blur(0px) residual cria stacking context e
  // quebraria o mix-blend-mode dos títulos. Usamos só opacity + deslocamento.
  void blur;
  const variants: Variants = {
    hidden: {
      opacity: 0,
      y: reduce ? 0 : y,
    },
    show: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.8,
        delay,
        ease: [0.2, 0.7, 0.2, 1],
      },
    },
  };

  return (
    <motion.div
      className={className}
      variants={variants}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "0px 0px -12% 0px" }}
    >
      {children}
    </motion.div>
  );
}
