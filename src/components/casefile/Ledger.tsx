import { ledger, type LedgerGroup } from "@/data/casefile";
import styles from "./casefile.module.css";
import Marquee from "./Marquee";

const pad2 = (n: number) => String(n).padStart(2, "0");

/** The credits table: who, what, and a count on the right. Later groups fade like the rows scroll away. */
export function LedgerTable({ groups, fade = true, big = false }: { groups: LedgerGroup[]; fade?: boolean; big?: boolean }) {
  return (
    <div className={`${styles.ui} ${big ? "sm:text-xs" : ""}`}>
      {groups.map((g, gi) => (
        <div
          key={`${g.who}-${g.role}`}
          className={`grid grid-cols-[minmax(70px,1fr)_2.6fr_auto] gap-x-3 ${big ? "mb-10 sm:gap-x-6" : "mb-4"}`}
          style={{ opacity: fade ? Math.max(0.14, 1 - gi * 0.2) : 1 }}
        >
          {g.rows.map((r, ri) => (
            <div key={r.text} className="col-span-3 grid grid-cols-subgrid">
              <span className={`text-white ${big ? "" : "truncate"}`}>{ri === 0 ? g.who : ""}</span>
              <span className={`text-[#c8c8c8] ${big ? "" : "truncate"}`}>{r.text}</span>
              <span className="text-right text-[#c8c8c8]">{r.value}</span>
            </div>
          ))}
          <div className="col-span-3 grid grid-cols-subgrid">
            <span className="text-[#c8c8c8]/50">{g.role}</span>
            <span className="text-white">[{pad2(g.rows.length)}]</span>
            <span className="text-right text-white">in total</span>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function Ledger() {
  return (
    <section id="ledger" aria-label="Ledger" className="relative bg-black pt-8">
      <Marquee />
      <div className="mx-auto max-w-5xl px-[10px] pt-12 pb-24 sm:px-6">
        <p className={`${styles.ui} mb-10 text-[#c8c8c8]/50`}>
          {"// "}ledger
        </p>
        <LedgerTable groups={ledger} big />
        <p className={`${styles.ui} mt-16 flex justify-between text-[#c8c8c8]`}>
          <span>7.2575° S</span>
          <span className="opacity-50">{"//"}</span>
        </p>
      </div>
    </section>
  );
}
