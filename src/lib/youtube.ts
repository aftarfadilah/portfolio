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
