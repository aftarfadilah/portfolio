import { NextRequest } from "next/server";
import { isYouTubeId } from "@/lib/youtube";

// Same-origin proxy so the thumbnail can be used as a WebGL texture
// without depending on third-party CORS headers.
const VARIANTS = ["maxresdefault", "mqdefault"];

export async function GET(request: NextRequest) {
  const id = request.nextUrl.searchParams.get("id");
  if (!id || !isYouTubeId(id)) {
    return new Response("Invalid video id.", { status: 400 });
  }

  for (const variant of VARIANTS) {
    try {
      const upstream = await fetch(`https://i.ytimg.com/vi/${id}/${variant}.jpg`);
      if (upstream.ok) {
        return new Response(upstream.body, {
          headers: {
            "Content-Type": "image/jpeg",
            "Cache-Control": "public, max-age=86400, s-maxage=86400",
          },
        });
      }
    } catch {
      return new Response("Could not reach YouTube.", { status: 502 });
    }
  }
  return new Response("Thumbnail not found.", { status: 404 });
}
