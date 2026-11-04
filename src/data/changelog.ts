import { experiences, socialLinks } from "@/data/content";

/** Copy and data for /changelog. Facts come from content.ts; the voice is the story. */

export const gate = {
  title: "starting dev server",
  lines: [
    "$ next dev",
    "▲ compiling /changelog …",
    "✓ typefaces ready",
    "✓ shaders ready",
    "✓ easing curves ready",
    "✓ first paint",
    "ready. go look.",
  ],
  skip: "press any key to skip",
};

/** Three-beat opener. Keep the first line short: it has to fit one row at hero size. */
export const opener = {
  a: "pixel perfect in figma",
  b: "who made it real?",
  c: "he did",
};

export const hud = {
  file: "~/portfolio/CHANGELOG.md",
  status: "main · clean",
  alerts: ["compiled successfully", "0 errors, 0 warnings", "//", "ship it. or don't."],
};

export const bar = {
  branch: "main",
  file: "CHANGELOG.md",
  tz: "Asia/Jakarta",
  tzLabel: "GMT+7",
  nav: [
    { id: "releases", label: "releases" },
    { id: "experiments", label: "experiments" },
    { id: "screenshot", label: "screenshot" },
    { id: "unreleased", label: "unreleased" },
  ],
};

const find = (company: string, role: string) => {
  const e = experiences.find((x) => x.company === company && x.role === role);
  if (!e) throw new Error(`Missing experience: ${role} at ${company}`);
  return e;
};

const founder = find("Shiro Labs", "Founder");
const qa = find("NoscAI", "QA Engineer");
const laravel = find("Yayasan Pendidikan Bina Anak Indonesia Kompeten", "Laravel Developer (Intern)");
const frontend = find("NoscAI", "Frontend Developer");
const website = find("Alamaya Online Indonesia", "Website Developer (Intern)");

export interface Release {
  version: string;
  range: string;
  title: string;
  summary: string;
  added: string[];
  recognised?: string[];
  alsoThisRelease?: string[];
  deps: string[];
}

/** Newest first, like any changelog. QA is on the record, as a note on the release it overlaps with. */
export const releases: Release[] = [
  {
    version: "4.0.0",
    range: "2025-09 → now",
    title: "Founder, Shiro Labs",
    summary: founder.description,
    added: founder.highlights,
    alsoThisRelease: [`QA Engineer at NoscAI (2025-12 → now): ${qa.highlights[0].toLowerCase()}.`],
    deps: founder.tags,
  },
  {
    version: "3.0.0",
    range: "2025-02 → 2025-08",
    title: "Laravel Developer (Intern), Bina Anak Indonesia",
    summary: laravel.description,
    added: laravel.highlights,
    deps: laravel.tags,
  },
  {
    version: "2.0.0",
    range: "2022-11 → 2024-08",
    title: "Frontend Developer, NoscAI",
    summary: frontend.description,
    added: frontend.highlights,
    recognised: frontend.awards,
    deps: frontend.tags,
  },
  {
    version: "1.0.0",
    range: "2018-07 → 2019-06",
    title: "Website Developer (Intern), Alamaya Online",
    summary: website.description,
    added: website.highlights,
    deps: website.tags,
  },
];

export interface Experiment {
  name: string;
  href: string;
  note: string;
}

/** Side projects that live in this repo. */
export const experiments: Experiment[] = [
  { name: "turntable", href: "/player", note: "a record player you can use: 3D deck, record rack, scratch and wear sounds, and your own playlist." },
  { name: "kanagawa", href: "/kanagawa", note: "the Great Wave redrawn as animated ASCII, with a trilingual wiki beside it." },
  { name: "karhutla", href: "/karhutla", note: "a scroll story built on real satellite fire detections, in English and Bahasa Indonesia." },
];

export const screenshot = {
  title: "ClinicOS, annotated",
  alt: "The ClinicOS physician dashboard, built at NoscAI.",
  hint: "move your cursor over the screen",
  hintTouch: "drag a finger over the screen",
  /** Illustrative design notes. Positions are % of the image. */
  marks: [
    { x: 14, y: 22, w: 24, h: 16, label: "8px grid" },
    { x: 46, y: 18, w: 22, h: 20, label: "density, not noise" },
    { x: 70, y: 52, w: 22, h: 18, label: "colour = status" },
    { x: 20, y: 62, w: 26, h: 20, label: "calm hierarchy" },
    { x: 50, y: 64, w: 16, h: 14, label: "focus ring" },
  ],
};

export const unreleased = {
  note: "Looking for the next screen worth obsessing over.",
  cta: "say hello",
  email: "me@aftarfadilah.com",
  href: "mailto:me@aftarfadilah.com",
  links: socialLinks.filter((l) => l.icon !== "email"),
  back: "← back to the IDE",
};
