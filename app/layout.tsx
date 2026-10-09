import type { Metadata } from "next";
import { Source_Code_Pro } from "next/font/google";
import GridOverlay from "@/components/GridOverlay";
import KilnEasterEgg from "@/components/KilnEasterEgg";
import { CartProvider } from "@/lib/cart-context";
import "./globals.css";

// The site's single typeface (the admin keeps a system UI font). 600: the
// family name in the Logo wordmark; italic: the homepage hero phrase.
const sans = Source_Code_Pro({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Simon Barraud de Lagerie — Céramiste",
  description: "Pièces uniques façonnées à la main, en grès et porcelaine.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={sans.variable}>
      <body className="font-sans">
        <CartProvider>
          {children}
          <GridOverlay />
          <KilnEasterEgg />
        </CartProvider>
      </body>
    </html>
  );
}
