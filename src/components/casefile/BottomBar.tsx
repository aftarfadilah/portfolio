"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { closer, nav, panel } from "@/data/casefile";
import styles from "./casefile.module.css";

/** The fixed grey bar: sections on the left; on the right the owner's local time and a white call to action. */
export default function BottomBar() {
  const clock = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const fmt = new Intl.DateTimeFormat("en-GB", { timeZone: panel.tz, hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false });
    const tick = () => {
      if (clock.current) clock.current.textContent = fmt.format(new Date());
    };
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, []);

  return (
    <nav aria-label="Sections" className={`${styles.bottomBar} ${styles.ui} fixed inset-x-0 bottom-0 z-[57] flex h-7 items-center justify-between bg-[#393939] pl-[10px] text-[#c8c8c8]`}>
      <ul className="flex items-center gap-4 sm:gap-6">
        <li>
          <Link href="/" className="hover:text-white">←<span className="max-sm:hidden"> ide</span></Link>
        </li>
        {nav.map((n) => (
          <li key={n.id}>
            <a href={`#${n.id}`} className="hover:text-white">
              {n.label} <span className="opacity-50">+</span>
            </a>
          </li>
        ))}
      </ul>
      <div className="flex h-full items-center gap-4">
        <span className="flex items-center gap-2 max-sm:hidden">
          {panel.tzLabel}
          <i className="inline-block h-[5px] w-[5px] bg-red-600" aria-hidden />
          <span ref={clock} className="tabular-nums">--:--:--</span>
        </span>
        <a href="#contact" className="flex h-[20px] items-center bg-white px-3 text-[#393939] hover:bg-[#c8c8c8] sm:mr-[6px]">
          {closer.cta} <span className="pl-2">+</span>
        </a>
      </div>
    </nav>
  );
}
