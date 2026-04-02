export const navLinks = [
  { label: "Experience", href: "#experience" },
  { label: "Expertise", href: "#expertise" },
  { label: "Projects", href: "#projects" },
  { label: "Chat", href: "#chat" },
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

export interface Experience {
  company: string;
  role: string;
  period: string;
  location: string;
  description: string;
  highlights: string[];
  tags: string[];
  awards?: string[];
  image?: string;
}

export const experiences: Experience[] = [
  {
    company: "NoscAI GmbH",
    role: "Frontend Engineer → QA Engineer",
    period: "2022 — 2024",
    location: "Hamburg, Germany",
    description: "One of the first 4 team members. Started part-time building the ClinicOS frontend for 2 years, then moved to full-time QA and set up most of the test automation infrastructure.",
    highlights: [
      "Built the frontend for ClinicOS — Germany's first AI-integrated physician information system",
      "Set up 90% of the test automation infrastructure",
      "AI-powered medical transcription, patient management, GOÄ billing",
      "GDPR-compliant cloud platform for healthcare",
    ],
    tags: ["React", "TypeScript", "Playwright", "Cypress", "CI/CD", "Healthcare AI"],
    awards: [
      "AI.SUMMIT 2024 — Jury + Audience Award",
      "1st Place — AI Startup Hub Hamburg Accelerator",
    ],
    image: "/clinicos-dashboard.webp",
  },
  {
    company: "Shiro Labs",
    role: "Founder",
    period: "2024 — Present",
    location: "Indonesia",
    description: "Building AI-powered B2B tools. Applying what I learned in healthcare software to new problem spaces.",
    highlights: [
      "Building Cariin — B2B hiring platform with AI skill matching from CVs",
      "Full-stack development with Next.js, TypeScript, Prisma, PostgreSQL",
      "Integrating Claude API for intelligent document processing",
    ],
    tags: ["Next.js", "TypeScript", "Prisma", "PostgreSQL", "Claude API"],
  },
];

export interface ExpertiseArea {
  title: string;
  description: string;
  skills: string[];
}

export const expertiseAreas: ExpertiseArea[] = [
  {
    title: "Frontend Development",
    description: "Building responsive, accessible interfaces with modern frameworks and component-driven architecture.",
    skills: ["React", "Next.js", "Vue.js", "TypeScript", "Tailwind CSS"],
  },
  {
    title: "Test Automation & QA",
    description: "Designing test infrastructure for critical systems where reliability matters — from E2E to integration testing.",
    skills: ["Playwright", "Cypress", "Jest", "Testing Library", "CI/CD"],
  },
  {
    title: "AI Integration",
    description: "Connecting AI capabilities into products — from LLM APIs to NLP pipelines and intelligent document processing.",
    skills: ["Claude API", "LangChain", "NLP", "ML Pipelines", "RAG"],
  },
  {
    title: "Backend & Infrastructure",
    description: "Server-side development, database design, and deployment pipelines.",
    skills: ["Node.js", "Laravel", "PostgreSQL", "Prisma", "Docker", "Vercel"],
  },
];

export interface Project {
  title: string;
  description: string;
  tags: string[];
  status: "live" | "coming-soon" | "archived";
  link?: string;
  github?: string;
}

export const projects: Project[] = [
  {
    title: "Cariin",
    description: "B2B hiring management platform with AI-powered skill matching. Upload CVs and let AI match candidates to roles.",
    tags: ["Next.js", "TypeScript", "Prisma", "PostgreSQL", "Claude API"],
    status: "coming-soon",
  },
  {
    title: "This Portfolio",
    description: "IDE-themed portfolio with source code view toggle, parallax floating code, and easter eggs. Built with Next.js 16 and Framer Motion.",
    tags: ["Next.js", "React 19", "Tailwind CSS 4", "Framer Motion"],
    status: "live",
    github: "https://github.com/aftarfadilah/portfolio",
  },
];

export const chatResponses: Record<string, string> = {
  hi: "Hey! I'm Aftar's AI assistant. Ask me about his experience, skills, or projects.",
  hello: "Hey! I'm Aftar's AI assistant. Ask me about his experience, skills, or projects.",
  experience: "Aftar was one of the first 4 team members at NoscAI GmbH in Hamburg, where he built the ClinicOS frontend and later set up 90% of the test automation. He's now running Shiro Labs, building AI-powered B2B tools.",
  clinicos: "ClinicOS is Germany's first AI-integrated physician information system. Aftar helped build the frontend and test automation. It won the AI.SUMMIT 2024 jury + audience award and placed #1 at AI Startup Hub Hamburg.",
  skills: "Aftar works across the stack: React/Next.js/Vue.js on frontend, Node.js/Laravel on backend, Playwright/Cypress for testing, and Claude API/LangChain for AI integration.",
  stack: "Frontend: React, Next.js, Vue.js, TypeScript, Tailwind CSS. Backend: Node.js, Laravel, PostgreSQL, Prisma. Testing: Playwright, Cypress, Jest. AI: Claude API, LangChain, NLP.",
  projects: "Currently building Cariin — a B2B hiring platform with AI skill matching. Also built this IDE-themed portfolio you're looking at right now.",
  cariin: "Cariin is a B2B hiring management platform. Upload CVs and let AI match candidates to roles based on skills, experience, and fit. Built with Next.js, Prisma, PostgreSQL, and Claude API. Coming soon.",
  shiro: "Shiro Labs is Aftar's company focused on building AI-powered B2B products. Currently working on Cariin.",
  contact: "You can reach Aftar at aftarfadilah@gmail.com, on GitHub (github.com/aftarfadilah), or LinkedIn (linkedin.com/in/aftarfadilah).",
  hire: "Aftar is open to interesting opportunities and collaborations. Reach out at aftarfadilah@gmail.com or connect on LinkedIn.",
  location: "Aftar is based in Indonesia. Previously worked in Hamburg, Germany at NoscAI GmbH.",
};

export const ideSections = [
  { id: "hero", file: "hero.tsx", label: "hero", icon: "tsx" as const },
  { id: "experience", file: "experience.tsx", label: "experience", icon: "tsx" as const },
  { id: "expertise", file: "expertise.tsx", label: "expertise", icon: "tsx" as const },
  { id: "projects", file: "projects.tsx", label: "projects", icon: "tsx" as const },
  { id: "chat", file: "chat.tsx", label: "chat", icon: "tsx" as const },
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
