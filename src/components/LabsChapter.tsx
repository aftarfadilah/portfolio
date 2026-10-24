import Link from "next/link";
import { labs } from "@/data/content";
import AnimateOnScroll from "@/components/AnimateOnScroll";
import TypedText from "@/components/TypedText";

const parts = [
  { key: "problem", label: "Problem" },
  { key: "approach", label: "Approach" },
  { key: "decision", label: "Decision" },
] as const;

export default function LabsChapter() {
  return (
    <section
      id="labs"
      style={{ scrollMarginTop: "6.5rem" }}
      className="py-32 px-6 bg-background"
    >
      <div className="max-w-4xl mx-auto">
        <AnimateOnScroll>
          <p className="font-mono text-sm text-syntax-comment tracking-widest mb-4">
            {"// 03"}
          </p>
        </AnimateOnScroll>

        <h2 className="text-5xl md:text-6xl font-bold tracking-tight mb-4">
          <TypedText text="Labs" delay={0.15} speed={30} />
        </h2>

        <AnimateOnScroll delay={0.1}>
          <p className="text-muted-foreground mb-16">
            Frontend work I built for its own sake, with the problem, the
            approach and the trade-off I made
          </p>
        </AnimateOnScroll>

        <div className="space-y-6">
          {labs.map((lab, index) => (
            <AnimateOnScroll key={lab.title} delay={0.1 * index}>
              <article className="rounded-2xl bg-card border border-border p-6 md:p-8 transition-all duration-300 hover:border-primary/30">
                <div className="flex flex-wrap justify-between items-start gap-x-4 gap-y-1">
                  <h3 className="text-xl font-bold">{lab.title}</h3>
                  {lab.href && (
                    <Link
                      href={lab.href}
                      className="text-sm font-medium text-primary hover:text-primary/80 transition-colors"
                    >
                      {"Open it →"}
                    </Link>
                  )}
                </div>
                <p className="text-muted-foreground mt-1">{lab.tagline}</p>

                <dl className="mt-6 space-y-4">
                  {parts.map(({ key, label }) => (
                    <div
                      key={key}
                      className="md:grid md:grid-cols-[6.5rem_1fr] md:gap-4"
                    >
                      <dt className="font-mono text-xs uppercase tracking-widest text-syntax-comment pt-1">
                        {label}
                      </dt>
                      <dd className="leading-relaxed text-foreground/90">
                        {lab[key]}
                      </dd>
                    </div>
                  ))}
                </dl>

                <ul className="mt-6 grid gap-4 sm:grid-cols-3 border-t border-border pt-5">
                  {lab.stats.map((stat) => (
                    <li key={stat.label}>
                      <p className="font-mono text-2xl font-bold text-primary">
                        {stat.value}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {stat.label}
                      </p>
                    </li>
                  ))}
                </ul>

                <div className="flex flex-wrap gap-2 mt-5">
                  {lab.tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-xs font-mono bg-muted text-muted-foreground rounded-full px-3 py-1"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </article>
            </AnimateOnScroll>
          ))}
        </div>
      </div>
    </section>
  );
}
