import { projects } from "@/data/content";
import AnimateOnScroll from "@/components/AnimateOnScroll";
import TypedText from "@/components/TypedText";

const statusStyles: Record<string, string> = {
  live: "bg-green-500/10 text-green-400 border border-green-500/20",
  "coming-soon": "bg-primary/10 text-primary border border-primary/20",
  archived: "bg-muted text-muted-foreground border border-border",
};

const statusLabels: Record<string, string> = {
  live: "Live",
  "coming-soon": "Coming Soon",
  archived: "Archived",
};

export default function ProjectsChapter() {
  return (
    <section
      id="projects"
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
          <TypedText text="Projects" delay={0.15} speed={30} />
        </h2>

        <AnimateOnScroll delay={0.1}>
          <p className="text-muted-foreground mb-16">
            Side projects and things I&apos;m building
          </p>
        </AnimateOnScroll>

        <div className="space-y-6">
          {projects.map((project, index) => (
            <AnimateOnScroll key={project.title} delay={0.1 * index}>
              <div className="rounded-2xl bg-card border border-border p-6 md:p-8 transition-all duration-300 hover:border-primary/30">
                <div className="flex justify-between items-start">
                  <h3 className="text-xl font-bold">{project.title}</h3>
                  <span
                    className={`text-xs font-mono rounded-full px-3 py-1 ${statusStyles[project.status]}`}
                  >
                    {statusLabels[project.status]}
                  </span>
                </div>

                <p className="text-muted-foreground mt-3 leading-relaxed">
                  {project.description}
                </p>

                <div className="flex flex-wrap gap-2 mt-4">
                  {project.tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-xs font-mono bg-muted text-muted-foreground rounded-full px-3 py-1 hover:border-primary/50 hover:text-foreground transition-colors border border-transparent"
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                {(project.link || project.github) && (
                  <div className="flex gap-4 mt-4">
                    {project.github && (
                      <a
                        href={project.github}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm font-medium text-primary hover:text-primary/80 transition-colors"
                      >
                        {"Source \u2192"}
                      </a>
                    )}
                    {project.link && (
                      <a
                        href={project.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm font-medium text-primary hover:text-primary/80 transition-colors"
                      >
                        {"Visit \u2192"}
                      </a>
                    )}
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
