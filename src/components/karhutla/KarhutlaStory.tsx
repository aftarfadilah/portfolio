"use client";

import Link from "next/link";
import { useCallback } from "react";
import { C, LANGS, type Key } from "@/data/karhutla";
import Hero from "./Hero";
import { useLang } from "./useLang";

/** One screen: the hero is the whole page for now. */
export default function KarhutlaStory() {
  const [lang, setLang] = useLang();
  const t = useCallback((k: Key) => C[k][lang], [lang]);

  return (
    <div lang={lang} className="fixed inset-0 overflow-hidden bg-[#0a0706] text-[#efe7dc]">
      <header className="pointer-events-none absolute inset-x-0 top-0 z-40 flex items-center justify-between gap-3 px-5 py-4 text-xs sm:px-8">
        <Link href="/" className="pointer-events-auto underline-offset-4 hover:underline">
          {t("back")}
        </Link>
        <div role="group" aria-label={t("langAria")} className="pointer-events-auto flex gap-3 uppercase tracking-[0.18em]">
          {LANGS.map((l) => (
            <button key={l.id} type="button" title={l.name} aria-pressed={lang === l.id} onClick={() => setLang(l.id)} className={`pb-0.5 ${lang === l.id ? "border-b border-current" : "opacity-50 hover:opacity-100"}`}>
              {l.label}
            </button>
          ))}
        </div>
      </header>
      <Hero t={t} lang={lang} />
    </div>
  );
}
