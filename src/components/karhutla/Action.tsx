"use client";

import { motion } from "framer-motion";
import { useEffect, useState, type ReactNode } from "react";
import { CONF_COLOR, MAP, px } from "@/data/karhutla";
import type { Hotspots } from "@/lib/firms";
import { ChapterHead, LandMass, fmt, serif, type T } from "./shared";

const QUIZ = [
  { q: "q1", e: "q1e", answer: false },
  { q: "q2", e: "q2e", answer: true },
  { q: "q3", e: "q3e", answer: false },
] as const;

/** A bento cell with hairline borders; the page's one big cell is the quiz. */
const Cell = ({ className = "", children }: { className?: string; children: ReactNode }) => (
  <div className={`border-b border-r border-white/20 p-6 sm:p-10 ${className}`}>{children}</div>
);

function Quiz({ t }: { t: T }) {
  const [given, setGiven] = useState<(boolean | null)[]>([null, null, null]);
  const done = given.every((g) => g !== null);
  const score = QUIZ.filter((q, i) => given[i] === q.answer).length;

  return (
    <>
      <h3 className={`${serif} text-3xl leading-tight sm:text-5xl`}>{t("quizTitle")}</h3>
      <ol className="mt-8 space-y-8">
        {QUIZ.map((item, i) => {
          const g = given[i];
          return (
            <li key={item.q} className="border-t border-white/15 pt-5">
              <p className="text-base sm:text-lg">{t(item.q)}</p>
              <div className="mt-3 flex gap-2">
                {[true, false].map((v) => (
                  <button
                    key={String(v)}
                    type="button"
                    disabled={g !== null}
                    onClick={() => setGiven((s) => s.map((x, j) => (j === i ? v : x)))}
                    className={`border px-4 py-1.5 text-xs font-medium uppercase tracking-[0.14em] transition ${
                      g === v
                        ? v === item.answer
                          ? "border-emerald-400 bg-emerald-400/15 text-emerald-100"
                          : "border-red-400 bg-red-400/15 text-red-100"
                        : "border-white/30 enabled:hover:bg-white/10"
                    }`}
                  >
                    {v ? t("qTrue") : t("qFalse")}
                  </button>
                ))}
              </div>
              {g !== null && (
                <motion.p initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className="mt-3 text-sm leading-relaxed opacity-80">
                  <strong className={g === item.answer ? "text-emerald-300" : "text-red-300"}>{g === item.answer ? t("qRight") : t("qWrong")}</strong> {t(item.e)}
                </motion.p>
              )}
            </li>
          );
        })}
      </ol>
      {done && (
        <div className="mt-8 flex items-center justify-between border-t border-white/20 pt-4">
          <p className={`${serif} text-4xl`}>
            {score} / {QUIZ.length}
          </p>
          <button type="button" onClick={() => setGiven([null, null, null])} className="border border-white/30 px-4 py-1.5 text-xs font-medium uppercase tracking-[0.14em] hover:bg-white/10">
            {t("qAgain")}
          </button>
        </div>
      )}
    </>
  );
}

type Live = { status: "loading" } | { status: "off" } | { status: "error" } | { status: "ok"; data: Hotspots };

function LivePanel({ t, lang }: { t: T; lang: string }) {
  const [live, setLive] = useState<Live>({ status: "loading" });

  useEffect(() => {
    const ctl = new AbortController();
    fetch("/api/karhutla/hotspots", { signal: ctl.signal })
      .then((r) => r.json() as Promise<Hotspots>)
      .then((data) => setLive(!data.configured ? { status: "off" } : data.error ? { status: "error" } : { status: "ok", data }))
      .catch((e) => {
        if (e?.name !== "AbortError") setLive({ status: "error" });
      });
    return () => ctl.abort();
  }, []);

  return (
    <div className="grid items-center gap-8 md:grid-cols-2">
      <div>
        <p className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.18em] opacity-60">
          <span className={`h-2 w-2 rounded-full ${live.status === "ok" ? "animate-pulse bg-emerald-400" : "bg-white/40"}`} />
          {t("liveTitle")}
        </p>
        {live.status === "loading" && <p className="mt-4 opacity-70">{t("liveLoading")}</p>}
        {live.status === "off" && <p className="mt-4 max-w-md text-sm leading-relaxed opacity-70">{t("liveOff")}</p>}
        {live.status === "error" && <p className="mt-4 text-sm text-amber-200">{t("liveErr")}</p>}
        {live.status === "ok" && (
          <>
            <p className={`${serif} mt-4 text-7xl leading-none tabular-nums`}>{fmt(live.data.total ?? 0, lang)}</p>
            <p className="mt-2 text-sm opacity-70">
              {t("liveTotal")} {t("liveBody")}
            </p>
          </>
        )}
      </div>
      {live.status === "ok" && live.data.points && (
        <svg viewBox={`0 0 ${MAP.w} ${MAP.h}`} className="block w-full">
          <LandMass fill="#2d2520" stroke="#5c4c40" />
          {live.data.points.map(([lo, la, c], i) => {
            const [x, y] = px(lo, la);
            return <circle key={i} cx={x} cy={y} r={c === "h" ? 2.6 : 1.8} fill={CONF_COLOR[c]} opacity="0.9" />;
          })}
        </svg>
      )}
    </div>
  );
}

export default function Action({ t, lang }: { t: T; lang: string }) {
  return (
    <section data-ch="6" id="ch-6" className="bg-ink text-[#f1ece3]">
      <div className="mx-auto max-w-7xl px-6 py-28 sm:px-10 lg:py-40">
        <ChapterHead n={6} kicker={t("c7Kicker")} title={t("c7Title")} />

        <div className="mt-16 grid border-l border-t border-white/20 lg:grid-cols-6">
          <Cell className="lg:col-span-4 lg:row-span-2">
            <Quiz t={t} />
          </Cell>
          {(
            [
              ["i.", "a1T", "a1B"],
              ["ii.", "a2T", "a2B"],
            ] as const
          ).map(([n, title, body]) => (
            <Cell key={title} className="lg:col-span-2">
              <p className={`${serif} text-4xl italic text-ember`}>{n}</p>
              <h3 className={`${serif} mt-3 text-3xl leading-tight`}>{t(title)}</h3>
              <p className="mt-3 text-sm leading-relaxed opacity-75">{t(body)}</p>
            </Cell>
          ))}
          <Cell className="lg:col-span-6">
            <LivePanel t={t} lang={lang} />
          </Cell>
        </div>

        <p className="mt-6 max-w-xl text-sm leading-relaxed opacity-60">
          <span className={`${serif} italic text-ember`}>iii.</span> <strong className="font-medium opacity-100">{t("a3T")}.</strong> {t("a3B")}
        </p>
      </div>
    </section>
  );
}
