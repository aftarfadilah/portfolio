"use client";

import { motion } from "framer-motion";
import { socialLinks } from "@/data/content";
import TypedText from "@/components/TypedText";

const SOCIAL_ICONS: Record<string, React.ReactNode> = {
  github: (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0 1 12 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z" />
    </svg>
  ),
  linkedin: (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  ),
  email: (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
    </svg>
  ),
};

function fadeIn(delay: number) {
  return {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6, delay },
  };
}

export default function HeroChapter() {
  return (
    <section
      id="hero"
      className="relative flex min-h-[calc(100vh-6rem)] items-center justify-center overflow-hidden bg-background"
      style={{ scrollMarginTop: "6.5rem" }}
    >
      {/* Grid pattern background */}
      <div
        className="pointer-events-none absolute inset-0"
        aria-hidden="true"
        style={{
          backgroundImage: `linear-gradient(rgba(59, 105, 204, 0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(59, 105, 204, 0.03) 1px, transparent 1px)`,
          backgroundSize: "60px 60px",
        }}
      />

      {/* Radial gradient glow orb */}
      <div
        className="pointer-events-none absolute inset-0"
        aria-hidden="true"
        style={{
          background:
            "radial-gradient(500px circle at 50% 0%, rgba(59, 105, 204, 0.15), transparent 70%)",
          filter: "blur(120px)",
        }}
      />

      {/* Content */}
      <div className="relative z-10 mx-auto max-w-3xl px-6 text-center">
        <motion.p
          className="font-mono text-sm tracking-widest text-syntax-comment"
          {...fadeIn(0)}
        >
          {"// 00"}
        </motion.p>

        <h1 className="mt-6 text-7xl font-bold tracking-tight text-foreground md:text-8xl">
          <TypedText text="Aftar Fadilah" delay={0.3} speed={55} />
        </h1>

        <motion.p
          className="mt-4 text-xl text-muted-foreground md:text-2xl"
          {...fadeIn(1.2)}
        >
          Software Engineer &amp; Founder
        </motion.p>

        <motion.p
          className="mx-auto mt-4 max-w-lg text-lg text-muted-foreground"
          {...fadeIn(1.5)}
        >
          QA Engineer at NoscAI. Founder of Shiro Labs.
        </motion.p>

        {/* Social icons row */}
        <motion.div
          className="mt-10 flex items-center justify-center gap-6"
          {...fadeIn(1.8)}
        >
          {socialLinks.map((link) => {
            const isEmail = link.icon === "email";
            return (
              <a
                key={link.label}
                href={link.href}
                {...(!isEmail && {
                  target: "_blank",
                  rel: "noopener noreferrer",
                })}
                className="text-muted-foreground transition-colors hover:text-primary"
                aria-label={link.label}
              >
                {SOCIAL_ICONS[link.icon]}
              </a>
            );
          })}
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        className="absolute bottom-10 left-1/2 flex -translate-x-1/2 flex-col items-center gap-2"
        {...fadeIn(2.1)}
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
