import AnimateOnScroll from "@/components/AnimateOnScroll";
import TypedText from "@/components/TypedText";

export default function BeginningChapter() {
  return (
    <section id="beginning" className="py-32 px-6 bg-background" style={{ scrollMarginTop: "6.5rem" }}>
      <div className="max-w-3xl mx-auto">
        <AnimateOnScroll delay={0}>
          <p className="font-mono text-sm text-syntax-comment tracking-widest mb-4">
            {"// 01"}
          </p>
        </AnimateOnScroll>

        <h2 className="text-5xl md:text-6xl font-bold tracking-tight mb-12">
          <TypedText text="The Beginning" delay={0.2} speed={30} />
        </h2>

        <div className="space-y-6">
          <AnimateOnScroll delay={0.2}>
            <p className="text-lg leading-relaxed text-muted-foreground">
              I got into programming as a teenager and stuck with it. Started
              with web development — React, Vue.js — then moved into backend
              work with Node.js and Laravel.
            </p>
          </AnimateOnScroll>

          <AnimateOnScroll delay={0.3}>
            <p className="text-lg leading-relaxed text-muted-foreground">
              Each project taught me something about shipping software that
              people actually use. I learned to care about the details —
              not just making things work, but making them reliable.
            </p>
          </AnimateOnScroll>

          <AnimateOnScroll delay={0.4}>
            <p className="text-lg leading-relaxed text-muted-foreground">
              That path eventually led me from Indonesia to Hamburg, Germany,
              where I joined a healthcare AI startup as one of the first
              engineers.
            </p>
          </AnimateOnScroll>
        </div>

        <AnimateOnScroll delay={0.5}>
          <div className="w-16 h-px bg-border mx-auto mt-16" />
        </AnimateOnScroll>
      </div>
    </section>
  );
}
