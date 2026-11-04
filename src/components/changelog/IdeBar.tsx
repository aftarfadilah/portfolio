"use client";

import { useEffect, useRef, type RefObject } from "react";
import { bar } from "@/data/changelog";
import { DOC_LINES } from "./Doc";
import styles from "./changelog.module.css";

function Branch() {
  return (
    <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor" aria-hidden>
      <path d="M11.75 2.5a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5Zm-2.25.75a2.25 2.25 0 1 1 3 2.122V6A2.5 2.5 0 0 1 10 8.5H6a1 1 0 0 0-1 1v1.128a2.251 2.251 0 1 1-1.5 0V5.372a2.25 2.25 0 1 1 1.5 0v1.836A2.493 2.493 0 0 1 6 7h4a1 1 0 0 0 1-1v-.628A2.25 2.25 0 0 1 9.5 3.25ZM4.25 12a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5ZM3.5 3.25a.75.75 0 1 1 1.5 0 .75.75 0 0 1-1.5 0Z" />
    </svg>
  );
}

/** The editor's status bar, as the page's navigation: branch, section links, the line you are on, the owner's local time. */
export default function IdeBar({ scrollRef }: { scrollRef: RefObject<HTMLElement | null> }) {
  const ln = useRef<HTMLSpanElement>(null);
  const clock = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const main = scrollRef.current;
    const onScroll = () => {
      if (!main || !ln.current) return;
      const max = Math.max(1, main.scrollHeight - main.clientHeight);
      ln.current.textContent = String(Math.max(1, Math.round((main.scrollTop / max) * DOC_LINES)));
    };
    main?.addEventListener("scroll", onScroll, { passive: true });

    const fmt = new Intl.DateTimeFormat("en-GB", { timeZone: bar.tz, hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false });
    const tick = () => {
      if (clock.current) clock.current.textContent = fmt.format(new Date());
    };
    tick();
    const t = setInterval(tick, 1000);
    return () => {
      main?.removeEventListener("scroll", onScroll);
      clearInterval(t);
    };
  }, [scrollRef]);

  return (
    <nav aria-label="Sections" className={`${styles.bar} fixed inset-x-0 bottom-0 z-[57] flex h-7 items-center justify-between bg-ide-statusbar px-3 font-mono text-[11px] text-white/90`}>
      <div className="flex items-center gap-4">
        <span className="flex items-center gap-1.5">
          <Branch />
          {bar.branch}
        </span>
        <ul className="flex items-center gap-4 max-md:hidden">
          {bar.nav.map((n) => (
            <li key={n.id}>
              <a href={`#${n.id}`} className="hover:text-white hover:underline">
                {n.label}
              </a>
            </li>
          ))}
        </ul>
      </div>
      <div className="flex items-center gap-4">
        <span>
          Ln <span ref={ln}>1</span>, Col 1
        </span>
        <span className="max-sm:hidden">{bar.file}</span>
        <span className="max-sm:hidden">UTF-8</span>
        <span className="tabular-nums">
          {bar.tzLabel} <span ref={clock}>--:--:--</span>
        </span>
      </div>
    </nav>
  );
}
