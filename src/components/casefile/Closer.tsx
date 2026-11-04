import Link from "next/link";
import { closer } from "@/data/casefile";

export default function Closer() {
  return (
    <footer className="mx-auto max-w-6xl px-6 pt-24 pb-40 sm:pt-40 sm:pb-48">
      <p className="font-mono text-xs tracking-[0.18em] sm:text-sm">
        {closer.kicker}: <span className="text-ember uppercase">{closer.title}</span>
      </p>
      <p className="mt-6 max-w-xl text-2xl font-light sm:text-4xl">{closer.body}</p>
      <a href={closer.href} className="mt-10 inline-block text-[9vw] leading-none font-light tracking-[-0.05em] break-all underline-offset-[0.12em] hover:text-ember hover:underline sm:text-[6vw]">
        {closer.cta}
      </a>

      <nav aria-label="Elsewhere" className="mt-16 flex flex-wrap items-center gap-x-8 gap-y-3 font-mono text-sm">
        {closer.links.map((l) => (
          <a key={l.label} href={l.href} target="_blank" rel="noreferrer" className="underline-offset-4 hover:text-ember hover:underline">
            {l.label} ↗
          </a>
        ))}
        <Link href="/" className="underline-offset-4 hover:text-ember hover:underline">
          {closer.back}
        </Link>
      </nav>
    </footer>
  );
}
