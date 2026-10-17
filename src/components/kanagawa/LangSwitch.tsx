import { LANGS, UI, type Lang } from "@/data/kanagawa-wiki";

/** EN / ID / JA, always visible: top right of the page and inside the wiki panel. */
export default function LangSwitch({ lang, onLang, className = "" }: { lang: Lang; onLang: (l: Lang) => void; className?: string }) {
  return (
    <div
      role="group"
      aria-label={UI[lang].langAria}
      className={`pointer-events-auto flex overflow-hidden rounded border border-[#E6C384]/60 bg-[#16161D]/85 font-mono text-[11px] backdrop-blur ${className}`}
    >
      {LANGS.map((l) => (
        <button
          key={l.id}
          type="button"
          title={l.name}
          aria-pressed={lang === l.id}
          onClick={() => onLang(l.id)}
          className={`px-2.5 py-1 tracking-widest transition-colors ${
            lang === l.id ? "bg-[#E6C384] text-[#16161D]" : "text-[#E6C384] hover:bg-[#2A2A37]"
          }`}
        >
          {l.label}
        </button>
      ))}
    </div>
  );
}
