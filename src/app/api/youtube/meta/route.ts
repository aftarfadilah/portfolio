import { NextRequest, NextResponse } from "next/server";
import { isYouTubeId } from "@/lib/youtube";

// Keyless metadata lookup through YouTube's public oEmbed endpoint.
export async function GET(request: NextRequest) {
  const id = request.nextUrl.searchParams.get("id");
  if (!id || !isYouTubeId(id)) {
    return NextResponse.json({ error: "Invalid video id." }, { status: 400 });
  }

  const target = new URL("https://www.youtube.com/oembed");
  target.searchParams.set("url", `https://www.youtube.com/watch?v=${id}`);
  target.searchParams.set("format", "json");

  let upstream: Response;
  try {
    upstream = await fetch(target, { next: { revalidate: 3600 } });
  } catch {
    return NextResponse.json(
      { error: "Could not reach YouTube." },
      { status: 502 },
    );
  }

  if (upstream.status === 401 || upstream.status === 403) {
    return NextResponse.json(
      { error: "The owner of this video disabled embedding." },
      { status: 403 },
    );
  }
  if (!upstream.ok) {
    return NextResponse.json(
      { error: "Video not found or unavailable." },
      { status: 404 },
    );
  }

  const data = (await upstream.json()) as {
    title?: string;
    author_name?: string;
  };
  return NextResponse.json({
    id,
    title: data.title ?? "Untitled",
    author: data.author_name ?? "Unknown artist",
  });
}
