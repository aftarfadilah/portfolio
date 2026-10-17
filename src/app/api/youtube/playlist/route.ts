import { NextRequest, NextResponse } from "next/server";
import { parsePlaylistPage } from "@/lib/playlist";
import { isYouTubePlaylistId } from "@/lib/youtube";

// Keyless playlist import: reads the public playlist page (first 100 rows).
export async function GET(request: NextRequest) {
  const list = request.nextUrl.searchParams.get("list");
  if (!list || !isYouTubePlaylistId(list)) {
    return NextResponse.json({ error: "Invalid playlist id." }, { status: 400 });
  }

  const target = new URL("https://www.youtube.com/playlist");
  target.searchParams.set("list", list);
  target.searchParams.set("hl", "en");

  let upstream: Response;
  try {
    upstream = await fetch(target, {
      headers: {
        "user-agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
        "accept-language": "en-US,en;q=0.9",
        cookie: "CONSENT=YES+1; SOCS=CAI",
      },
      next: { revalidate: 600 },
    });
  } catch {
    return NextResponse.json({ error: "Could not reach YouTube." }, { status: 502 });
  }
  if (!upstream.ok) {
    return NextResponse.json(
      { error: "Playlist not found, or it's private." },
      { status: 404 },
    );
  }

  const parsed = parsePlaylistPage(await upstream.text());
  if (!parsed || parsed.tracks.length === 0) {
    return NextResponse.json(
      { error: "Couldn't read any songs from that playlist. Is it public?" },
      { status: 404 },
    );
  }
  return NextResponse.json(parsed);
}
