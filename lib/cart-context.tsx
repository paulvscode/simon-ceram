"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

const STORAGE_KEY = "simon-ceramique-cart";

type CartContextValue = {
  cart: string[];
  addToCart: (productId: string) => void;
  removeFromCart: (productId: string) => void;
  isInCart: (productId: string) => boolean;
  clearCart: () => void;
  isDrawerOpen: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<string[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [isDrawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        setCart(JSON.parse(raw));
      } catch {
        // ignore corrupt local storage
      }
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
  }, [cart, hydrated]);

  const value = useMemo<CartContextValue>(
    () => ({
      cart,
      addToCart: (productId) => {
        setCart((prev) => (prev.includes(productId) ? prev : [...prev, productId]));
        setDrawerOpen(true);
      },
      removeFromCart: (productId) => {
        setCart((prev) => prev.filter((id) => id !== productId));
        setDrawerOpen(true);
      },
      isInCart: (productId) => cart.includes(productId),
      clearCart: () => setCart([]),
      isDrawerOpen,
      openDrawer: () => setDrawerOpen(true),
      closeDrawer: () => setDrawerOpen(false),
    }),
    [cart, isDrawerOpen]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within a CartProvider");
  return ctx;
}
