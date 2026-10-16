"use client";

import { motion } from "framer-motion";
import { socialLinks } from "@/data/content";
import AsciiIntro, { ASCII_INTRO_DURATION } from "@/components/AsciiIntro";

const INTRO = ASCII_INTRO_DURATION - 0.6;

function fadeIn(delay: number) {
  return {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6, delay: delay + INTRO },
  };
}

export default function HeroChapter() {
  return (
    <section
      id="hero"
      className="relative flex min-h-[calc(100vh-6rem)] items-center justify-center overflow-x-clip bg-background"
      style={{ scrollMarginTop: "6.5rem" }}
    >
      {/* Fullscreen ASCII field + loading intro */}
      <AsciiIntro links={socialLinks} />

      {/* Screen-reader copy; the visible hero is drawn as ASCII on the canvas */}
      <div className="sr-only">
        <h1>Aftar Fadilah</h1>
        <p>Software Engineer &amp; Founder</p>
        <p>QA Engineer at NoscAI. Founder of Shiro Labs.</p>
        <ul>
          {socialLinks.map((link) => (
            <li key={link.label}>
              <a href={link.href}>{link.label}</a>
            </li>
          ))}
        </ul>
      </div>

      {/* Scroll indicator */}
      <motion.div
        className="absolute bottom-10 left-1/2 flex -translate-x-1/2 flex-col items-center gap-2"
        {...fadeIn(0.3)}
      >
        <span className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
          Scroll to explore
        </span>
        <motion.svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-muted-foreground"
          animate={{ y: [0, 6, 0] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
        >
          <path d="M4 6l4 4 4-4" />
        </motion.svg>
      </motion.div>
    </section>
  );
}
