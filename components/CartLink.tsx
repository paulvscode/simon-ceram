"use client";

import { useCart } from "@/lib/cart-context";

export default function CartLink() {
  const { cart } = useCart();

  return (
    <a
      href="/panier"
      className="font-sans text-[11px] uppercase tracking-widest text-ink/70 transition-colors duration-400 hover:text-ink"
    >
      Panier{cart.length > 0 ? ` (${cart.length})` : ""}
    </a>
  );
}
