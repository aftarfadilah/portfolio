"use client";

import { motion, useScroll, useSpring } from "framer-motion";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { C, LANGS, SOURCES, type Key } from "@/data/karhutla";
import Action from "./Action";
import FireMap from "./FireMap";
import Hero from "./Hero";
import HotspotLens from "./HotspotLens";
import PeatChapter from "./PeatChapter";
import People from "./People";
import SmokeDrift from "./SmokeDrift";
import { useLang } from "./useLang";

const NAV: Key[] = ["nav1", "nav2", "nav3", "nav4", "nav5", "nav6", "nav7"];

/** The whole story: one scroll container (the site body is locked), chapters in order. */
export default function KarhutlaStory() {
  const [lang, setLang] = useLang();
  const scroller = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const t = useCallback((k: Key) => C[k][lang], [lang]);

  const { scrollYProgress } = useScroll({ container: scroller });
  const bar = useSpring(scrollYProgress, { stiffness: 120, damping: 24, mass: 0.3 });

  useEffect(() => {
    const root = scroller.current;
    if (!root) return;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) setActive(Number(e.target.id.replace("ch-", "")));
        });
      },
      { root, rootMargin: "-45% 0px -45% 0px" },
    );
    NAV.forEach((_, i) => {
      const el = root.querySelector(`#ch-${i}`);
      if (el) io.observe(el);
    });
    return () => io.disconnect();
  }, []);

  const go = (i: number) => scroller.current?.querySelector(`#ch-${i}`)?.scrollIntoView({ behavior: "smooth" });

  return (
    <div ref={scroller} lang={lang} className="fixed inset-0 overflow-y-auto overflow-x-hidden bg-[#120b0a] text-stone-100">
      <motion.div style={{ scaleX: bar }} className="fixed inset-x-0 top-0 z-50 h-0.5 origin-left bg-gradient-to-r from-orange-500 to-amber-300" />

      <header className="pointer-events-none fixed inset-x-0 top-0 z-40 flex items-start justify-between gap-3 p-4 text-[11px]">
        <Link href="/" className="pointer-events-auto rounded bg-black/50 px-2 py-1 text-orange-200 backdrop-blur transition-colors hover:text-white">
          {t("back")}
        </Link>
        <div role="group" aria-label={t("langAria")} className="pointer-events-auto flex overflow-hidden rounded border border-orange-300/50 bg-black/50 font-mono backdrop-blur">
          {LANGS.map((l) => (
            <button
              key={l.id}
              type="button"
              title={l.name}
              aria-pressed={lang === l.id}
              onClick={() => setLang(l.id)}
              className={`px-2.5 py-1 tracking-widest transition-colors ${lang === l.id ? "bg-orange-300 text-black" : "text-orange-200 hover:bg-white/10"}`}
            >
              {l.label}
            </button>
          ))}
        </div>
      </header>

      <nav aria-label={t("chapters")} className="fixed right-3 top-1/2 z-40 hidden -translate-y-1/2 flex-col gap-3 lg:flex">
        {NAV.map((k, i) => (
          <button key={k} type="button" onClick={() => go(i)} aria-current={active === i} className="group flex items-center justify-end gap-2">
            <span className={`rounded bg-black/60 px-2 py-0.5 text-[11px] text-orange-100 transition-opacity ${active === i ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}>{t(k)}</span>
            <span className={`block rounded-full transition-all ${active === i ? "h-3 w-3 bg-orange-400" : "h-2 w-2 bg-white/30 group-hover:bg-white/60"}`} />
          </button>
        ))}
      </nav>

      <main>
        <Hero t={t} lang={lang} />
        <HotspotLens t={t} />
        <FireMap t={t} lang={lang} />
        <PeatChapter t={t} scroller={scroller} />
        <SmokeDrift t={t} lang={lang} />
        <People t={t} />
        <Action t={t} lang={lang} />
      </main>

      <footer className="border-t border-white/10 px-6 py-14">
        <div className="mx-auto max-w-4xl">
          <h2 className="font-mono text-[11px] uppercase tracking-widest text-orange-300/80">{t("foot")}</h2>
          <p className="mt-3 text-sm leading-relaxed text-stone-400">{t("footNote")}</p>
          <ul className="mt-5 space-y-1.5 text-sm">
            {SOURCES.map((s) => (
              <li key={s.href}>
                <a href={s.href} target="_blank" rel="noopener noreferrer" className="text-orange-200 underline-offset-4 hover:underline">
                  {s.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </footer>
    </div>
  );
}
