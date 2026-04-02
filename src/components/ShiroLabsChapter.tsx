import AnimateOnScroll from "@/components/AnimateOnScroll";
import TypedText from "@/components/TypedText";

const CARIIN_TAGS = ["Next.js", "TypeScript", "Prisma", "PostgreSQL", "Claude API"];

export default function ShiroLabsChapter() {
  return (
    <section id="now" className="py-32 px-6 bg-background" style={{ scrollMarginTop: "6.5rem" }}>
      <div className="max-w-4xl mx-auto">
        <AnimateOnScroll>
          <p className="font-mono text-sm text-syntax-comment tracking-widest mb-4">{"// 03"}</p>
        </AnimateOnScroll>
        <h2 className="text-5xl md:text-6xl font-bold tracking-tight mb-4">
          <TypedText text="What I'm Building Now" delay={0.15} speed={30} />
        </h2>
        <AnimateOnScroll delay={0.8}>
          <p className="text-xl text-muted-foreground mb-16">
            From ensuring quality to building products
          </p>
        </AnimateOnScroll>

        <AnimateOnScroll delay={0.15}>
          <div className="flex flex-col md:flex-row items-start md:items-center gap-8 md:gap-4">
            <span className="text-sm font-mono text-muted-foreground text-center">
              QA Engineer
            </span>

            <span className="hidden md:block w-12 h-px bg-border" />
            <span className="md:hidden block w-px h-8 bg-border mx-auto" />

            <span className="text-sm font-mono text-muted-foreground text-center">
              Product Builder
            </span>

            <span className="hidden md:block w-12 h-px bg-border" />
            <span className="md:hidden block w-px h-8 bg-border mx-auto" />

            <span className="text-sm font-mono text-primary font-semibold text-center">
              Founder
            </span>
          </div>
        </AnimateOnScroll>

        <AnimateOnScroll delay={0.3}>
          <div className="mt-16 rounded-2xl bg-card border border-border p-8 md:p-12">
            <h3 className="text-3xl font-bold mb-4">Shiro Labs</h3>
            <p className="text-lg text-muted-foreground">
              A small studio building AI-powered B2B tools. Applying what I
              learned in healthcare software to new problem spaces.
            </p>

            <div className="h-px bg-border my-8" />

            <div className="rounded-xl bg-muted/50 border border-border p-6 md:p-8 mt-8">
              <span className="inline-block text-xs font-mono bg-primary/10 text-primary border border-primary/20 rounded-full px-3 py-1 mb-4">
                Coming Soon
              </span>
              <h4 className="text-2xl font-bold mb-3">Cariin</h4>
              <p className="text-muted-foreground">
                B2B hiring management platform with AI-powered skill matching.
                Upload CVs, and let AI match candidates to roles based on skills,
                experience, and cultural fit.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {CARIIN_TAGS.map((tag) => (
                  <span
                    key={tag}
                    className="text-sm font-mono bg-muted text-muted-foreground rounded-full px-3 py-1"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </AnimateOnScroll>
      </div>
    </section>
  );
}
