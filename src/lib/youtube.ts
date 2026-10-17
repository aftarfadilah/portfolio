const ID_PATTERN = /^[\w-]{11}$/;

const YOUTUBE_HOSTS = new Set([
  "youtube.com",
  "www.youtube.com",
  "m.youtube.com",
  "music.youtube.com",
  "youtube-nocookie.com",
  "www.youtube-nocookie.com",
]);

export function isYouTubeId(value: string): boolean {
  return ID_PATTERN.test(value);
}

/**
 * Extracts a video id from a YouTube / YouTube Music link (or a bare id).
 * Playlist-only links and unrelated hosts return null.
 */
export function parseYouTubeId(input: string): string | null {
  const text = input.trim();
  if (!text) return null;
  if (isYouTubeId(text)) return text;

  let url: URL;
  try {
    url = new URL(/^https?:\/\//i.test(text) ? text : `https://${text}`);
  } catch {
    return null;
  }

  const host = url.hostname.toLowerCase();
  let candidate: string | null = null;

  if (host === "youtu.be") {
    candidate = url.pathname.split("/")[1] ?? null;
  } else if (YOUTUBE_HOSTS.has(host)) {
    const [, first, second] = url.pathname.split("/");
    if (first === "watch") candidate = url.searchParams.get("v");
    else if (first === "shorts" || first === "embed" || first === "live")
      candidate = second ?? null;
  }

  return candidate && isYouTubeId(candidate) ? candidate : null;
}

const PLAYLIST_PATTERN = /^[\w-]{10,64}$/;

export function isYouTubePlaylistId(value: string): boolean {
  return PLAYLIST_PATTERN.test(value);
}

export type YouTubeLink =
  | { kind: "video"; id: string }
  | { kind: "playlist"; id: string };

/**
 * Classifies a pasted link. A link carrying a video id is a single video, even
 * when it also has `list=` (that's just "this video, inside a playlist");
 * `/playlist?list=…` links are playlists.
 */
export function parseYouTubeLink(input: string): YouTubeLink | null {
  const video = parseYouTubeId(input);
  if (video) return { kind: "video", id: video };

  const text = input.trim();
  let url: URL;
  try {
    url = new URL(/^https?:\/\//i.test(text) ? text : `https://${text}`);
  } catch {
    return null;
  }
  if (!YOUTUBE_HOSTS.has(url.hostname.toLowerCase())) return null;
  const list = url.searchParams.get("list");
  return list && isYouTubePlaylistId(list) ? { kind: "playlist", id: list } : null;
}
