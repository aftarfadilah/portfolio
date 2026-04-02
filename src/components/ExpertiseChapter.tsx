import { expertiseAreas } from "@/data/content";
import AnimateOnScroll from "@/components/AnimateOnScroll";
import TypedText from "@/components/TypedText";

export default function ExpertiseChapter() {
  return (
    <section
      id="expertise"
      style={{ scrollMarginTop: "6.5rem" }}
      className="py-32 px-6 bg-background"
    >
      <div className="max-w-5xl mx-auto">
        <AnimateOnScroll>
          <p className="font-mono text-sm text-syntax-comment tracking-widest mb-4">
            {"// 02"}
          </p>
        </AnimateOnScroll>

        <h2 className="text-5xl md:text-6xl font-bold tracking-tight mb-16">
          <TypedText text="Expertise" delay={0.15} speed={30} />
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {expertiseAreas.map((area, index) => (
            <AnimateOnScroll key={area.title} delay={0.1 * index}>
              <div className="rounded-2xl bg-card border border-border p-6 md:p-8 transition-all duration-300 hover:border-primary/30 hover:scale-[1.02]">
                <h3 className="text-xl font-bold mb-2">{area.title}</h3>
                <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
                  {area.description}
                </p>
                <div className="flex flex-wrap gap-2">
                  {area.skills.map((skill) => (
                    <span
                      key={skill}
                      className="text-xs font-mono bg-muted text-muted-foreground rounded-full px-3 py-1 hover:border-primary/50 hover:text-foreground transition-colors border border-transparent"
                    >
                      {skill}
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
