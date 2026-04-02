export const navLinks = [
  { label: "Story", href: "#beginning" },
  { label: "ClinicOS", href: "#clinicos" },
  { label: "Now", href: "#now" },
  { label: "Stack", href: "#stack" },
  { label: "Contact", href: "#contact" },
] as const;

export interface TechCategory {
  name: string;
  items: string[];
}

export const techStack: TechCategory[] = [
  { name: "Frontend", items: ["React", "Next.js", "Vue.js", "TypeScript", "Tailwind CSS"] },
  { name: "Backend", items: ["Node.js", "Laravel", "PostgreSQL", "Prisma"] },
  { name: "Testing", items: ["Playwright", "Cypress", "Jest", "Testing Library"] },
  { name: "DevOps", items: ["GitHub Actions", "Docker", "CI/CD", "Vercel"] },
  { name: "AI", items: ["Claude API", "NLP", "ML Pipelines", "LangChain"] },
];

export const clinicosMetrics = [
  { value: "4", label: "Core founding team members" },
  { value: "90%", label: "Test automation infrastructure built" },
  { value: "AI.SUMMIT", label: "Double winner — jury + audience award 2024" },
  { value: "#1", label: "AI Startup Hub Hamburg Accelerator" },
];

export const ideSections = [
  { id: "hero", file: "hero.tsx", label: "hero", icon: "tsx" as const },
  { id: "beginning", file: "beginning.tsx", label: "beginning", icon: "tsx" as const },
  { id: "clinicos", file: "clinicos.tsx", label: "clinicos", icon: "tsx" as const },
  { id: "now", file: "shirolabs.tsx", label: "shirolabs", icon: "tsx" as const },
  { id: "stack", file: "stack.json", label: "stack", icon: "json" as const },
  { id: "contact", file: "contact.md", label: "contact", icon: "md" as const },
] as const;

export const socialLinks = [
  {
    label: "GitHub",
    href: "https://github.com/aftarfadilah",
    icon: "github" as const,
  },
  {
    label: "LinkedIn",
    href: "https://linkedin.com/in/aftarfadilah",
    icon: "linkedin" as const,
  },
  {
    label: "Email",
    href: "mailto:aftarfadilah@gmail.com",
    icon: "email" as const,
  },
];
