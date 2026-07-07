"use client";

import { create } from "zustand";

export type Mood = "night" | "dawn";
export type Version = "Preta" | "Branca";

export interface CartItem {
  id: string; // `${version}-${size}`
  version: Version;
  size: string;
  qty: number;
  price: number;
}

interface StoreState {
  /** night = camiseta preta (fundo escuro) · dawn = camiseta branca (fundo claro) */
  mood: Mood;
  setMood: (m: Mood) => void;
  toggleMood: () => void;
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
  mood: "night",
  setMood: (mood) => set({ mood }),
  toggleMood: () => set((s) => ({ mood: s.mood === "night" ? "dawn" : "night" })),
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

/** Rótulo da versão de camiseta conforme o mood. */
export const versionLabel = (m: Mood): Version => (m === "night" ? "Preta" : "Branca");
