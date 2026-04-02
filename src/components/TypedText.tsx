"use client";

import { useEffect, useState, useRef } from "react";
import { motion, useInView } from "framer-motion";

interface Props {
  text: string;
  className?: string;
  delay?: number;
  speed?: number;
}

export default function TypedText({ text, className, delay = 0, speed = 35 }: Props) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });
  const [count, setCount] = useState(0);
  const [started, setStarted] = useState(false);
  const [showCursor, setShowCursor] = useState(false);

  useEffect(() => {
    if (!isInView) return;
    const t = setTimeout(() => {
      setStarted(true);
      setShowCursor(true);
    }, delay * 1000);
    return () => clearTimeout(t);
  }, [isInView, delay]);

  useEffect(() => {
    if (!started) return;
    if (count >= text.length) {
      const t = setTimeout(() => setShowCursor(false), 2500);
      return () => clearTimeout(t);
    }
    const jitter = speed + (Math.random() - 0.5) * 20;
    const t = setTimeout(() => setCount((c) => c + 1), jitter);
    return () => clearTimeout(t);
  }, [started, count, text.length, speed]);

  const typing = started && count < text.length;

  return (
    <span ref={ref} className={className}>
      {text.slice(0, count)}
      {showCursor && (
        <span className="relative ml-px inline-flex align-baseline">
          <motion.span
            className="inline-block w-[2.5px] rounded-full bg-primary"
            style={{ height: "0.85em" }}
            animate={{ opacity: typing ? 1 : [1, 1, 0, 0] }}
            transition={typing ? {} : { duration: 0.8, repeat: Infinity }}
          />
          <motion.span
            className="absolute left-1/2 -translate-x-1/2 bottom-[calc(100%+4px)] whitespace-nowrap rounded-md px-2 py-0.5 font-sans text-[11px] font-medium leading-none shadow-lg"
            style={{ background: "hsl(220 70% 55%)", color: "white" }}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            Aftar
            <span
              className="absolute left-1/2 top-full -translate-x-1/2 border-[4px] border-transparent"
              style={{ borderTopColor: "hsl(220 70% 55%)" }}
            />
          </motion.span>
        </span>
      )}
    </span>
  );
}
