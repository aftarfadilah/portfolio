import { experiences, socialLinks } from "@/data/content";

/** Copy and data for /casefile. Facts come from content.ts; the voice is the story. */

export const gate = {
  title: "your test suite is running",
  lines: [
    "booting runner…",
    "loading 47 specs",
    "e2e › clinicos › login ......... ok",
    "e2e › billing › goä ............ ok",
    "e2e › transcription ............ flaky",
    "retrying 1 of 3 …",
    "e2e › transcription ............ ok",
    "47 passed · 0 failed · 0 skipped",
  ],
  skip: "press any key to skip",
};

/** Three-beat opener. */
export const opener = {
  a: "it works on my machine",
  b: "who tested it?",
  c: "he did",
};

export const roles = ["QA Engineer", "Founder", "Frontend", "AI Integration", "Test Automation"];

export const hud = {
  file: "~/portfolio/casefile.tsx",
  status: "main · 0 errors · 1 flaky",
  alerts: ["regression detected", "i am watching your diff", "//", "ship it. or don't."],
};

export const narrative = {
  heading: "CASE FILE: THE ENGINEER BEHIND THE BUILD",
  /** Each string is one line; "" is a beat of silence; lines starting with "#" are accents. */
  lines: [
    "The first mistake was assuming Aftar was looking for bugs.",
    "He wasn't.",
    "He was looking for what the software was hiding.",
    "There's a difference.",
    "",
    "It started with websites. A WordPress internship in Denpasar, Bali.",
    "Someone else's design goes in. A working page comes out.",
    "He learned early that the gap between the two is where the truth lives.",
    "",
    "Then Hamburg, from a distance.",
    "One of the first four people on a team building ClinicOS,",
    "Germany's first AI-integrated physician information system.",
    "He built the interface the doctors would see.",
    "In software like that, a wrong number is never just a typo.",
    "",
    "Then he stepped away to finish his degree.",
    "When he came back, he came back on the other side of the glass.",
    "Not building the screen anymore. Trying to break it.",
    "",
    "Aftar has a problem with things that almost work.",
    "Almost stable. Almost accessible. Almost safe to ship.",
    "Those are the ones that survive, because nobody can quite justify killing them.",
    "He can.",
    "",
    "A green check proves less than people think.",
    "It proves the question you asked had an answer.",
    "It says nothing about the question you forgot to ask.",
    "So he writes the uncomfortable test.",
    "The one that makes the room quieter.",
    "",
    "In his own time he founded Shiro Labs.",
    "Its first product, Cariin, reads the CVs so hiring teams don't have to guess.",
    "The machine does the reading. The humans still decide.",
    "That part is not negotiable.",
    "",
    "There is no grand philosophy behind any of it.",
    "No manifesto.",
    "Just an unreasonable amount of curiosity,",
    "and a refusal to leave things alone.",
    "",
    "Aftar doesn't write software to be admired.",
    "He writes it to still be standing on Monday.",
  ],
};

export const xray = {
  kicker: "EXHIBIT A",
  title: "ClinicOS, under the lens",
  hint: "move your cursor over the screen",
  hintTouch: "drag a finger over the screen",
  alt: "The ClinicOS physician dashboard, built at NoscAI.",
  /** Illustrative callouts: what a tester sees that a user doesn't. Positions are % of the image. */
  marks: [
    { x: 14, y: 22, w: 24, h: 16, label: "empty state?" },
    { x: 46, y: 18, w: 22, h: 20, label: "what if the name is 90 chars" },
    { x: 70, y: 52, w: 22, h: 18, label: "slow network" },
    { x: 20, y: 62, w: 26, h: 20, label: "GDPR: who sees this row?" },
    { x: 50, y: 64, w: 16, h: 14, label: "keyboard only" },
  ],
};

export interface Evidence {
  no: string;
  year: string;
  company: string;
  role: string;
  place: string;
  note: string;
  tags: string[];
}

const yearOf = (period: string) => {
  const [from, to] = period.split("—").map((s) => s.trim());
  const y = (s: string) => s.match(/\d{4}/)?.[0] ?? s;
  if (to === "Present") return `${y(from)}–now`;
  return y(from) === y(to) ? y(from) : `${y(from)}–${y(to)}`;
};

export const evidence: Evidence[] = experiences.map((e, i) => ({
  no: String(i + 1).padStart(2, "0"),
  year: yearOf(e.period),
  company: e.company,
  role: e.role,
  place: e.location,
  note: e.description,
  tags: e.tags,
}));

export const awards = experiences.flatMap((e) => e.awards ?? []);

export const evidenceHeading = "the evidence";
export const awardsHeading = "on the record";

export const closer = {
  kicker: "CASE STATUS",
  title: "open",
  body: "Looking for the next thing that almost works.",
  cta: "me@aftarfadilah.com",
  href: "mailto:me@aftarfadilah.com",
  links: socialLinks.filter((l) => l.icon !== "email"),
  back: "← back to the IDE",
};
