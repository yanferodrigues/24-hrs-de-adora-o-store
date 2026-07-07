"use client";

import { useRef } from "react";
import { useRouter } from "next/navigation";
import { ArrowUpRight } from "lucide-react";

interface BuyButtonProps {
  label?: string;
  showPrice?: boolean;
  ghost?: boolean;
  className?: string;
}

/** Botão magnético + ripple que leva à página do produto. */
export default function BuyButton({
  label = "Garantir a minha",
  showPrice = false,
  ghost = false,
  className = "",
}: BuyButtonProps) {
  const ref = useRef<HTMLButtonElement>(null);
  const router = useRouter();

  const onMove = (e: React.MouseEvent) => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(pointer: coarse)").matches) return;
    const r = el.getBoundingClientRect();
    const mx = e.clientX - (r.left + r.width / 2);
    const my = e.clientY - (r.top + r.height / 2);
    el.style.transform = `translate(${mx * 0.18}px, ${my * 0.3}px)`;
  };
  const onLeave = () => {
    if (ref.current) ref.current.style.transform = "translate(0,0)";
  };

  const ripple = (e: React.MouseEvent) => {
    const el = ref.current;
    if (!el) return;
    const circle = document.createElement("span");
    const d = Math.max(el.clientWidth, el.clientHeight);
    const r = el.getBoundingClientRect();
    circle.style.cssText = `position:absolute;border-radius:50%;pointer-events:none;width:${d}px;height:${d}px;left:${
      e.clientX - r.left - d / 2
    }px;top:${
      e.clientY - r.top - d / 2
    }px;background:currentColor;opacity:.18;transform:scale(0);transition:transform .6s ease,opacity .6s ease;`;
    el.appendChild(circle);
    requestAnimationFrame(() => {
      circle.style.transform = "scale(1)";
      circle.style.opacity = "0";
    });
    setTimeout(() => circle.remove(), 650);
  };

  const go = (e: React.MouseEvent) => {
    ripple(e);
    router.push("/produto");
  };

  return (
    <button
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      onClick={go}
      className={`btn-magnetic ${ghost ? "btn-ghost" : ""} ${className}`}
    >
      <ArrowUpRight size={16} />
      <span>
        {label}
        {showPrice ? " · R$ 80" : ""}
      </span>
    </button>
  );
}
