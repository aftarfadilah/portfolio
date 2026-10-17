import { isYouTubeId } from "@/lib/youtube";

export const MAX_TRACKS = 100;

export interface PlaylistTrack {
  id: string;
  title: string;
  author: string;
}

function text(value: unknown): string {
  if (typeof value === "string") return value;
  if (!value || typeof value !== "object") return "";
  const v = value as { simpleText?: string; content?: string; runs?: { text?: string }[] };
  return v.simpleText ?? v.content ?? v.runs?.map((r) => r.text ?? "").join("") ?? "";
}

function cleanAuthor(value: string) {
  return value.replace(/ - Topic$/, "").trim() || "Unknown artist";
}

type Node = Record<string, unknown>;

function add(out: PlaylistTrack[], seen: Set<string>, id: unknown, title: string, author: string) {
  if (typeof id !== "string" || !isYouTubeId(id) || !title || seen.has(id)) return;
  if (/^\[(private|deleted) video\]$/i.test(title)) return;
  seen.add(id);
  out.push({ id, title, author: cleanAuthor(author) });
}

// Walks YouTube's JSON and collects every playlist row, whichever renderer it uses.
function collect(node: unknown, out: PlaylistTrack[], seen: Set<string>) {
  if (out.length >= MAX_TRACKS || !node || typeof node !== "object") return;
  if (Array.isArray(node)) {
    for (const item of node) collect(item, out, seen);
    return;
  }
  const n = node as Node;
  const row = (n.playlistVideoRenderer ?? n.playlistPanelVideoRenderer) as Node | undefined;
  if (row) {
    add(out, seen, row.videoId, text(row.title), text(row.shortBylineText ?? row.longBylineText));
    return;
  }
  const lockup = n.lockupViewModel as Node | undefined;
  if (lockup && lockup.contentType === "LOCKUP_CONTENT_TYPE_VIDEO") {
    const meta = (lockup.metadata as Node | undefined)?.lockupMetadataViewModel as Node | undefined;
    const rows = (
      (meta?.metadata as Node | undefined)?.contentMetadataViewModel as Node | undefined
    )?.metadataRows as Node[] | undefined;
    const author = text(
      (rows?.[0]?.metadataParts as Node[] | undefined)?.[0]?.text,
    );
    add(out, seen, lockup.contentId, text(meta?.title), author);
    return;
  }
  for (const value of Object.values(n)) collect(value, out, seen);
}

export function playlistFromData(data: unknown) {
  const tracks: PlaylistTrack[] = [];
  collect(data, tracks, new Set());
  const meta = (data as { metadata?: { playlistMetadataRenderer?: { title?: unknown } } } | null)
    ?.metadata?.playlistMetadataRenderer;
  return { title: text(meta?.title) || "Playlist", tracks };
}

/** Pulls the embedded `ytInitialData` object out of a playlist page. */
export function parsePlaylistPage(html: string) {
  const marker = html.search(/ytInitialData["']?\]?\s*=\s*\{/);
  if (marker < 0) return null;
  const start = html.indexOf("{", marker);
  let depth = 0;
  let inString = false;
  let escaped = false;
  for (let i = start; i < html.length; i++) {
    const c = html[i];
    if (inString) {
      if (escaped) escaped = false;
      else if (c === "\\") escaped = true;
      else if (c === '"') inString = false;
    } else if (c === '"') inString = true;
    else if (c === "{") depth++;
    else if (c === "}" && --depth === 0) {
      try {
        return playlistFromData(JSON.parse(html.slice(start, i + 1)));
      } catch {
        return null;
      }
    }
  }
  return null;
}

/** Public Piped/Invidious-style mirror response. */
export function playlistFromMirror(data: unknown) {
  const d = data as { name?: string; relatedStreams?: { url?: string; title?: string; uploaderName?: string }[] };
  const tracks: PlaylistTrack[] = [];
  const seen = new Set<string>();
  for (const s of d?.relatedStreams ?? []) {
    const id = s.url?.match(/[?&]v=([\w-]{11})/)?.[1];
    add(tracks, seen, id, s.title ?? "", s.uploaderName ?? "");
    if (tracks.length >= MAX_TRACKS) break;
  }
  return { title: d?.name || "Playlist", tracks };
}
