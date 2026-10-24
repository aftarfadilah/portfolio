export const navLinks = [
  { label: "Experience", href: "#experience" },
  { label: "Expertise", href: "#expertise" },
  { label: "Labs", href: "#labs" },
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
    company: "NoscAI",
    role: "QA Engineer",
    period: "Dec 2025 — Present",
    location: "Hamburg, Germany · Remote",
    description: "Full-time QA engineer responsible for end-to-end testing and test automation for ClinicOS — Germany's first AI-integrated physician information system.",
    highlights: [
      "End-to-end testing and test automation infrastructure",
      "AI-powered medical transcription, patient management, GOÄ billing",
      "GDPR-compliant healthcare cloud platform",
    ],
    tags: ["E2E Testing", "Test Automation", "Playwright", "Cypress", "CI/CD"],
  },
  {
    company: "Shiro Labs",
    role: "Founder",
    period: "Sep 2025 — Present",
    location: "Remote",
    description: "Designing and developing an AI platform that helps HR teams and companies screen candidates quickly and accurately — focused on efficient, human-centered technology.",
    highlights: [
      "Building Cariin — B2B hiring platform with AI skill matching from CVs",
      "Full-stack development with Laravel, TypeScript, PostgreSQL",
      "AI-powered candidate screening and matching",
    ],
    tags: ["Laravel", "TypeScript", "PostgreSQL", "AI", "B2B SaaS"],
  },
  {
    company: "Yayasan Pendidikan Bina Anak Indonesia Kompeten",
    role: "Laravel Developer (Intern)",
    period: "Feb 2025 — Aug 2025",
    location: "Surabaya, Indonesia · On-site",
    description: "Developed a digital platform supporting the education sector — helping Indonesian students access consultation services and overseas study registration.",
    highlights: [
      "Built education platform for overseas study consultation",
      "Full-stack development with Laravel",
    ],
    tags: ["Laravel", "Web Development", "PHP", "MySQL"],
  },
  {
    company: "NoscAI",
    role: "Frontend Developer",
    period: "Nov 2022 — Aug 2024",
    location: "Germany · Remote",
    description: "One of the first four people on the team. Part-time frontend developer building the ClinicOS dashboard that medical professionals and facility managers work in, with Next.js, React, TypeScript and Tailwind CSS. ClinicOS is Germany's first AI-integrated physician information system.",
    highlights: [
      "One of the first 4 team members",
      "Built the ClinicOS dashboard frontend with Next.js, React, TypeScript and Tailwind CSS",
      "Designed for medical staff and facility management",
    ],
    tags: ["Next.js", "React", "TypeScript", "Tailwind CSS", "Healthcare AI"],
    awards: [
      "AI.SUMMIT 2024 — Jury + Audience Award",
      "1st Place — AI Startup Hub Hamburg Accelerator",
    ],
  },
  {
    company: "Alamaya Online Indonesia",
    role: "Website Developer (Intern)",
    period: "Jul 2018 — Jun 2019",
    location: "Denpasar, Bali, Indonesia · On-site",
    description: "Implemented client designs into responsive, functional websites that met project standards.",
    highlights: [
      "Converted client designs to responsive websites",
      "WordPress development and customization",
    ],
    tags: ["WordPress", "Web Development", "HTML/CSS", "JavaScript"],
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

export interface LabStat {
  value: string;
  label: string;
}

export interface Lab {
  title: string;
  tagline: string;
  /** Route of the live piece. Omitted for work that is this page itself. */
  href?: string;
  tags: string[];
  problem: string;
  approach: string;
  decision: string;
  stats: LabStat[];
}

/**
 * Figures were counted from the code and data files, or measured on a
 * production build with Lighthouse 12 (simulated mobile / desktop presets) on
 * 2026-10-24. Re-measure before changing them.
 */
export const labs: Lab[] = [
  {
    title: "Karhutla",
    tagline: "A one-screen story built from real satellite detections",
    href: "/karhutla",
    tags: ["Canvas 2D", "Typed arrays", "NASA FIRMS", "EN · ID"],
    problem:
      "Show what a day of fire in Indonesia looks like on a single screen, with real data instead of an illustration.",
    approach:
      "Every glowing point is one VIIRS S-NPP detection. The points sit in flat typed arrays, glow sprites are rendered once and reused, and a scan line sweeps the map the way the satellite does. Hover or tap a point to read its brightness temperature, radiative power and confidence.",
    decision:
      "The data ships as a dated snapshot in static JSON, not a live FIRMS call. There is no API key, rate limit or loading failure to design around, at the cost of the page showing one day, labelled as such.",
    stats: [
      { value: "4,171", label: "real detections drawn" },
      { value: "105 KB", label: "data snapshot" },
      { value: "100 / 100", label: "Lighthouse performance / accessibility, desktop" },
    ],
  },
  {
    title: "Kanagawa",
    tagline: "The Great Wave, redrawn in animated glyphs",
    href: "/kanagawa",
    tags: ["WebGL", "GLSL", "Canvas fallback", "EN · ID · JA"],
    problem:
      "Turn one woodblock print into a full-screen, interactive piece that moves, without video and without thousands of DOM nodes.",
    approach:
      "The print is sampled into a grid of cells, each a 4×8 patch of pixels. Flat patches get a density glyph, detailed ones the glyph whose strokes match best, and colours snap to the nearest entry of a Kanagawa palette (20 colours at 6 brightnesses each). A fragment shader then draws the grid from a glyph atlas while the water flows, the foam glitters and the pointer acts as a lantern.",
    decision:
      "One full-screen triangle and one shader, not a text element per cell, so a frame costs a single draw call. The same grid is drawn once as a still 2D frame when WebGL is missing or the GPU context is lost, so the page, camera and wiki still work.",
    stats: [
      { value: "1", label: "draw call per frame" },
      { value: "120", label: "palette entries (20 colours × 6 brightnesses)" },
      { value: "3", label: "languages in the wiki" },
    ],
  },
  {
    title: "Turntable",
    tagline: "A 3D record player that plays YouTube links",
    href: "/player",
    tags: ["React Three Fiber", "Web Audio", "Next.js route handlers"],
    problem:
      "Make a music player feel like an object you operate, when the actual audio comes from a YouTube embed that can't be routed through Web Audio.",
    approach:
      "A react-three-fiber scene with a 33⅓ rpm platter, a tonearm whose angle is solved from the geometry so the stylus lands on the groove radius you want, and a rack of sleeves you flip through. Playlists import through small route handlers that proxy YouTube metadata and thumbnails.",
    decision:
      "Sound effects are synthesised, not sampled: the pops, surface hiss and motor hum come from Web Audio, so there is nothing to license or download. Three.js stays on this route; the home page loads no WebGL code.",
    stats: [
      { value: "0", label: "audio files shipped" },
      { value: "460 KB", label: "JS, loaded only on /player" },
      { value: "237 KB", label: "JS for the whole home page" },
    ],
  },
  {
    title: "ASCII water hero",
    tagline: "The first screen of this page",
    tags: ["Canvas 2D", "Water simulation", "Reduced motion"],
    problem:
      "Make the first screen memorable without hiding the name, role and links behind an animation.",
    approach:
      "A canvas draws a loading intro that decodes into the name and links, then a ripple simulation runs underneath so the text floats on moving water. The same copy is in the DOM for screen readers, and the canvas itself is hidden from them.",
    decision:
      "The field is drawn on the CPU, so it stops while it is off screen, is capped at 30 fps on touch devices, and renders one still frame when the visitor prefers reduced motion.",
    stats: [
      { value: "100", label: "Lighthouse performance, desktop" },
      { value: "96–97", label: "Lighthouse performance, mobile (3 runs)" },
      { value: "100", label: "Lighthouse accessibility" },
    ],
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
  experience: "Aftar started as a frontend developer at NoscAI (Nov 2022), building the ClinicOS UI part-time for almost 2 years. After a career break to finish his degree, he returned full-time as QA engineer (Dec 2025). He also interned as a Laravel developer and founded Shiro Labs.",
  clinicos: "ClinicOS is Germany's first AI-integrated physician information system. Aftar built the frontend (2022-2024) and now handles QA and test automation. It won the AI.SUMMIT 2024 jury + audience award and placed #1 at AI Startup Hub Hamburg.",
  skills: "Aftar works across the stack: React/Next.js/Vue.js on frontend, Node.js/Laravel on backend, Playwright/Cypress for testing, and Claude API/LangChain for AI integration.",
  stack: "Frontend: React, Next.js, Vue.js, TypeScript, Tailwind CSS. Backend: Node.js, Laravel, PostgreSQL, Prisma. Testing: Playwright, Cypress, Jest. AI: Claude API, LangChain, NLP.",
  projects: "Currently building Cariin — a B2B hiring platform with AI skill matching. Also built this IDE-themed portfolio you're looking at right now.",
  cariin: "Cariin is a B2B hiring management platform. Upload CVs and let AI match candidates to roles based on skills, experience, and fit. Built with Next.js, Prisma, PostgreSQL, and Claude API. Coming soon.",
  shiro: "Shiro Labs is Aftar's company (founded Sep 2025) focused on AI-powered HR tools. Currently building Cariin — a B2B hiring platform with AI skill matching.",
  contact: "You can reach Aftar at me@aftarfadilah.com, on GitHub (github.com/aftarfadilah), or LinkedIn (linkedin.com/in/aftarfadilah).",
  hire: "Aftar is open to interesting opportunities and collaborations. Reach out at me@aftarfadilah.com or connect on LinkedIn.",
  location: "Aftar is based in Indonesia. Previously worked in Hamburg, Germany at NoscAI GmbH.",
};

export const ideSections = [
  { id: "hero", file: "hero.tsx", label: "hero", icon: "tsx" as const },
  { id: "experience", file: "experience.tsx", label: "experience", icon: "tsx" as const },
  { id: "expertise", file: "expertise.tsx", label: "expertise", icon: "tsx" as const },
  { id: "labs", file: "labs.tsx", label: "labs", icon: "tsx" as const },
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
    href: "mailto:me@aftarfadilah.com",
    icon: "email" as const,
  },
];
