import Link from "next/link";
import { closer, panel } from "@/data/casefile";
import styles from "./casefile.module.css";

export default function Footer() {
  return (
    <footer id="contact" className={`${styles.ui} relative bg-black px-[10px] pt-24 pb-24 text-white sm:pt-40`}>
      <div className="mx-auto max-w-6xl">
        <div className="flex items-center gap-3">
          <span className={styles.chip}>{closer.kicker}</span>
          <span className="opacity-50">{"//"}</span>
          <span>{closer.title}</span>
        </div>

        <p className="mt-10 max-w-md text-[11px] leading-[1.5] text-[#c8c8c8] sm:text-xs">{closer.body}</p>

        <a href={closer.href} style={{ fontFamily: "var(--font-geist-sans), system-ui, sans-serif" }} className="group mt-12 block text-[clamp(2.4rem,12vw,11rem)] leading-[0.9] font-light tracking-[-0.06em] normal-case">
          <span className="block transition-opacity group-hover:opacity-60">{closer.cta}</span>
          <span className="block text-red-600 opacity-80 transition-opacity group-hover:opacity-100">+</span>
        </a>

        <div className="mt-16 flex flex-wrap items-center gap-x-8 gap-y-3 text-[#c8c8c8]">
          <a href={closer.href} className="hover:text-white">{closer.email}</a>
          {closer.links.map((l) => (
            <a key={l.label} href={l.href} target="_blank" rel="noreferrer" className="hover:text-white">
              {l.label} ↗
            </a>
          ))}
          <Link href="/" className="hover:text-white">{closer.back}</Link>
        </div>

        <div className="mt-24 flex justify-between text-[#c8c8c8]">
          <span>{panel.year} <span className="opacity-50">{"//"}</span> {panel.state}</span>
          <span className="opacity-50">{"//"}</span>
        </div>
      </div>
    </footer>
  );
}
