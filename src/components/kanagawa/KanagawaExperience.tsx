"use client";

import { useEffect, useState } from "react";
import { HOTSPOTS } from "@/data/kanagawa-wiki";
import KanagawaWave from "./KanagawaWave";
import WikiPanel from "./WikiPanel";

/** The wave plus its wiki: gold markers on the print open ASCII entries. */
export default function KanagawaExperience() {
  const [open, setOpen] = useState(false);
  const [sel, setSel] = useState<string | null>(null);

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
    <div className="absolute inset-0">
      <KanagawaWave hotspots={HOTSPOTS} activeId={open ? sel : null} onSelect={pick} />
      {open ? (
        <WikiPanel sel={sel} onSelect={pick} onClose={close} />
      ) : (
        <button
          type="button"
          onClick={() => pick(null)}
          className="absolute bottom-5 right-5 z-20 rounded border border-[#E6C384] bg-[#16161D]/85 px-3 py-1.5 font-mono text-[11px] tracking-widest text-[#E6C384] backdrop-blur transition-colors hover:bg-[#E6C384] hover:text-[#16161D]"
        >
          [ WIKI ] 9 entries
        </button>
      )}
    </div>
  );
}
