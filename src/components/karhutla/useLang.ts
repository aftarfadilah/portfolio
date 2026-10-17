import { useSyncExternalStore } from "react";
import type { Lang } from "@/data/karhutla";

const KEY = "karhutla-lang";
const listeners = new Set<() => void>();

const subscribe = (cb: () => void) => {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
};

/** Saved choice first, then the browser language, then English. */
function read(): Lang {
  try {
    const saved = localStorage.getItem(KEY);
    if (saved === "en" || saved === "id") return saved;
  } catch {}
  const n = navigator.language.toLowerCase();
  return n.startsWith("id") || n.startsWith("in") ? "id" : "en";
}

export function useLang(): [Lang, (l: Lang) => void] {
  const lang = useSyncExternalStore(subscribe, read, () => "en" as Lang);
  const set = (l: Lang) => {
    try {
      localStorage.setItem(KEY, l);
    } catch {}
    listeners.forEach((cb) => cb());
  };
  return [lang, set];
}
