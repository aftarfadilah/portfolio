"use client";

import { motion, useScroll, useSpring } from "framer-motion";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { C, LANGS, SOURCES, type Key } from "@/data/karhutla";
import Action from "./Action";
import FireMap from "./FireMap";
import Hero from "./Hero";
import HotspotLens from "./HotspotLens";
import Manifesto from "./Manifesto";
import PeatChapter from "./PeatChapter";
import People from "./People";
import SmokeDrift from "./SmokeDrift";
import styles from "./karhutla.module.css";
import { ScrollerCtx, serif } from "./shared";
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
          if (e.isIntersecting) setActive(Number((e.target as HTMLElement).dataset.ch));
        });
      },
      { root, rootMargin: "-45% 0px -45% 0px" },
    );
    root.querySelectorAll("[data-ch]").forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  return (
    <ScrollerCtx.Provider value={scroller}>
      <div ref={scroller} lang={lang} className="fixed inset-0 overflow-y-auto overflow-x-hidden bg-ink text-[#f1ece3]">
        <motion.div style={{ scaleX: bar }} className="fixed inset-x-0 top-0 z-50 h-[3px] origin-left bg-ember" />

        {/* white + difference blend: readable on paper and on smoke alike */}
        <header className="pointer-events-none fixed inset-x-0 top-0 z-40 flex items-center justify-between gap-3 px-5 py-4 text-xs text-white mix-blend-difference sm:px-8">
          <Link href="/" className="pointer-events-auto underline-offset-4 hover:underline">
            {t("back")}
          </Link>
          <p className="hidden items-baseline gap-3 sm:flex" aria-live="polite">
            <span className={`${serif} text-lg italic`}>{String(active).padStart(2, "0")}</span>
            <span className="uppercase tracking-[0.18em]">{t(NAV[active])}</span>
          </p>
          <div role="group" aria-label={t("langAria")} className="pointer-events-auto flex gap-3 uppercase tracking-[0.18em]">
            {LANGS.map((l) => (
              <button key={l.id} type="button" title={l.name} aria-pressed={lang === l.id} onClick={() => setLang(l.id)} className={`pb-0.5 ${lang === l.id ? "border-b border-white" : "opacity-50 hover:opacity-100"}`}>
                {l.label}
              </button>
            ))}
          </div>
        </header>

        <div className={styles.grain} aria-hidden="true" />

        <main>
          <Hero t={t} lang={lang} />
          <Manifesto t={t} />
          <HotspotLens t={t} />
          <FireMap t={t} lang={lang} />
          <PeatChapter t={t} scroller={scroller} />
          <SmokeDrift t={t} lang={lang} />
          <People t={t} />
          <Action t={t} lang={lang} />
        </main>

        <footer className="border-t border-white/15 bg-ink px-6 py-16 sm:px-10">
          <div className="mx-auto grid max-w-7xl gap-10 md:grid-cols-12">
            <div className="md:col-span-5">
              <h2 className={`${serif} text-3xl`}>{t("foot")}</h2>
              <p className="mt-4 text-sm leading-relaxed opacity-60">{t("footNote")}</p>
            </div>
            <ul className="space-y-2 text-sm md:col-span-7">
              {SOURCES.map((s) => (
                <li key={s.href} className="border-t border-white/10 pt-2">
                  <a href={s.href} target="_blank" rel="noopener noreferrer" className="opacity-80 underline-offset-4 hover:underline hover:opacity-100">
                    {s.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </footer>
      </div>
    </ScrollerCtx.Provider>
  );
}
