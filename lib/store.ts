"use client";

import { create } from "zustand";

export type Version = "Preta";

export interface CartItem {
  id: string; // `${version}-${size}`
  version: Version;
  size: string;
  qty: number;
  price: number;
}

interface StoreState {
  /** progresso global do scroll 0..1 — compartilhado com a cena 3D */
  scrollProgress: number;
  setScrollProgress: (p: number) => void;
  size: string;
  setSize: (s: string) => void;

  /** ---- Carrinho ---- */
  cart: CartItem[];
  cartOpen: boolean;
  setCartOpen: (b: boolean) => void;
  addToCart: (item: Omit<CartItem, "id">) => void;
  removeFromCart: (id: string) => void;
  setQty: (id: string, qty: number) => void;
}

export const useStore = create<StoreState>((set) => ({
  scrollProgress: 0,
  setScrollProgress: (scrollProgress) => set({ scrollProgress }),
  size: "M",
  setSize: (size) => set({ size }),

  cart: [],
  cartOpen: false,
  setCartOpen: (cartOpen) => set({ cartOpen }),
  addToCart: (item) =>
    set((s) => {
      const id = `${item.version}-${item.size}`;
      const existing = s.cart.find((c) => c.id === id);
      const cart = existing
        ? s.cart.map((c) =>
            c.id === id ? { ...c, qty: c.qty + item.qty } : c
          )
        : [...s.cart, { ...item, id }];
      return { cart, cartOpen: true };
    }),
  removeFromCart: (id) =>
    set((s) => ({ cart: s.cart.filter((c) => c.id !== id) })),
  setQty: (id, qty) =>
    set((s) => ({
      cart: s.cart.map((c) => (c.id === id ? { ...c, qty: Math.max(1, qty) } : c)),
    })),
}));
