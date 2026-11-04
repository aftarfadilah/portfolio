"use client";

import { useEffect, useRef, useState, type RefObject } from "react";
import { hud } from "@/data/changelog";
import styles from "./changelog.module.css";

const pad = (n: number) => String(Math.max(0, Math.round(n))).padStart(3, "0");

/** Fixed corner readouts. Cursor, scroll and clock write straight to the DOM so they never re-render the page. */
export default function Hud({ scrollRef }: { scrollRef: RefObject<HTMLElement | null> }) {
  const xRef = useRef<HTMLSpanElement>(null);
  const yRef = useRef<HTMLSpanElement>(null);
  const scrollPct = useRef<HTMLSpanElement>(null);
  const clock = useRef<HTMLSpanElement>(null);
  const [alert, setAlert] = useState(0);

  useEffect(() => {
    const move = (e: PointerEvent) => {
      if (xRef.current) xRef.current.textContent = pad(e.clientX);
      if (yRef.current) yRef.current.textContent = pad(e.clientY);
    };
    window.addEventListener("pointermove", move, { passive: true });

    const el = scrollRef.current;
    const onScroll = () => {
      if (!el || !scrollPct.current) return;
      const max = el.scrollHeight - el.clientHeight;
      scrollPct.current.textContent = `${Math.round((el.scrollTop / Math.max(1, max)) * 100)}%`;
    };
    el?.addEventListener("scroll", onScroll, { passive: true });

    const tick = () => {
      if (clock.current) clock.current.textContent = new Date().toLocaleTimeString("en-GB");
    };
    tick();
    const clockTimer = setInterval(tick, 1000);
    const alertTimer = setInterval(() => setAlert((a) => (a + 1) % hud.alerts.length), 3200);

    return () => {
      window.removeEventListener("pointermove", move);
      el?.removeEventListener("scroll", onScroll);
      clearInterval(clockTimer);
      clearInterval(alertTimer);
    };
  }, [scrollRef]);

  return (
    <div aria-hidden className={`${styles.heroOnly} pointer-events-none fixed inset-0 z-50 font-mono text-[11px] text-[#c8c8c8] sm:text-[13px]`}>
      <div className="absolute top-5 right-5 text-right sm:top-8 sm:right-8">
        <span ref={clock}>--:--:--</span>
        <div className="mt-1 opacity-50">
          scroll <span ref={scrollPct}>0%</span>
        </div>
      </div>

      <div className="absolute bottom-5 left-5 sm:bottom-8 sm:left-8">
        <div className="hidden sm:block">
          X <span ref={xRef}>000</span>
          <br />
          Y <span ref={yRef}>000</span>
        </div>
        <div className="mt-2 opacity-50">{hud.file}</div>
      </div>

      <div className="absolute right-5 bottom-5 max-w-[45vw] text-right sm:right-8 sm:bottom-8">
        <span className={`${styles.flicker} text-ember`} key={alert}>
          {hud.alerts[alert]}
        </span>
        <div className="mt-1 opacity-50">{hud.status}</div>
      </div>
    </div>
  );
}
