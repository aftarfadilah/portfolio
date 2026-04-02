"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { techStack } from "@/data/content";
import TypedText from "@/components/TypedText";

const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.05,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0 },
};

export default function StackChapter() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section id="stack" className="py-32 px-6 bg-background" style={{ scrollMarginTop: "6.5rem" }}>
      <div ref={ref} className="max-w-4xl mx-auto">
        <motion.p
          className="font-mono text-sm text-syntax-comment tracking-widest mb-4"
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.6 }}
        >
          {"// 04"}
        </motion.p>
        <h2 className="text-5xl md:text-6xl font-bold tracking-tight mb-16">
          <TypedText text="The Stack" delay={0.15} speed={30} />
        </h2>

        <div className="space-y-10">
          {techStack.map((category, categoryIndex) => (
            <motion.div
              key={category.name}
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
              transition={{ duration: 0.6, delay: 0.2 + categoryIndex * 0.1 }}
            >
              <h3 className="text-lg font-semibold text-foreground mb-4">
                {category.name}
              </h3>
              <motion.div
                className="flex flex-wrap gap-3"
                variants={containerVariants}
                initial="hidden"
                animate={isInView ? "visible" : "hidden"}
              >
                {category.items.map((item) => (
                  <motion.span
                    key={item}
                    variants={itemVariants}
                    className="px-4 py-2 rounded-xl bg-card border border-border text-sm font-mono text-muted-foreground hover:border-primary/50 hover:text-foreground transition-all duration-300"
                  >
                    {item}
                  </motion.span>
                ))}
              </motion.div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
