import { experiences } from "@/data/content";
import AnimateOnScroll from "@/components/AnimateOnScroll";
import TypedText from "@/components/TypedText";

export default function ExperienceChapter() {
  return (
    <section
      id="experience"
      className="bg-background px-6 py-32"
      style={{ scrollMarginTop: "6.5rem" }}
    >
      <div className="mx-auto max-w-4xl">
        <AnimateOnScroll>
          <p className="mb-4 font-mono text-sm tracking-widest text-syntax-comment">
            {"// 01"}
          </p>
        </AnimateOnScroll>

        <h2 className="mb-16 text-5xl font-bold tracking-tight md:text-6xl">
          <TypedText text="Experience" delay={0.15} speed={30} />
        </h2>

        <div className="space-y-12">
          {experiences.map((exp, i) => (
            <AnimateOnScroll key={exp.company} delay={0.1 * (i + 1)}>
              <div className="rounded-2xl border border-border bg-card p-6 transition-all duration-300 hover:border-primary/30 md:p-8">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-2xl font-bold">{exp.company}</h3>
                    <p className="mt-1 text-muted-foreground">{exp.role}</p>
                    <p className="mt-2 font-mono text-sm text-muted-foreground">
                      {exp.period} &middot; {exp.location}
                    </p>
                  </div>
                  <span className="hidden rounded-full bg-muted px-3 py-1 font-mono text-xs text-muted-foreground md:inline-block">
                    {exp.period}
                  </span>
                </div>

                <p className="mt-4 leading-relaxed text-muted-foreground">
                  {exp.description}
                </p>

                {exp.image && (
                  <img
                    src={exp.image}
                    alt={exp.company}
                    className="mt-6 w-full rounded-lg border border-border"
                    loading="lazy"
                  />
                )}

                <ul className="mt-4 space-y-2">
                  {exp.highlights.map((highlight) => (
                    <li key={highlight} className="flex items-start gap-2">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                      <span className="text-sm text-muted-foreground">
                        {highlight}
                      </span>
                    </li>
                  ))}
                </ul>

                {exp.awards && exp.awards.length > 0 && (
                  <div className="mt-4 space-y-2">
                    {exp.awards.map((award) => (
                      <div
                        key={award}
                        className="rounded-lg border border-accent/30 bg-accent/5 px-4 py-2 text-sm font-medium text-accent"
                      >
                        {award}
                      </div>
                    ))}
                  </div>
                )}

                <div className="mt-4 flex flex-wrap gap-2">
                  {exp.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full bg-muted px-3 py-1 font-mono text-xs text-muted-foreground"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </AnimateOnScroll>
          ))}
        </div>
      </div>
    </section>
  );
}
