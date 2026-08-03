"use client";

import { useRouter } from "next/navigation";
import { ArrowUpRight } from "lucide-react";

interface BuyButtonProps {
  label?: string;
  showPrice?: boolean;
  ghost?: boolean;
  className?: string;
}

/** Botão que leva à página do produto. */
export default function BuyButton({
  label = "Garantir a minha",
  showPrice = false,
  ghost = false,
  className = "",
}: BuyButtonProps) {
  const router = useRouter();

  return (
    <button
      onClick={() => router.push("/produto")}
      className={`btn-magnetic ${ghost ? "btn-ghost" : ""} ${className}`}
    >
      <ArrowUpRight size={16} />
      <span>
        {label}
        {showPrice ? " · R$ 90" : ""}
      </span>
    </button>
  );
}
