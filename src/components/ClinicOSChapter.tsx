import AnimateOnScroll from "@/components/AnimateOnScroll";
import TypedText from "@/components/TypedText";
import { clinicosMetrics } from "@/data/content";

const features = [
  {
    title: "AI Medical Transcription",
    description:
      "Real-time AI-powered transcription of physician-patient conversations into structured medical documentation.",
  },
  {
    title: "Automated Documentation",
    description:
      "Intelligent document generation that reduces administrative burden and lets physicians focus on patients.",
  },
  {
    title: "Patient Management",
    description:
      "Comprehensive patient information system with seamless workflow integration.",
  },
  {
    title: "GOA Billing & GDPR",
    description:
      "Automated billing code suggestions with full GDPR-compliant data handling on German cloud infrastructure.",
  },
];

const techTags = [
  "Frontend Development",
  "Test Automation",
  "E2E Testing",
  "CI/CD",
  "GDPR Compliance",
  "Healthcare AI",
  "Quality Assurance",
];

export default function ClinicOSChapter() {
  return (
    <section id="clinicos" className="py-32 px-6 bg-background" style={{ scrollMarginTop: "6.5rem" }}>
      <div className="max-w-5xl mx-auto">
        <AnimateOnScroll delay={0}>
          <p className="font-mono text-sm text-syntax-comment tracking-widest mb-4">
            {"// 02"}
          </p>
        </AnimateOnScroll>
        <h2 className="text-5xl md:text-6xl font-bold tracking-tight mb-4">
          <TypedText text="Building ClinicOS" delay={0.15} speed={30} />
        </h2>
        <AnimateOnScroll delay={0.8}>
          <p className="text-xl text-muted-foreground mb-12">
            Germany&apos;s first AI-integrated physician information system
          </p>
        </AnimateOnScroll>

        <AnimateOnScroll delay={0.1}>
          <div className="max-w-3xl space-y-4 text-lg leading-relaxed text-muted-foreground">
            <p>
              I joined NoscAI GmbH as one of the first 4 team members. For
              the first 2 years I worked part-time on the frontend, then
              moved to full-time QA where I set up most of the test
              automation infrastructure.
            </p>
            <p>
              ClinicOS handles AI-powered medical transcription and patient
              management. In healthcare software, test coverage isn&apos;t
              a nice-to-have — it&apos;s a requirement.
            </p>
          </div>
        </AnimateOnScroll>

        <AnimateOnScroll delay={0.2}>
          <div className="mt-16 rounded-2xl bg-card border border-border p-4 md:p-6">
            <div className="rounded-lg overflow-hidden border border-border">
              <img
                src="/clinicos-dashboard.webp"
                alt="ClinicOS Dashboard — AI-integrated physician information system"
                className="w-full h-auto"
                loading="lazy"
              />
            </div>
          </div>
        </AnimateOnScroll>

        <div className="mt-16 grid grid-cols-1 md:grid-cols-2 gap-4">
          {features.map((feature, i) => (
            <AnimateOnScroll key={feature.title} delay={0.3 + i * 0.1}>
              <div className="rounded-xl bg-card border border-border p-6">
                <h3 className="text-foreground font-semibold mb-2">
                  {feature.title}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {feature.description}
                </p>
              </div>
            </AnimateOnScroll>
          ))}
        </div>

        <AnimateOnScroll delay={0.7}>
          <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-6">
            {clinicosMetrics.map((metric) => (
              <div key={metric.label} className="text-center">
                <p className="text-2xl md:text-3xl font-bold text-primary">
                  {metric.value}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {metric.label}
                </p>
              </div>
            ))}
          </div>
        </AnimateOnScroll>

        <AnimateOnScroll delay={0.8}>
          <div className="mt-12 rounded-xl border border-accent/30 bg-accent/5 p-6 text-center">
            <p className="text-accent font-medium">
              Double winner at AI.SUMMIT 2024 — jury award + audience award
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              1st place AI Startup Hub Hamburg Accelerator
            </p>
          </div>
        </AnimateOnScroll>

        <AnimateOnScroll delay={0.9}>
          <div className="mt-8 flex flex-wrap gap-2 justify-center">
            {techTags.map((tag) => (
              <span
                key={tag}
                className="text-sm font-mono bg-muted text-muted-foreground rounded-full px-3 py-1"
              >
                {tag}
              </span>
            ))}
          </div>
        </AnimateOnScroll>
      </div>
    </section>
  );
}
