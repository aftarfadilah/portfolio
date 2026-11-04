"use client";

import { useEffect, useRef, useState } from "react";
import { narrative } from "@/data/casefile";
import styles from "./casefile.module.css";

/** One line of the story. It surfaces when it crosses the middle of the screen. */
function Line({ text }: { text: string }) {
  const ref = useRef<HTMLParagraphElement>(null);
  const [seen, setSeen] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setSeen(true);
          io.disconnect();
        }
      },
      { rootMargin: "0px 0px -18% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  if (text === "") return <div aria-hidden className="h-8 sm:h-12" />;
  return (
    <p ref={ref} data-in={seen} className={`${styles.line} text-xl leading-snug font-light sm:text-3xl lg:text-4xl`}>
      {text}
    </p>
  );
}

export default function Narrative() {
  return (
    <section aria-labelledby="case-heading" className="mx-auto max-w-4xl px-6 py-32 sm:py-48">
      <h2 id="case-heading" className="mb-16 font-mono text-xs tracking-[0.18em] text-ember sm:text-sm">
        {narrative.heading}
      </h2>
      <div className="space-y-1.5 sm:space-y-3">
        {narrative.lines.map((l, i) => (
          <Line key={i} text={l} />
        ))}
      </div>
    </section>
  );
}
