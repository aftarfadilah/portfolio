"use client";

import { useMemo, useState, useEffect, useRef } from "react";

const SYMBOLS = [
  "{ }", "< />", "=>", "const", "import", "//", "&&", "===",
  "async", "return", "( )", "[ ]", "0x1F", "|>", "let", "fn",
  "null", "::", ">>", "!=", "++", "export", "void", "yield",
  "try", "catch", "if", "else", "for", "map", "=>", "...",
];

const SIZES = ["text-[10px]", "text-xs", "text-sm", "text-base", "text-lg", "text-xl", "text-2xl", "text-3xl"];

function rand(min: number, max: number) {
  return Math.random() * (max - min) + min;
}

function pickRandom() {
  return SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)];
}

interface Particle {
  id: number;
  x: number;
  y: number;
  size: string;
  speed: number;
  swapInterval: number;
  opacity: number;
}

function generateParticles(count: number, pageHeight: number): Particle[] {
  return Array.from({ length: count }, (_, i) => {
    const depth = Math.random();
    return {
      id: i,
      x: rand(2, 96),
      y: rand(0, pageHeight),
      size: depth < 0.3
        ? SIZES[Math.floor(rand(4, 7))]
        : depth < 0.7
        ? SIZES[Math.floor(rand(2, 4))]
        : SIZES[Math.floor(rand(0, 2))],
      speed: depth < 0.3 ? rand(-0.3, 0.1) : depth < 0.7 ? rand(0.4, 0.7) : rand(1.2, 1.8),
      swapInterval: rand(600, 2000),
      opacity: depth < 0.3 ? rand(0.06, 0.12) : depth < 0.7 ? rand(0.04, 0.07) : rand(0.02, 0.04),
    };
  });
}

function ParticleSymbol({ p, scrollY }: { p: Particle; scrollY: number }) {
  const [text, setText] = useState(pickRandom);

  useEffect(() => {
    const id = setInterval(() => setText(pickRandom()), p.swapInterval);
    return () => clearInterval(id);
  }, [p.swapInterval]);

  const parallaxY = p.y - scrollY * p.speed;

  return (
    <span
      className={`absolute font-mono ${p.size} text-foreground select-none pointer-events-none`}
      style={{
        left: `${p.x}%`,
        top: 0,
        transform: `translateY(${parallaxY}px)`,
        opacity: p.opacity,
        willChange: "transform",
      }}
    >
      {text}
    </span>
  );
}

export default function FloatingCode({ scrollRef }: { scrollRef?: React.RefObject<HTMLDivElement | null> }) {
  const [scrollY, setScrollY] = useState(0);
  const [pageHeight, setPageHeight] = useState(5000);
  const rafRef = useRef(0);

  useEffect(() => {
    const el = scrollRef?.current;
    if (!el) return;

    setPageHeight(el.scrollHeight);

    const onScroll = () => {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => {
        setScrollY(el.scrollTop);
      });
    };

    el.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      el.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(rafRef.current);
    };
  }, [scrollRef]);

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const particles = useMemo(() => mounted ? generateParticles(60, pageHeight) : [], [mounted, pageHeight]);

  if (!mounted) return null;

  return (
    <div
      className="pointer-events-none fixed inset-0 overflow-hidden z-[3]"
      aria-hidden="true"
    >
      {particles.map((p) => (
        <ParticleSymbol key={p.id} p={p} scrollY={scrollY} />
      ))}
    </div>
  );
}
