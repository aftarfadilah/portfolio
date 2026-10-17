"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { HOTSPOTS, UI, type Spot } from "@/data/kanagawa-wiki";
import KanagawaWave from "./KanagawaWave";
import LangSwitch from "./LangSwitch";
import { useLang } from "./useLang";
import WikiPanel from "./WikiPanel";

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

/** The wave, its wiki (three languages) and the page chrome around them. */
export default function KanagawaExperience() {
  const [lang, setLang] = useLang();
  const [open, setOpen] = useState(false);
  const [sel, setSel] = useState<string | null>(null);
  const ui = UI[lang];

  const spots = useMemo<Spot[]>(
    () => HOTSPOTS.map((h) => ({ id: h.id, num: h.num, label: h.label[lang], u: h.u, v: h.v, r: h.r })),
    [lang],
  );

  const pick = (id: string | null) => {
    setSel(id);
    setOpen(true);
  };
  const close = () => {
    setOpen(false);
    setSel(null);
  };

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        setSel(null);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <div lang={lang} className="absolute inset-0">
      <KanagawaWave hotspots={spots} activeId={open ? sel : null} onSelect={pick} />

      <header className="pointer-events-none absolute inset-x-0 top-0 z-30 flex items-start justify-between gap-3 p-5 text-[11px]">
        <Link
          href="/"
          className="pointer-events-auto rounded bg-[#16161D]/70 px-2 py-1 text-[#7E9CD8] backdrop-blur transition-colors hover:text-[#DCD7BA]"
        >
          ← portfolio
        </Link>
        <LangSwitch lang={lang} onLang={setLang} />
      </header>

      <footer className="pointer-events-none absolute bottom-5 left-5 right-5 z-10 flex w-fit max-w-[calc(100%-2.5rem)] flex-col gap-1 rounded bg-[#16161D]/70 px-3 py-2 text-[11px] leading-relaxed text-[#727169] backdrop-blur lg:max-w-[calc(100%-480px)]">
        <h1 className="text-sm font-semibold tracking-widest text-[#DCD7BA]">
          神奈川沖浪裏 <span className="text-[#E6C384]">KANAGAWA</span>
        </h1>
        <p>{ui.footer}</p>
        <ul className="hidden flex-wrap gap-x-3 gap-y-1 pt-1 sm:flex">
          {SWATCHES.map(([name, color]) => (
            <li key={name} className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full" style={{ background: color }} />
              {name}
            </li>
          ))}
        </ul>
      </footer>

      {open ? (
        <WikiPanel lang={lang} onLang={setLang} sel={sel} onSelect={pick} onClose={close} />
      ) : (
        <button
          type="button"
          onClick={() => pick(null)}
          className="absolute bottom-5 right-5 z-20 rounded border border-[#E6C384] bg-[#16161D]/85 px-3 py-1.5 font-mono text-[11px] tracking-widest text-[#E6C384] backdrop-blur transition-colors hover:bg-[#E6C384] hover:text-[#16161D]"
        >
          {ui.open}
        </button>
      )}
    </div>
  );
}
