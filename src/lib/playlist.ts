import { isYouTubeId } from "@/lib/youtube";

const MAX_TRACKS = 100;

export interface PlaylistTrack {
  id: string;
  title: string;
  author: string;
}

function text(value: unknown): string {
  if (typeof value === "string") return value;
  if (!value || typeof value !== "object") return "";
  const v = value as { simpleText?: string; runs?: { text?: string }[] };
  return v.simpleText ?? v.runs?.map((r) => r.text ?? "").join("") ?? "";
}

// Walks the page's embedded JSON and collects every playlist row it finds.
function collect(node: unknown, out: PlaylistTrack[], seen: Set<string>) {
  if (out.length >= MAX_TRACKS || !node || typeof node !== "object") return;
  if (Array.isArray(node)) {
    for (const item of node) collect(item, out, seen);
    return;
  }
  const row = (node as { playlistVideoRenderer?: Record<string, unknown> })
    .playlistVideoRenderer;
  if (row) {
    const id = row.videoId;
    const title = text(row.title);
    if (typeof id === "string" && isYouTubeId(id) && title && !seen.has(id)) {
      seen.add(id);
      out.push({
        id,
        title,
        author: text(row.shortBylineText).replace(/ - Topic$/, "") || "Unknown artist",
      });
    }
    return;
  }
  for (const value of Object.values(node)) collect(value, out, seen);
}

export function parsePlaylistPage(html: string) {
  const match = html.match(/var ytInitialData\s*=\s*(\{[\s\S]*?\});\s*<\/script>/);
  if (!match) return null;
  let data: unknown;
  try {
    data = JSON.parse(match[1]);
  } catch {
    return null;
  }
  const tracks: PlaylistTrack[] = [];
  collect(data, tracks, new Set());
  const title = text(
    (data as { metadata?: { playlistMetadataRenderer?: { title?: unknown } } })
      .metadata?.playlistMetadataRenderer?.title,
  );
  return { title: title || "Playlist", tracks };
}
