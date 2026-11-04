import { roles } from "@/data/casefile";
import styles from "./casefile.module.css";

/** Role ticker in a grey bar. The list is doubled so the -50% loop is seamless. */
export default function Marquee({ className = "" }: { className?: string }) {
  const row = [...roles, ...roles];
  return (
    <div aria-hidden className={`${styles.marqueeWrap} ${styles.fadeX} ${styles.ui} overflow-hidden bg-[#393939] py-[5px] text-[#c8c8c8] ${className}`}>
      <div className={styles.marquee}>
        {[0, 1].map((copy) => (
          <div key={copy} className="flex shrink-0 items-center">
            {row.map((r, i) => (
              <span key={`${copy}-${i}`} className="flex items-center">
                <span className="px-5 whitespace-nowrap">{r}</span>
                <span className="opacity-50">{"//"}</span>
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
