import { experiences, socialLinks } from "@/data/content";

/** Copy and data for /casefile. Facts come from content.ts; the voice is the story. */

export const gate = {
  title: "your page is rendering",
  lines: [
    "booting renderer…",
    "loading typefaces ......... ok",
    "hydrating components ...... ok",
    "compiling shaders ......... ok",
    "easing curves ............. ok",
    "painting the first frame …",
    "ready to be looked at",
  ],
  skip: "press any key to skip",
};

/** Three-beat opener. Keep the first line short: it has to fit one row at hero size. */
export const opener = {
  a: "pixel perfect in figma",
  b: "who made it real?",
  c: "he did",
};

export const roles = ["Frontend Developer", "Web Designer", "Creative Developer", "UI Engineer", "Founder"];

export const hud = {
  file: "~/portfolio/casefile.tsx",
  status: "main · 0 errors · clean",
  alerts: ["layout shift detected", "i am watching your padding", "//", "ship it. or don't."],
};

/** The instrument panel around the figure. Coordinates are Surabaya, where the work started. */
export const panel = {
  shift: ["shift detected", "sorry"],
  watch: ["i watch your padding", "ship it"],
  rows: [
    ["build", "00947"],
    ["warning", "none"],
  ],
  year: "2026",
  state: "in production",
  lat: "7.2575° S",
  lon: "112.7521° E",
  tz: "Asia/Jakarta",
  tzLabel: "GMT+7",
};

export const nav = [
  { id: "index", label: "index" },
  { id: "scan", label: "scan" },
  { id: "case", label: "case" },
  { id: "exhibit", label: "exhibit" },
  { id: "ledger", label: "ledger" },
] as const;

/** One string per line of the story. Short on purpose: they wrap around the figure. */
export const narrative = {
  heading: "CASE FILE: THE BUILDER BEHIND THE INTERFACE",
  lines: [
    "The first mistake was calling Aftar a coder.",
    "He wasn't.",
    "He looked at a button and saw a decision.",
    "The radius. The shadow. The second it takes to answer.",
    "Every one of them was a choice.",
    "Most people never notice a good one.",
    "That was the point.",
    "He was never interested in decoration.",
    "Decoration is what you add when you cannot decide.",
    "A typeface is a tone of voice.",
    "A transition is a sentence. It can be kind or rude.",
    "Spacing is the part people feel and cannot name.",
    "He could name it.",
    "It started in Denpasar, Bali.",
    "A WordPress internship. A design comes in.",
    "A working website goes out.",
    "All the real work lives in between.",
    "The browser doesn't care about the mockup.",
    "It renders what you wrote. Nothing more.",
    "He respected that.",
    "He learned where a layout breaks.",
    "Then he learned why.",
    "Then Hamburg, from a distance.",
    "One of the first four on a team building ClinicOS,",
    "Germany's first AI-integrated physician system.",
    "The team was small. The ambition was not.",
    "His job was the screen the doctors would live in.",
    "Next.js. React. TypeScript. Tailwind.",
    "Dense data. Tired eyes. No room for decoration.",
    "Medical software is not forgiving.",
    "Small buttons cost minutes. Minutes cost attention.",
    "So the buttons got bigger. The noise got quieter.",
    "He made it calm.",
    "That is harder than making it loud.",
    "A jury and an audience agreed.",
    "He had a problem with interfaces that almost worked.",
    "Almost clear. Almost fast. Almost finished.",
    "Those are the ones that survive,",
    "because nobody can justify killing them.",
    "He can.",
    "Once he sees the misaligned pixel, it cannot be unseen.",
    "Somebody has to fix it.",
    "Usually him.",
    "After hours he kept building things nobody asked for.",
    "None of it was a client brief.",
    "All of it was practice.",
    "A turntable that spins in three dimensions.",
    "A record that crackles when you scratch it.",
    "A great wave redrawn in ASCII.",
    "Smoke you push aside with a cursor.",
    "Satellite fires, plotted from real data.",
    "Practice is how a hand learns what the eye already knows.",
    "He builds the toy to learn the tool.",
    "The detail nobody asked for.",
    "That is where he lives.",
    "These days he also breaks interfaces for a living.",
    "He has watched every way a screen can fail.",
    "He builds with that in mind.",
    "In his own time he founded Shiro Labs.",
    "Its first product, Cariin, helps hiring teams read CVs.",
    "Hiring is noisy. The screen should not be.",
    "He designed the interface and wrote the code.",
    "The machine does the reading. The humans decide.",
    "He keeps asking why one spacing feels alive,",
    "and another, nearly identical, feels dead.",
    "He asks. Then he ships.",
    "There is no manifesto.",
    "Just an unreasonable amount of care",
    "for the last eight pixels.",
    "He doesn't build interfaces to be admired.",
    "He builds them so you never have to think about them.",
    "Unless you look closer.",
  ],
};

export const exhibit = {
  kicker: "exhibit a",
  title: "clinicos, under the lens",
  hint: "move your cursor over the screen",
  hintTouch: "drag a finger over the screen",
  alt: "The ClinicOS physician dashboard, built at NoscAI.",
  /** Illustrative design notes. Positions are % of the image. */
  marks: [
    { x: 14, y: 22, w: 24, h: 16, label: "8px grid" },
    { x: 46, y: 18, w: 22, h: 20, label: "density, not noise" },
    { x: 70, y: 52, w: 22, h: 18, label: "colour = status" },
    { x: 20, y: 62, w: 26, h: 20, label: "calm hierarchy" },
    { x: 50, y: 64, w: 16, h: 14, label: "focus ring" },
  ],
};

/** Design and frontend work first; QA is still on the record, just not the headline. */
const weight = (role: string) =>
  /founder/i.test(role) ? 0 : /frontend/i.test(role) ? 1 : /website/i.test(role) ? 2 : /qa/i.test(role) ? 3 : 4;

const short: Record<string, string> = {
  "Yayasan Pendidikan Bina Anak Indonesia Kompeten": "Bina Anak Indonesia",
  "Alamaya Online Indonesia": "Alamaya Online",
};

const yearOf = (period: string) => {
  const [from, to] = period.split("—").map((s) => s.trim());
  const y = (s: string) => s.match(/\d{4}/)?.[0] ?? s;
  if (to === "Present") return `${y(from)}–now`;
  return y(from) === y(to) ? y(from) : `${y(from)}–${y(to)}`;
};

export interface LedgerGroup {
  who: string;
  role: string;
  rows: { text: string; value: string }[];
}

export const ledger: LedgerGroup[] = [...experiences]
  .sort((a, b) => weight(a.role) - weight(b.role))
  .map((e) => ({
    who: short[e.company] ?? e.company,
    role: e.role,
    rows: [
      ...(e.awards ?? []).map((a) => ({ text: a, value: "x1" })),
      ...e.highlights.map((h) => ({ text: h, value: yearOf(e.period) })),
    ],
  }));

export const closer = {
  kicker: "case status",
  title: "open",
  body: "Looking for the next screen worth obsessing over.",
  cta: "say hello",
  email: "me@aftarfadilah.com",
  href: "mailto:me@aftarfadilah.com",
  links: socialLinks.filter((l) => l.icon !== "email"),
  back: "← back to the IDE",
};
