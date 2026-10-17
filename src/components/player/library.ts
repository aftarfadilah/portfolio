import { isYouTubeId } from "@/lib/youtube";

export interface Track {
  id: string;
  title: string;
  author: string;
}

const LIBRARY_KEY = "player-library";
const MAX_RECORDS = 300;

export function readLibrary(): Track[] {
  try {
    const raw = localStorage.getItem(LIBRARY_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(
        (t): t is Track =>
          !!t &&
          typeof t.id === "string" &&
          isYouTubeId(t.id) &&
          typeof t.title === "string" &&
          typeof t.author === "string",
      )
      .slice(0, MAX_RECORDS);
  } catch {
    return [];
  }
}

export function writeLibrary(tracks: Track[]) {
  try {
    localStorage.setItem(LIBRARY_KEY, JSON.stringify(tracks.slice(0, MAX_RECORDS)));
  } catch {}
}

/** New songs go to the front of the rack; ones already on the rack stay where they are. */
export function addToLibrary(library: Track[], incoming: Track[]): Track[] {
  const have = new Set(library.map((t) => t.id));
  const fresh: Track[] = [];
  for (const t of incoming) {
    if (!have.has(t.id)) {
      have.add(t.id);
      fresh.push(t);
    }
  }
  return [...fresh, ...library].slice(0, MAX_RECORDS);
}
