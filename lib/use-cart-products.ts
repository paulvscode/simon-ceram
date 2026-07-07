"use client";

import { useEffect, useState } from "react";
import { useCart } from "./cart-context";
import type { Product } from "./products";

// Cart only stores product ids; this resolves them to full product records
// (title, price, image, sold status) for anywhere the cart is displayed.
export function useCartProducts() {
  const { cart } = useCart();
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/products")
      .then((res) => res.json())
      .then(({ products }: { products: Product[] }) => {
        setAllProducts(products);
        setLoading(false);
      });
  }, []);

  const items = allProducts.filter((p) => cart.includes(p.id));
  return { items, loading };
}
