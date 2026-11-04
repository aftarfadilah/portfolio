import { roles } from "@/data/casefile";
import styles from "./casefile.module.css";

/** Endless role ticker. The list is doubled so the -50% loop is seamless. */
export default function Marquee() {
  const row = [...roles, ...roles];
  return (
    <div aria-hidden className={`${styles.marqueeWrap} overflow-hidden border-y border-white/10 py-5 font-mono text-sm uppercase`}>
      <div className={styles.marquee}>
        {[0, 1].map((copy) => (
          <div key={copy} className="flex shrink-0 items-center">
            {row.map((r, i) => (
              <span key={`${copy}-${i}`} className="flex items-center">
                <span className="px-6 whitespace-nowrap sm:px-10">{r}</span>
                <span className="text-ember">{"//"}</span>
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
