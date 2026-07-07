import type { Metadata } from "next";
import { Fraunces, Inter } from "next/font/google";
import GridOverlay from "@/components/GridOverlay";
import "./globals.css";

const serif = Fraunces({
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  style: ["normal", "italic"],
  variable: "--font-serif",
  display: "swap",
});

const sans = Inter({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Simon Céramique — Atelier",
  description: "Pièces uniques façonnées à la main, en grès et porcelaine.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={`${serif.variable} ${sans.variable}`}>
      <body className="font-sans">
        {children}
        <GridOverlay />
      </body>
    </html>
  );
}
