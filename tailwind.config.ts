import type { Config } from "tailwindcss";
import defaultTheme from "tailwindcss/defaultTheme";

/**
 * claude.MD §1 "Enforcement": only 8px-multiple spacing tokens may exist.
 * Tailwind's default scale mixes 4px steps (1,3,5,7,9,11 -> 4/12/20/28/36/44px)
 * with 8px steps (2,4,6,8,10,12... -> 8/16/24/32/40/48px). We keep only the
 * keys whose pixel value is an exact multiple of 8, so p-1 / p-3 / p-5 / p-7
 * etc. simply do not exist as classes — an off-baseline utility can't compile.
 */
const BASELINE_PX = 8;

function pxValue(value: string): number | null {
  const remMatch = value.match(/^(-?[\d.]+)rem$/);
  if (remMatch) return parseFloat(remMatch[1]) * 16;
  const pxMatch = value.match(/^(-?[\d.]+)px$/);
  if (pxMatch) return parseFloat(pxMatch[1]);
  if (value === "0px" || value === "0") return 0;
  return null;
}

const baselineSpacing: Record<string, string> = {};
for (const [key, value] of Object.entries(defaultTheme.spacing)) {
  const px = pxValue(value as string);
  if (px !== null && px % BASELINE_PX === 0) {
    baselineSpacing[key] = value as string;
  }
}

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    spacing: baselineSpacing,
    extend: {
      colors: {
        canvas: "#FBFBFA",
        ink: "#111111",
      },
      fontFamily: {
        serif: ["var(--font-serif)", ...defaultTheme.fontFamily.serif],
        sans: ["var(--font-sans)", ...defaultTheme.fontFamily.sans],
      },
      gridTemplateColumns: {
        12: "repeat(12, minmax(0, 1fr))",
      },
      letterSpacing: {
        widest: ".24em",
      },
      transitionDuration: {
        400: "400ms",
      },
    },
  },
  plugins: [],
};

export default config;
