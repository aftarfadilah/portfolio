"use client";

import { expertiseAreas } from "@/data/content";
import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import TypedText from "@/components/TypedText";
import AnimateOnScroll from "@/components/AnimateOnScroll";

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.03 } },
};

const badgeVariants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: { opacity: 1, scale: 1 },
};

export default function ExpertiseChapter() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section
      id="expertise"
      style={{ scrollMarginTop: "6.5rem" }}
      className="py-32 px-6 bg-background"
    >
      <div ref={ref} className="max-w-4xl mx-auto">
        <AnimateOnScroll>
          <p className="font-mono text-sm text-syntax-comment tracking-widest mb-4">
            {"// 02"}
          </p>
        </AnimateOnScroll>

        <h2 className="text-5xl md:text-6xl font-bold tracking-tight mb-16">
          <TypedText text="Expertise" delay={0.15} speed={30} />
        </h2>

        <div className="space-y-14">
          {expertiseAreas.map((area, areaIndex) => (
            <motion.div
              key={area.title}
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.15 * areaIndex }}
            >
              <div className="flex flex-col md:flex-row md:items-baseline gap-4 md:gap-8 mb-4">
                <h3 className="text-xl font-semibold shrink-0 md:w-52">{area.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{area.description}</p>
              </div>
              <motion.div
                className="flex flex-wrap gap-2 md:ml-[calc(13rem+2rem)]"
                variants={containerVariants}
                initial="hidden"
                animate={isInView ? "visible" : "hidden"}
              >
                {area.skills.map((skill) => (
                  <motion.span
                    key={skill}
                    variants={badgeVariants}
                    className="px-4 py-2 rounded-xl bg-card border border-border text-sm font-mono text-muted-foreground hover:border-primary/50 hover:text-foreground transition-all duration-300 cursor-default"
                  >
                    {skill}
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
