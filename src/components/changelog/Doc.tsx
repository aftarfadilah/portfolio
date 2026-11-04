"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { experiments, releases, screenshot, unreleased } from "@/data/changelog";
import Spotlight from "./Spotlight";
import styles from "./changelog.module.css";

interface RowDef {
  node: ReactNode;
  id?: string;
}

const dim = (s: string) => <span className="text-[#c8c8c8]/40">{s}</span>;
const key = (s: string) => <span className="text-syntax-keyword">{s}</span>;
const str = (s: string) => <span className="text-syntax-string">{s}</span>;
const note = (s: string) => <span className="text-syntax-comment">{s}</span>;
const fn = (s: string) => <span className="text-syntax-function">{s}</span>;

/** The whole file, as a flat list of lines. Pure, so the line count is known up front. */
function build(): RowDef[] {
  const rows: RowDef[] = [];
  const add = (node: ReactNode, id?: string) => rows.push({ node, id });
  const blank = () => rows.push({ node: null });

  add(<h2 className="text-2xl font-medium tracking-[-0.03em] text-white sm:text-4xl">{dim("# ")}Changelog</h2>);
  blank();
  add(note("<!-- All notable changes to this builder are documented in this file. -->"));
  add(note("<!-- Format: Keep a Changelog. Versioning: roughly semantic, generously interpreted. -->"));
  blank();

  releases.forEach((r, i) => {
    add(
      <h3 className="text-base font-medium text-white sm:text-lg">
        {dim("## ")}[{str(r.version)}] {dim("— ")}
        {note(r.range)}
      </h3>,
      i === 0 ? "releases" : undefined,
    );
    add(<span className="text-white">{r.title}</span>);
    add(<span className="text-[#c8c8c8]/70">{r.summary}</span>);
    blank();
    add(key("### Added"));
    r.added.forEach((a) => add(<>{dim("- ")}{a}</>));
    if (r.alsoThisRelease) {
      blank();
      add(key("### Also this release"));
      r.alsoThisRelease.forEach((a) => add(<>{dim("- ")}{a}</>));
    }
    if (r.recognised) {
      blank();
      add(key("### Recognised"));
      r.recognised.forEach((a) => add(<>{dim("- ")}{a}</>));
    }
    blank();
    add(key("### Dependencies"));
    add(<>{dim("- ")}{r.deps.join(", ")}</>);
    blank();
  });

  add(<h3 className="text-base font-medium text-white sm:text-lg">{dim("## ")}Experiments</h3>, "experiments");
  add(note("<!-- Not client work. Built to learn the tool. All three live in this repo. -->"));
  blank();
  experiments.forEach((e) =>
    add(
      <>
        {dim("- [")}
        <Link href={e.href} className="text-syntax-function underline-offset-4 hover:underline">
          {e.name}
        </Link>
        {dim(`](${e.href}) `)}
        {e.note}
      </>,
    ),
  );
  blank();

  add(<h3 className="text-base font-medium text-white sm:text-lg">{dim("## ")}Screenshot</h3>, "screenshot");
  add(<>{dim("![")}{screenshot.title}{dim("](/clinicos-dashboard.webp)")}</>);
  add(<Spotlight />);
  blank();

  add(<h3 className="text-base font-medium text-white sm:text-lg">{dim("## ")}Unreleased</h3>, "unreleased");
  add(<>{dim("- ")}{unreleased.note}</>);
  add(
    <>
      {dim("- [")}
      <a href={unreleased.href} className="text-syntax-function underline-offset-4 hover:underline">
        {unreleased.cta}
      </a>
      {dim("](")}
      {fn(`mailto:${unreleased.email}`)}
      {dim(")")}
    </>,
  );
  unreleased.links.forEach((l) =>
    add(
      <>
        {dim("- [")}
        <a href={l.href} target="_blank" rel="noreferrer" className="text-syntax-function underline-offset-4 hover:underline">
          {l.label.toLowerCase()}
        </a>
        {dim(`](${l.href.replace(/^https?:\/\//, "")})`)}
      </>,
    ),
  );
  add(
    <>
      {dim("- [")}
      <Link href="/" className="text-syntax-function underline-offset-4 hover:underline">
        back to the IDE
      </Link>
      {dim("](/)")}
    </>,
  );
  blank();
  add(note("<!-- EOF -->"));
  return rows;
}

const ROWS = build();
export const DOC_LINES = ROWS.length;

/** One line of the file. It surfaces as it nears the middle of the screen. */
function Row({ n, def }: { n: number; def: RowDef }) {
  const ref = useRef<HTMLDivElement>(null);
  const [seen, setSeen] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setSeen(true);
          io.disconnect();
        }
      },
      { rootMargin: "0px 0px -8% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      id={def.id}
      data-in={seen}
      className={`${styles.line} grid scroll-mt-16 grid-cols-[2rem_1fr] gap-x-3 font-mono text-[12px] leading-[1.9] text-[#c8c8c8] sm:grid-cols-[3rem_1fr] sm:gap-x-5 sm:text-[13px]`}
    >
      <span aria-hidden className="text-right text-[#c8c8c8]/25 tabular-nums select-none">
        {n}
      </span>
      <div className="min-w-0 border-l border-white/10 pl-3 break-words sm:pl-5">{def.node ?? " "}</div>
    </div>
  );
}

export default function Doc() {
  return (
    <article aria-label="Changelog" className="mx-auto max-w-4xl px-4 pt-24 pb-40 sm:px-8">
      {ROWS.map((def, i) => (
        <Row key={i} n={i + 1} def={def} />
      ))}
    </article>
  );
}
