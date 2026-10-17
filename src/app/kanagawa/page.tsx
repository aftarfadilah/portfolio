import type { Metadata } from "next";
import Link from "next/link";
import KanagawaWave from "@/components/kanagawa/KanagawaWave";

export const metadata: Metadata = {
  title: "Kanagawa — Aftar Fadilah",
  description:
    "The Great Wave off Kanagawa as a fullscreen, animated, colored ASCII landing page in the Kanagawa theme.",
};

// kanagawa.nvim (wave) accents.
const SWATCHES = [
  ["sumiInk", "#1F1F28"],
  ["waveBlue", "#2D4F67"],
  ["crystalBlue", "#7E9CD8"],
  ["springBlue", "#7FB4CA"],
  ["sakuraPink", "#D27E99"],
  ["carpYellow", "#E6C384"],
  ["fujiWhite", "#DCD7BA"],
] as const;

export default function KanagawaPage() {
  return (
    <main className="relative h-screen w-screen overflow-hidden bg-[#1F1F28] font-mono text-[#DCD7BA]">
      <KanagawaWave />

      <header className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between p-5 text-[11px]">
        <Link
          href="/"
          className="pointer-events-auto rounded bg-[#16161D]/70 px-2 py-1 text-[#7E9CD8] backdrop-blur transition-colors hover:text-[#DCD7BA]"
        >
          ← portfolio
        </Link>
        <ul className="hidden gap-3 rounded bg-[#16161D]/70 px-3 py-1.5 backdrop-blur sm:flex">
          {SWATCHES.map(([name, color]) => (
            <li key={name} className="flex items-center gap-1.5 text-[#727169]">
              <span className="h-2 w-2 rounded-full" style={{ background: color }} />
              {name}
            </li>
          ))}
        </ul>
      </header>

      <footer className="pointer-events-none absolute bottom-5 left-5 right-5 flex w-fit flex-col gap-1 rounded bg-[#16161D]/70 px-3 py-2 text-[11px] leading-relaxed text-[#727169] backdrop-blur">
        <h1 className="text-sm font-semibold tracking-widest text-[#DCD7BA]">
          神奈川沖浪裏 <span className="text-[#E6C384]">KANAGAWA</span>
        </h1>
        <p>The Great Wave, drawn in ASCII · move to light the lantern · click to ripple</p>
      </footer>
    </main>
  );
}
