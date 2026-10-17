"use client";

import { ScrollText, serif, type T } from "./shared";

/** One sentence, read at the pace of the scroll. The message of the whole page. */
export default function Manifesto({ t }: { t: T }) {
  return (
    <section data-ch="0" className="flex min-h-[130vh] items-center bg-ink px-6 py-32 text-[#f1ece3] sm:px-10">
      <div className="mx-auto w-full max-w-5xl">
        <ScrollText text={t("manifesto")} className={`${serif} text-4xl leading-[1.12] sm:text-6xl lg:text-7xl`} />
      </div>
    </section>
  );
}
