import { NextRequest, NextResponse } from "next/server";
import {
  parsePlaylistPage,
  playlistFromData,
  playlistFromMirror,
} from "@/lib/playlist";
import { isYouTubePlaylistId } from "@/lib/youtube";

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";
// The public key YouTube's own web client ships with; it is not a secret.
const WEB_KEY = "AIzaSyAO_FJ2SlqU8Q4STEHLGCilw_Y9_11qcW8";
const MIRRORS = ["https://pipedapi.kavin.rocks", "https://pipedapi.adminforge.de"];

type Result = { title: string; tracks: { id: string; title: string; author: string }[] };

async function viaInnertube(list: string): Promise<Result | string> {
  const res = await fetch(`https://www.youtube.com/youtubei/v1/browse?key=${WEB_KEY}`, {
    method: "POST",
    headers: { "content-type": "application/json", "user-agent": UA },
    body: JSON.stringify({
      browseId: `VL${list}`,
      context: { client: { clientName: "WEB", clientVersion: "2.20250101.00.00", hl: "en", gl: "US" } },
    }),
    cache: "no-store",
  });
  if (!res.ok) return `innertube ${res.status}`;
  const parsed = playlistFromData(await res.json());
  return parsed.tracks.length ? parsed : "innertube 0 rows";
}

async function viaPage(list: string): Promise<Result | string> {
  const res = await fetch(`https://www.youtube.com/playlist?list=${list}&hl=en`, {
    headers: {
      "user-agent": UA,
      "accept-language": "en-US,en;q=0.9",
      cookie: "CONSENT=YES+1; SOCS=CAI",
    },
    cache: "no-store",
  });
  if (!res.ok) return `page ${res.status}`;
  if (res.url.includes("consent.")) return "page consent wall";
  const parsed = parsePlaylistPage(await res.text());
  return parsed && parsed.tracks.length ? parsed : "page 0 rows";
}

async function viaMirror(list: string): Promise<Result | string> {
  const notes: string[] = [];
  for (const base of MIRRORS) {
    try {
      const res = await fetch(`${base}/playlists/${list}`, {
        headers: { "user-agent": UA },
        signal: AbortSignal.timeout(6000),
        cache: "no-store",
      });
      if (!res.ok) {
        notes.push(`${new URL(base).host} ${res.status}`);
        continue;
      }
      const parsed = playlistFromMirror(await res.json());
      if (parsed.tracks.length) return parsed;
      notes.push(`${new URL(base).host} 0 rows`);
    } catch {
      notes.push(`${new URL(base).host} unreachable`);
    }
  }
  return `mirror ${notes.join(", ")}`;
}

// Keyless playlist import. Tries YouTube's page-data API, then the public page,
// then a public mirror, and reports which step failed if none work.
export async function GET(request: NextRequest) {
  const list = request.nextUrl.searchParams.get("list");
  if (!list || !isYouTubePlaylistId(list)) {
    return NextResponse.json({ error: "Invalid playlist id." }, { status: 400 });
  }

  const notes: string[] = [];
  for (const attempt of [viaInnertube, viaPage, viaMirror]) {
    try {
      const result = await attempt(list);
      if (typeof result !== "string") {
        return NextResponse.json(result, {
          headers: { "cache-control": "public, s-maxage=600" },
        });
      }
      notes.push(result);
    } catch {
      notes.push(`${attempt.name} failed`);
    }
  }
  return NextResponse.json(
    {
      error: `Couldn't read any songs from that playlist. Is it public? (${notes.join("; ")})`,
    },
    { status: 404 },
  );
}
