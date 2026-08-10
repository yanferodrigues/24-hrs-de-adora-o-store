"use client";

import { create } from "zustand";
import { MAX_QTY_POR_ITEM } from "@/lib/data";

export type Version = "Preta";
export type Fit = "Slimfit" | "Oversized" | "Infantil";

export interface CartItem {
  id: string; // `${version}-${fit}-${size}`
  version: Version;
  fit: Fit;
  size: string;
  qty: number;
  price: number;
}

export interface SessionUser {
  id: string;
  email: string;
  name: string;
}

interface StoreState {
  /** progresso global do scroll 0..1 — compartilhado com a cena 3D */
  scrollProgress: number;
  setScrollProgress: (p: number) => void;
  size: string;
  setSize: (s: string) => void;

  /** ---- Sessão ---- */
  user: SessionUser | null;
  setUser: (u: SessionUser | null) => void;

  /** ---- Carrinho ---- */
  cart: CartItem[];
  cartOpen: boolean;
  setCartOpen: (b: boolean) => void;
  addToCart: (item: Omit<CartItem, "id">) => void;
  removeFromCart: (id: string) => void;
  setQty: (id: string, qty: number) => void;
  clearCart: () => void;
}

export const useStore = create<StoreState>((set) => ({
  scrollProgress: 0,
  setScrollProgress: (scrollProgress) => set({ scrollProgress }),
  size: "M",
  setSize: (size) => set({ size }),

  user: null,
  setUser: (user) => set({ user }),

  cart: [],
  cartOpen: false,
  setCartOpen: (cartOpen) => set({ cartOpen }),
  addToCart: (item) =>
    set((s) => {
      const id = `${item.version}-${item.fit}-${item.size}`;
      const existing = s.cart.find((c) => c.id === id);
      // O teto vem de lib/data.ts, o mesmo que a API de checkout aplica.
      const cart = existing
        ? s.cart.map((c) =>
            c.id === id
              ? { ...c, qty: Math.min(MAX_QTY_POR_ITEM, c.qty + item.qty) }
              : c
          )
        : [
            ...s.cart,
            { ...item, id, qty: Math.min(MAX_QTY_POR_ITEM, item.qty) },
          ];
      return { cart, cartOpen: true };
    }),
  removeFromCart: (id) =>
    set((s) => ({ cart: s.cart.filter((c) => c.id !== id) })),
  setQty: (id, qty) =>
    set((s) => ({
      cart: s.cart.map((c) =>
        c.id === id
          ? { ...c, qty: Math.min(MAX_QTY_POR_ITEM, Math.max(1, qty)) }
          : c
      ),
    })),
  clearCart: () => set({ cart: [] }),
}));
