"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import type { Hotspots } from "@/lib/firms";
import { CONF_COLOR, MAP, px } from "@/data/karhutla";
import { Heading, LandMass, fmt, type T } from "./shared";

const CARDS = [
  { icon: "M12 2l8 4v6c0 5-3.5 8.5-8 10-4.5-1.5-8-5-8-10V6z", title: "a1T", body: "a1B" },
  { icon: "M3 11v2a1 1 0 001 1h3l5 4V6L7 10H4a1 1 0 00-1 1zm13-3a5 5 0 010 8m2.5-10.5a8.5 8.5 0 010 13", title: "a2T", body: "a2B" },
  { icon: "M4 19V9m5 10V5m5 14v-8m5 8V8", title: "a3T", body: "a3B" },
] as const;

const QUIZ = [
  { q: "q1", e: "q1e", answer: false },
  { q: "q2", e: "q2e", answer: true },
  { q: "q3", e: "q3e", answer: false },
] as const;

function Quiz({ t }: { t: T }) {
  const [given, setGiven] = useState<(boolean | null)[]>([null, null, null]);
  const done = given.every((g) => g !== null);
  const score = QUIZ.filter((q, i) => given[i] === q.answer).length;

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
      <h3 className="text-lg font-medium text-white">{t("quizTitle")}</h3>
      <ol className="mt-5 space-y-5">
        {QUIZ.map((item, i) => {
          const g = given[i];
          return (
            <li key={item.q}>
              <p className="text-stone-100">{t(item.q)}</p>
              <div className="mt-2 flex gap-2">
                {[true, false].map((v) => (
                  <button
                    key={String(v)}
                    type="button"
                    disabled={g !== null}
                    onClick={() => setGiven((s) => s.map((x, j) => (j === i ? v : x)))}
                    className={`rounded-full border px-4 py-1 text-sm transition ${
                      g === v ? (v === item.answer ? "border-emerald-400 bg-emerald-400/20 text-emerald-100" : "border-red-400 bg-red-400/20 text-red-100") : "border-white/20 text-stone-200 enabled:hover:bg-white/10"
                    }`}
                  >
                    {v ? t("qTrue") : t("qFalse")}
                  </button>
                ))}
              </div>
              {g !== null && (
                <motion.p initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className="mt-2 text-sm text-stone-300">
                  <strong className={g === item.answer ? "text-emerald-300" : "text-red-300"}>{g === item.answer ? t("qRight") : t("qWrong")}</strong> {t(item.e)}
                </motion.p>
              )}
            </li>
          );
        })}
      </ol>
      {done && (
        <div className="mt-6 flex items-center justify-between border-t border-white/10 pt-4">
          <p className="font-mono text-lg text-white">
            {score} / {QUIZ.length}
          </p>
          <button type="button" onClick={() => setGiven([null, null, null])} className="rounded-full border border-white/20 px-4 py-1 text-sm text-stone-200 hover:bg-white/10">
            {t("qAgain")}
          </button>
        </div>
      )}
    </div>
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
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
      <h3 className="flex items-center gap-2 text-lg font-medium text-white">
        <span className={`h-2 w-2 rounded-full ${live.status === "ok" ? "animate-pulse bg-emerald-400" : "bg-stone-500"}`} />
        {t("liveTitle")}
      </h3>
      {live.status === "loading" && <p className="mt-4 text-stone-400">{t("liveLoading")}</p>}
      {live.status === "off" && <p className="mt-4 text-sm leading-relaxed text-stone-400">{t("liveOff")}</p>}
      {live.status === "error" && <p className="mt-4 text-sm text-amber-200">{t("liveErr")}</p>}
      {live.status === "ok" && live.data.points && live.data.byConfidence && (
        <>
          <p className="mt-2 text-sm text-stone-400">{t("liveBody")}</p>
          <p className="mt-3 font-mono text-4xl font-bold tabular-nums text-white">
            {fmt(live.data.total ?? 0, lang)} <span className="text-base font-normal text-stone-400">{t("liveTotal")}</span>
          </p>
          <svg viewBox={`0 0 ${MAP.w} ${MAP.h}`} className="mt-4 block w-full rounded-lg bg-[#0f0908]">
            <LandMass />
            {live.data.points.map(([lo, la, c], i) => {
              const [x, y] = px(lo, la);
              return <circle key={i} cx={x} cy={y} r={c === "h" ? 2.6 : 1.8} fill={CONF_COLOR[c]} opacity="0.85" />;
            })}
          </svg>
        </>
      )}
    </div>
  );
}

export default function Action({ t, lang }: { t: T; lang: string }) {
  return (
    <section id="ch-6" className="mx-auto max-w-6xl px-6 py-28">
      <Heading kicker={t("c7Kicker")} title={t("c7Title")} />
      <div className="mt-12 grid gap-6 md:grid-cols-3">
        {CARDS.map((c, i) => (
          <motion.div
            key={c.title}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.55, delay: i * 0.1 }}
            className="rounded-2xl border border-white/10 bg-gradient-to-b from-orange-500/10 to-transparent p-6"
          >
            <svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="#ffb25a" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d={c.icon} />
            </svg>
            <h3 className="mt-4 text-xl font-medium text-white">{t(c.title)}</h3>
            <p className="mt-2 text-sm leading-relaxed text-stone-300">{t(c.body)}</p>
          </motion.div>
        ))}
      </div>
      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <Quiz t={t} />
        <LivePanel t={t} lang={lang} />
      </div>
    </section>
  );
}
