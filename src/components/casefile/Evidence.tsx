"use client";

import { useState } from "react";
import { awards, awardsHeading, evidence, evidenceHeading } from "@/data/casefile";

/** Career as case evidence. One row is open at a time; Enter or a tap opens another. */
export default function Evidence() {
  const [open, setOpen] = useState(0);

  return (
    <section aria-labelledby="evidence-heading" className="mx-auto max-w-6xl px-6 py-24 sm:py-40">
      <h2 id="evidence-heading" className="mb-10 font-mono text-xs tracking-[0.18em] text-ember uppercase sm:text-sm">
        {"// "}
        {evidenceHeading}
      </h2>

      <ul className="border-t border-white/15">
        {evidence.map((e, i) => {
          const isOpen = open === i;
          return (
            <li key={`${e.company}-${e.year}`} className="border-b border-white/15">
              <button
                type="button"
                aria-expanded={isOpen}
                onClick={() => setOpen(isOpen ? -1 : i)}
                className="group grid w-full cursor-pointer grid-cols-[2.5rem_1fr_auto] items-baseline gap-x-4 py-5 text-left sm:grid-cols-[4rem_9rem_1fr_auto] sm:py-7"
              >
                <span className="font-mono text-xs opacity-50 sm:text-sm">{e.no}</span>
                <span className="hidden font-mono text-sm opacity-50 sm:block">{e.year}</span>
                <span className="text-xl font-light tracking-[-0.04em] transition-transform duration-300 group-hover:translate-x-2 sm:text-4xl">
                  {e.role}
                  <span className="block text-sm font-normal tracking-normal opacity-50 sm:inline sm:pl-4 sm:text-lg">{e.company}</span>
                </span>
                <span aria-hidden className={`font-mono text-sm text-ember transition-transform ${isOpen ? "rotate-45" : ""}`}>
                  +
                </span>
              </button>

              <div className={`grid transition-[grid-template-rows] duration-500 ${isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}>
                <div className="overflow-hidden">
                  <div className="grid gap-4 pb-8 sm:grid-cols-[4rem_9rem_1fr] sm:gap-x-4">
                    <span className="hidden sm:block" />
                    <span className="font-mono text-xs opacity-50 sm:hidden">{e.year}</span>
                    <span className="hidden font-mono text-xs opacity-50 sm:block">{e.place}</span>
                    <div className="max-w-2xl">
                      <p className="text-base leading-relaxed opacity-80 sm:text-lg">{e.note}</p>
                      <ul className="mt-4 flex flex-wrap gap-2 font-mono text-[11px]">
                        {e.tags.map((t) => (
                          <li key={t} className="border border-white/20 px-2 py-0.5">
                            {t}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </li>
          );
        })}
      </ul>

      <h2 className="mt-24 mb-8 font-mono text-xs tracking-[0.18em] text-ember uppercase sm:text-sm">
        {"// "}
        {awardsHeading}
      </h2>
      <ul className="border-t border-white/15 font-mono text-sm uppercase">
        {awards.map((a) => (
          <li key={a} className="flex items-baseline justify-between gap-6 border-b border-white/15 py-4">
            <span>{a}</span>
            <span className="opacity-50">x1</span>
          </li>
        ))}
      </ul>
      <p className="mt-6 font-mono text-sm">
        <span className="text-ember">[{String(awards.length).padStart(2, "0")}]</span> in total
      </p>
    </section>
  );
}
