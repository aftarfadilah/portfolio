import { NextResponse } from "next/server";
import { parseFirms, type Hotspots } from "@/lib/firms";

// Live VIIRS detections over Indonesia from NASA FIRMS (needs a free MAP_KEY).
// https://firms.modaps.eosdis.nasa.gov/api/area/
const BBOX = "95,-11,141,6"; // west,south,east,north
const SOURCE = "VIIRS_SNPP_NRT";

export async function GET() {
  const key = process.env.FIRMS_MAP_KEY;
  if (!key) return NextResponse.json({ configured: false } satisfies Hotspots);

  try {
    const res = await fetch(`https://firms.modaps.eosdis.nasa.gov/api/area/csv/${key}/${SOURCE}/${BBOX}/1`, {
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) throw new Error(`FIRMS ${res.status}`);
    return NextResponse.json(parseFirms(await res.text()), {
      headers: { "Cache-Control": "public, s-maxage=900, stale-while-revalidate=1800" },
    });
  } catch (e) {
    return NextResponse.json(
      { configured: true, error: e instanceof Error ? e.message : "failed" } satisfies Hotspots,
      { status: 502 },
    );
  }
}
