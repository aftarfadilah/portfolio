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

        <div className="flex flex-col gap-10 border-l border-border pl-8">
          {experiences.map((exp, i) => (
            <AnimateOnScroll key={`${exp.company}-${exp.role}`} delay={0.08 * (i + 1)}>
              <div className="relative">
                <span className="absolute -left-[2.3rem] top-1.5 h-2.5 w-2.5 rounded-full border-2 border-primary bg-background" />
                <p className="font-mono text-xs text-muted-foreground">{exp.period}</p>
                <h3 className="mt-1 text-lg font-semibold">{exp.role}</h3>
                <p className="text-sm text-muted-foreground">{exp.company} · {exp.location}</p>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground/80">{exp.description}</p>
                {exp.awards && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {exp.awards.map((award) => (
                      <span key={award} className="text-xs text-accent font-medium">{award}</span>
                    ))}
                  </div>
                )}
              </div>
            </AnimateOnScroll>
          ))}
        </div>
      </div>
    </section>
  );
}
