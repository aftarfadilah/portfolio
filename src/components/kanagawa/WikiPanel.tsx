"use client";

import { useEffect, useState } from "react";
import { ENTRIES, HOTSPOTS, type Block, type Entry, type Tone } from "@/data/kanagawa-wiki";

const W = 54; // inner width, in characters
const KEY_W = 10;

type Seg = { text: string; cls: string };
type Line = Seg[];

const C = {
  rail: "text-[#54546D]",
  title: "text-[#E6C384] font-semibold",
  sub: "text-[#727169]",
  h: "text-[#7E9CD8] uppercase tracking-wider",
  p: "text-[#DCD7BA]",
  key: "text-[#7FB4CA]",
  quote: "text-[#957FB8]",
  warn: "text-[#D27E99]",
  note: "text-[#E6C384]",
};

/** Greedy word wrap. */
function wrap(text: string, width: number): string[] {
  const out: string[] = [];
  let cur = "";
  for (const word of text.split(/\s+/)) {
    if (cur && cur.length + 1 + word.length > width) {
      out.push(cur);
      cur = word;
    } else cur = cur ? `${cur} ${word}` : word;
  }
  if (cur) out.push(cur);
  return out;
}

// Colour classes for art characters.
const ART = {
  label: "text-[#C8C093]",
  foam: "text-[#DCD7BA]",
  water: "text-[#7FB4CA]",
  struct: {
    sea: "text-[#7E9CD8]",
    fuji: "text-[#957FB8]",
    gold: "text-[#E6C384]",
    ink: "text-[#938AA9]",
  } satisfies Record<Tone, string>,
};

function artLine(line: string, tone: Tone): Line {
  const segs: Seg[] = [];
  for (const ch of line) {
    const cls = /[A-Za-z0-9]/.test(ch)
      ? ART.label
      : "~-=_".includes(ch)
        ? ART.water
        : "*'`.,".includes(ch)
          ? ART.foam
          : ART.struct[tone];
    const last = segs[segs.length - 1];
    if (last && last.cls === cls) last.text += ch;
    else segs.push({ text: ch, cls });
  }
  return segs;
}

function blockLines(b: Block): Line[] {
  switch (b.t) {
    case "art":
      return b.lines.map((l) => artLine(l, b.tone));
    case "h":
      return [[{ text: `>> ${b.text}`, cls: C.h }]];
    case "p":
      return wrap(b.text, W).map((t) => [{ text: t, cls: C.p }]);
    case "warn": {
      const [first, ...rest] = wrap(b.text, W - 4);
      return [
        [{ text: "[!] ", cls: C.warn }, { text: first, cls: C.warn }],
        ...rest.map((t) => [{ text: `    ${t}`, cls: C.warn }]),
      ];
    }
    case "quote": {
      const body = wrap(`"${b.text}"`, W - 2).map((t) => [{ text: `| ${t}`, cls: C.quote }]);
      const by = wrap(`-- ${b.by}`, W - 2).map((t) => [{ text: `  ${t}`, cls: C.sub }]);
      return [...body, ...by];
    }
    case "kv":
      return b.rows.flatMap(([k, v]) =>
        wrap(v, W - KEY_W).map((t, i) => [
          { text: (i === 0 ? k : "").padEnd(KEY_W), cls: C.key },
          { text: t, cls: C.p },
        ]),
      );
  }
}

function layout(entry: Entry, note?: string): Line[] {
  const head = `+--[ ${entry.num} :: ${entry.title} ]`;
  const lines: Line[] = [[{ text: head + "-".repeat(Math.max(2, W + 2 - head.length)), cls: C.title }]];
  const body: Line[] = [[{ text: entry.sub, cls: C.sub }], []];
  if (note) {
    body.push(...wrap(note, W).map((t) => [{ text: t, cls: C.note }]), []);
  }
  entry.blocks.forEach((b, i) => {
    body.push(...blockLines(b));
    if (i < entry.blocks.length - 1) body.push([]);
  });
  for (const l of body) lines.push([{ text: "| ", cls: C.rail }, ...l]);
  lines.push([{ text: "+" + "-".repeat(W + 1), cls: C.rail }]);
  return lines;
}

const reducedMotion = () =>
  typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** Prints the lines a couple at a time, like a terminal. Remount (via key) to replay. */
