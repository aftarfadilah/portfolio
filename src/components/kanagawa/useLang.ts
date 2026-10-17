import { useSyncExternalStore } from "react";
import type { Lang } from "@/data/kanagawa-wiki";

const KEY = "kanagawa-lang";
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
    if (saved === "en" || saved === "id" || saved === "ja") return saved;
  } catch {}
  const n = navigator.language.toLowerCase();
  if (n.startsWith("ja")) return "ja";
  if (n.startsWith("id") || n.startsWith("in")) return "id";
  return "en";
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
