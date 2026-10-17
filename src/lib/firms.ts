// NASA FIRMS CSV → the few numbers the karhutla page shows.

export type Hotspots = {
  configured: boolean;
  total?: number;
  byConfidence?: { h: number; n: number; l: number };
  points?: [number, number, "h" | "n" | "l"][]; // lon, lat, confidence (thinned)
  updated?: string;
  error?: string;
};

/** Pull the columns we need out of FIRMS CSV by header name, so column order doesn't matter. */
export function parseFirms(csv: string): Hotspots {
  const [head, ...rows] = csv.trim().split("\n");
  const cols = head.split(",");
  const iLat = cols.indexOf("latitude");
  const iLon = cols.indexOf("longitude");
  const iConf = cols.indexOf("confidence");
  const iDate = cols.indexOf("acq_date");
  if (iLat < 0 || iLon < 0 || iConf < 0) throw new Error("Unexpected FIRMS response");

  const byConfidence = { h: 0, n: 0, l: 0 };
  const points: Hotspots["points"] = [];
  let newest = "";
  rows.forEach((row, i) => {
    const f = row.split(",");
    const c = (f[iConf] ?? "n").trim().toLowerCase().charAt(0);
    const conf = c === "h" ? "h" : c === "l" ? "l" : "n";
    byConfidence[conf]++;
    if (iDate >= 0 && f[iDate] > newest) newest = f[iDate];
    if (i % 12 === 0 || conf === "h") points.push([Number(f[iLon]), Number(f[iLat]), conf]);
  });
  return { configured: true, total: rows.length, byConfidence, points: points.slice(0, 1500), updated: newest || undefined };
}