function Reveal({ lines }: { lines: Line[] }) {
  const total = lines.length;
  const [n, setN] = useState(() => (reducedMotion() ? total : 0));

  useEffect(() => {
    if (reducedMotion()) return;
    let raf = 0;
    let k = 0;
    const step = () => {
      k += 2;
      setN(Math.min(total, k));
      if (k < total) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [total]);

  return (
    <pre className="m-0 whitespace-pre font-[inherit]">
      {lines.slice(0, n).map((line, i) => (
        <div key={i}>
          {line.length === 0 ? (
            <span className={C.rail}>|</span>
          ) : (
            line.map((s, j) => (
              <span key={j} className={s.cls}>
                {s.text}
              </span>
            ))
          )}
        </div>
      ))}
    </pre>
  );
}

const button =
  "rounded border border-[#2A2A37] px-1.5 py-0.5 text-[#7E9CD8] transition-colors hover:border-[#7E9CD8] hover:text-[#DCD7BA]";

type Props = {
  sel: string | null; // a hotspot id, an entry id, or null for the index
  onSelect: (id: string | null) => void;
  onClose: () => void;
};

export default function WikiPanel({ sel, onSelect, onClose }: Props) {
  const hotspot = HOTSPOTS.find((h) => h.id === sel);
  const entry = ENTRIES.find((e) => e.id === (hotspot?.entry ?? sel));
  const idx = entry ? ENTRIES.indexOf(entry) : -1;
  const go = (i: number) => {
    const e = ENTRIES[(i + ENTRIES.length) % ENTRIES.length];
    onSelect(HOTSPOTS.find((h) => h.entry === e.id)?.id ?? e.id);
  };

  return (
    <aside
      aria-label="Kanagawa wiki"
      className="absolute inset-x-2 bottom-2 z-20 flex max-h-[56vh] flex-col rounded border border-[#2A2A37] bg-[#16161D]/90 font-mono text-[9px] leading-[1.35] text-[#DCD7BA] backdrop-blur sm:text-[11px] lg:inset-x-auto lg:bottom-4 lg:right-4 lg:top-16 lg:max-h-none lg:w-[440px]"
    >
      <div className="flex items-center gap-1.5 border-b border-[#2A2A37] p-2">
        <button type="button" className={button} onClick={() => onSelect(null)}>
          index
        </button>
        {entry && (
          <>
            <button type="button" className={button} onClick={() => go(idx - 1)} aria-label="Previous entry">
              &lt; prev
            </button>
            <button type="button" className={button} onClick={() => go(idx + 1)} aria-label="Next entry">
              next &gt;
            </button>
          </>
        )}
        <span className="ml-auto" />
        <button type="button" className={button} onClick={onClose} aria-label="Close wiki">
          x esc
        </button>
      </div>

      <div className="overflow-y-auto p-3">
        {entry ? (
          <>
            <Reveal key={`${entry.id}:${hotspot?.id ?? ""}`} lines={layout(entry, hotspot?.note)} />
            <ul className="mt-3 flex flex-col gap-1 text-[#727169]">
              <li className="text-[#54546D]">sources</li>
              {entry.sources.map((s, i) => (
                <li key={s.url}>
                  <a
                    href={s.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#7FB4CA] underline decoration-[#2D4F67] underline-offset-2 hover:text-[#DCD7BA]"
                  >
                    [{i + 1}] {s.label}
                  </a>
                </li>
              ))}
            </ul>
          </>
        ) : (
          <Index onPick={(id) => onSelect(id)} />
        )}
      </div>
    </aside>
  );
}

const BANNER = String.raw`
        .-~~~~-.        ,~,~,
     .-'* '  * '-.   ,*'*'*,
   .'  '  _.-.  *  \ '\*,*/
  /  *  .'    '.  '  ;'~'
 ~~~~'-.__'-.__.-'_.-'~~~~~~~`
  .replace(/^\n/, "")
  .split("\n");

function Index({ onPick }: { onPick: (id: string) => void }) {
  const head = "+--[ KANAGAWA.WIKI ]";
  return (
    <pre className="m-0 whitespace-pre font-[inherit]">
      <div className={C.title}>{head + "-".repeat(W + 2 - head.length)}</div>
      {BANNER.map((l, i) => (
        <div key={i}>
          <span className={C.rail}>| </span>
          {artLine(l, "sea").map((s, j) => (
            <span key={j} className={s.cls}>
              {s.text}
            </span>
          ))}
        </div>
      ))}
      <div>
        <span className={C.rail}>| </span>
        <span className={C.sub}>The Great Wave off Kanagawa, nine entries.</span>
      </div>
      <div>
        <span className={C.rail}>| </span>
        <span className={C.sub}>Click a gold marker on the print, or pick one:</span>
      </div>
      <div className={C.rail}>|</div>
      <div>
        <span className={C.rail}>| </span>
        <span className={C.key}>kanagawa/</span>
      </div>
      {ENTRIES.map((e, i) => {
        const last = i === ENTRIES.length - 1;
        const label = `${e.num}  ${e.title}`;
        const id = HOTSPOTS.find((h) => h.entry === e.id)?.id ?? e.id;
        return (
          <button
            key={e.id}
            type="button"
            onClick={() => onPick(id)}
            className="block w-full whitespace-pre text-left font-[inherit] hover:bg-[#223249]/60"
          >
            <span className={C.rail}>| </span>
            <span className={C.rail}>{last ? " `-- " : " |-- "}</span>
            <span className={C.note}>{e.num}</span>
            <span className={C.p}>{`  ${label.slice(4)}`.padEnd(22)}</span>
            <span className={C.sub}>{e.sub.split(" / ")[0]}</span>
          </button>
        );
      })}
      <div className={C.rail}>{"+" + "-".repeat(W + 1)}</div>
    </pre>
  );
}
