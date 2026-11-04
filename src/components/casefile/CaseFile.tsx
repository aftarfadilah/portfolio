"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useCallback, useRef, useState } from "react";
import { closer, opener } from "@/data/casefile";
import Closer from "./Closer";
import Evidence from "./Evidence";
import Gate from "./Gate";
import Hud from "./Hud";
import Marquee from "./Marquee";
import Narrative from "./Narrative";
import XrayLens from "./XrayLens";
import styles from "./casefile.module.css";
import { useReducedMotion } from "./useReducedMotion";

const beat = (i: number, reduced: boolean) => ({
  initial: reduced ? false : { opacity: 0, y: 40, filter: "blur(10px)" },
  animate: { opacity: 1, y: 0, filter: "blur(0px)" },
  transition: { duration: 0.9, delay: 0.25 + i * 0.55, ease: [0.22, 0.61, 0.36, 1] as const },
});

export default function CaseFile() {
  const [ready, setReady] = useState(false);
  const scroller = useRef<HTMLElement>(null);
  const reduced = useReducedMotion();
  const done = useCallback(() => setReady(true), []);

  return (
    <div className={`${styles.root} fixed inset-0 overflow-hidden bg-black text-[#c8c8c8]`}>
      {!ready && <Gate onDone={done} />}

      <div aria-hidden className={styles.grain} />
      <div aria-hidden className={styles.hatch} />
      <div aria-hidden className={styles.crt} />
      <Hud scrollRef={scroller} />

      <Link href="/" className="fixed top-5 left-5 z-[55] font-mono text-[11px] underline-offset-4 hover:text-ember hover:underline sm:top-8 sm:left-8 sm:text-[13px]">
        {closer.back}
      </Link>

      <main ref={scroller} className="absolute inset-0 overflow-y-auto overflow-x-hidden scroll-smooth">
        <section className="flex min-h-svh flex-col justify-center px-6 sm:px-16">
          {ready && (
            <h1 className="text-[clamp(2.4rem,9.5vw,10rem)] leading-[0.92] font-light tracking-[-0.05em] lowercase">
              <motion.span className="block" {...beat(0, reduced)}>
                {opener.a}
              </motion.span>
              <motion.span className="block opacity-60" {...beat(1, reduced)}>
                {opener.b}
              </motion.span>
              <motion.span className="block text-ember" {...beat(2, reduced)}>
                {opener.c}
              </motion.span>
            </h1>
          )}
        </section>

        <Marquee />
        <Narrative />
        <XrayLens />
        <Evidence />
        <Closer />
      </main>
    </div>
  );
}
