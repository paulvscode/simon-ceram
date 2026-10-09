"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

/*
 * Easter egg: type C-U-I-S-S-O-N within 10 seconds (anywhere on the public
 * site, outside form fields) and the site goes through a kiln firing —
 * flames and embers rise from the bottom, the page warms to an orange glow
 * and a pyrometer climbs to 1300 °C, then everything cools and "Défournement"
 * closes the show. Escape stops it early. Visitors who ask for reduced motion
 * get the warm glow and the temperature without moving flames.
 */

const WORD = "CUISSON";
const WINDOW_MS = 10_000;
const DURATION_MS = 9_000;
const PEAK_TEMP = 1300;

// Firing curve, 0 → 1 → 0: ignition (0–2 s), full fire (2–6.5 s), cooling.
function intensityAt(t: number): number {
  const s = t / 1000;
  if (s < 2) return s / 2;
  if (s < 6.5) return 1;
  return Math.max(0, 1 - (s - 6.5) / 2.5);
}

type Particle = { x: number; y: number; vx: number; vy: number; life: number; max: number; size: number; spark: boolean };

function isTypingTarget(target: EventTarget | null): boolean {
  const el = target as HTMLElement | null;
  if (!el) return false;
  return el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.tagName === "SELECT" || el.isContentEditable;
}

export default function KilnEasterEgg() {
  const pathname = usePathname();
  const [firing, setFiring] = useState(false);
  const [temperature, setTemperature] = useState(20);
  const [phase, setPhase] = useState<"cuisson" | "defournement">("cuisson");
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const keys = useRef<{ char: string; at: number }[]>([]);
  const stopRef = useRef<() => void>(() => {});

  const disabled = pathname.startsWith("/admin");

  // Listen for the word.
  useEffect(() => {
    if (disabled) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") return stopRef.current();
      if (event.ctrlKey || event.metaKey || event.altKey || event.key.length !== 1) return;
      if (isTypingTarget(event.target)) return;
      const now = Date.now();
      keys.current = [...keys.current, { char: event.key.toUpperCase(), at: now }]
        .filter((k) => now - k.at <= WINDOW_MS)
        .slice(-WORD.length);
      if (keys.current.map((k) => k.char).join("") === WORD) {
        keys.current = [];
        setFiring(true);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [disabled]);

  const stop = useCallback(() => {
    setFiring(false);
    document.documentElement.classList.remove("cuisson");
    document.documentElement.style.removeProperty("--cuisson");
  }, []);
  stopRef.current = stop;

  // Run one firing.
  useEffect(() => {
    if (!firing) return;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const canvas = canvasRef.current;
    const ctx = reduceMotion ? null : canvas?.getContext("2d") ?? null;
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    const particles: Particle[] = [];
    const root = document.documentElement;
    root.classList.add("cuisson");
    setPhase("cuisson");

    function resize() {
      if (!canvas) return;
      canvas.width = Math.round(window.innerWidth * dpr);
      canvas.height = Math.round(window.innerHeight * dpr);
    }
    resize();
    window.addEventListener("resize", resize);

    const start = performance.now();
    let frame = 0;

    function tick(now: number) {
      const t = now - start;
      if (t >= DURATION_MS) return stop();
      const k = intensityAt(t);
      root.style.setProperty("--cuisson", k.toFixed(3));
      // Pyrometer: follows the curve, peaks at 1300 °C.
      setTemperature(Math.round(20 + (PEAK_TEMP - 20) * k));
      if (t > 7_000) setPhase("defournement");

      if (ctx && canvas) {
        const w = canvas.width;
        const h = canvas.height;
        // Spawn flames along the bottom edge; more and taller as the kiln heats.
        const spawn = Math.round(70 * k * (w / (1440 * dpr)) + 6 * k);
        for (let i = 0; i < spawn; i++) {
          const spark = Math.random() < 0.06;
          particles.push({
            x: Math.random() * w,
            y: h + 10 * dpr,
            vx: (Math.random() - 0.5) * 1.2 * dpr,
            vy: -(2.5 + Math.random() * 5.5 * (0.4 + k)) * dpr,
            life: 0,
            max: spark ? 140 + Math.random() * 80 : 40 + Math.random() * 55 * (0.5 + k),
            size: spark ? (1 + Math.random() * 1.5) * dpr : (14 + Math.random() * 34) * dpr * (0.6 + 0.6 * k),
            spark,
          });
        }
        ctx.clearRect(0, 0, w, h);
        ctx.globalCompositeOperation = "lighter";
        for (let i = particles.length - 1; i >= 0; i--) {
          const p = particles[i];
          p.life++;
          p.x += p.vx + Math.sin((p.life + p.y) / 18) * 0.6 * dpr;
          p.y += p.vy;
          if (p.life > p.max || p.y < -50) {
            particles.splice(i, 1);
            continue;
          }
          const age = p.life / p.max; // 0 = hot base, 1 = cooled tip
          const alpha = (1 - age) * (p.spark ? 0.9 : 0.35);
          const r = p.spark ? p.size : p.size * (1 - age * 0.6);
          // White-yellow core → orange → deep red as the flame rises.
          const hue = 50 - age * 45;
          const light = p.spark ? 70 : 60 - age * 25;
          const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, r);
          g.addColorStop(0, `hsla(${hue}, 100%, ${light + 20}%, ${alpha})`);
          g.addColorStop(1, `hsla(${hue - 10}, 100%, ${light}%, 0)`);
          ctx.fillStyle = g;
          ctx.beginPath();
          ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.globalCompositeOperation = "source-over";
      }
      frame = requestAnimationFrame(tick);
    }
    frame = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", resize);
      root.classList.remove("cuisson");
      root.style.removeProperty("--cuisson");
    };
  }, [firing, stop]);

  if (!firing || disabled) return null;

  return (
    <div aria-live="polite" className="pointer-events-none fixed inset-0 z-[300]">
      {/* Kiln glow: hottest at the bottom, follows the firing curve. */}
      <div
        className="absolute inset-0"
        style={{
          opacity: "var(--cuisson, 0)",
          background:
            "radial-gradient(ellipse at 50% 120%, rgba(255,170,40,0.55) 0%, rgba(230,70,10,0.35) 35%, rgba(120,20,0,0.15) 65%, transparent 85%)",
        }}
      />
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />
      <div className="absolute inset-x-0 top-1/3 text-center font-sans text-canvas [text-shadow:0_0_24px_rgba(120,20,0,0.9)]">
        <p className="text-5xl font-semibold tabular-nums md:text-7xl">
          {temperature.toLocaleString("fr-FR")}&nbsp;°C
        </p>
        <p className="mt-4 text-xs uppercase tracking-widest">
          {phase === "cuisson" ? "Cuisson au four à bois" : "Défournement"}
        </p>
      </div>
    </div>
  );
}
