// Karhutla (forest and land fires): hero copy, the one headline figure, and land outlines for the map backdrop.

export type Lang = "en" | "id";
export const LANGS: { id: Lang; label: string; name: string }[] = [
  { id: "en", label: "EN", name: "English" },
  { id: "id", label: "ID", name: "Bahasa Indonesia" },
];

type L = { en: string; id: string };

/** Peak day, SiPongi / Kementerian Kehutanan via Databoks. */
export const FIGURES = { peakDay: 22293 };

/** Real detections baked from NASA FIRMS (VIIRS S-NPP, 24 h to 17 Oct 2026). See public/data. */
export const SNAPSHOT_URL = "/data/karhutla-viirs.json";

export const SOURCES: { label: string; href: string }[] = [
  {
    label: "SiPongi via Databoks",
    href: "https://databoks.katadata.co.id/en/demographics/statistics/56be4e3d12618dc/22293-hotspots-detected-across-indonesia-in-the-last-24-hours-monday-21-september-2026",
  },
  { label: "NASA FIRMS", href: "https://firms.modaps.eosdis.nasa.gov/" },
];

export const C = {
  back: { en: "← portfolio", id: "← portofolio" },
  langAria: { en: "Language", id: "Bahasa" },

  heroKicker: { en: "Karhutla · Indonesia · dry season 2026", id: "Karhutla · Indonesia · kemarau 2026" },
  heroTitle: { en: "The fire is the last chapter.", id: "Api hanyalah bab terakhir." },
  heroDeck: {
    en: "What a satellite calls a hotspot is a pixel that read hot. A warning, not a fire. The story starts long before the flames.",
    id: "Yang disebut satelit titik panas adalah piksel yang terbaca panas. Sebuah peringatan, bukan api. Ceritanya dimulai jauh sebelum api menyala.",
  },
  heroUnit: { en: "hotspots in 24 hours", id: "titik panas dalam 24 jam" },
  heroPeak: { en: "Peak day, 21 Sep 2026 · SiPongi, Ministry of Forestry", id: "Puncak, 21 Sep 2026 · SiPongi, Kementerian Kehutanan" },

  hudTitle: { en: "Latest pass", id: "Lintasan terbaru" },
  hudMeta: { en: "NASA FIRMS · VIIRS S-NPP · 24 h to 17 Oct 2026", id: "NASA FIRMS · VIIRS S-NPP · 24 jam hingga 17 Okt 2026" },
  hudPixel: {
    en: "Each point is one pixel, about 0.4 km wide, from one satellite of several.",
    id: "Tiap titik adalah satu piksel selebar ±0,4 km, dari satu satelit di antara beberapa.",
  },
  hint: { en: "Hover or tap a point to read the pixel.", id: "Arahkan atau ketuk sebuah titik untuk membaca pikselnya." },
  mapAria: {
    en: "Map of Indonesia where each glowing point is one satellite heat detection from the last pass.",
    id: "Peta Indonesia; tiap titik bercahaya adalah satu deteksi panas satelit dari lintasan terakhir.",
  },

  conf_h: { en: "High confidence", id: "Keyakinan tinggi" },
  conf_n: { en: "Medium confidence", id: "Keyakinan sedang" },
  conf_l: { en: "Low confidence", id: "Keyakinan rendah" },
  conf_h_d: {
    en: "Much hotter than its surroundings. Most likely active burning, but the reading can't say how big or how long.",
    id: "Jauh lebih panas dari sekitarnya. Kemungkinan besar pembakaran aktif, tetapi bacaan ini tak menunjukkan seberapa luas atau lama.",
  },
  conf_n_d: {
    en: "Hotter than normal. Could be a small fire, a field burn or a hot surface. Needs a second look.",
    id: "Lebih panas dari normal. Bisa api kecil, pembakaran lahan, atau permukaan panas. Perlu dicek ulang.",
  },
  conf_l_d: {
    en: "Barely above background. May be sun-baked ground or an industrial heat source, not a wildfire.",
    id: "Hanya sedikit di atas latar. Bisa tanah terpanggang matahari atau sumber panas industri, bukan kebakaran hutan.",
  },
  hoverK: { en: "Brightness", id: "Kecerahan" },
  hoverFrp: { en: "Radiative power", id: "Daya radiasi" },
  hoverNote: { en: "A reading, not proof of a fire.", id: "Sebuah bacaan, bukan bukti kebakaran." },

  lblSum: { en: "Sumatra", id: "Sumatera" },
  lblKal: { en: "Kalimantan", id: "Kalimantan" },
  lblJav: { en: "Java", id: "Jawa" },
  lblSul: { en: "Sulawesi", id: "Sulawesi" },
  lblPap: { en: "Papua", id: "Papua" },
} satisfies Record<string, L>;

export type Key = keyof typeof C;

// ───────────── land outlines, [lon, lat], only used for a faint dot-matrix backdrop ─────────────

export type LL = [number, number][];
export const LAND: LL[] = [
  // Sumatra
  [[95.3, 5.6], [97.4, 5.3], [98.7, 3.8], [100.5, 2.2], [103.3, 0.8], [104.3, -1.0], [106.0, -3.2], [105.9, -5.8], [104.6, -5.9], [102.3, -4.0], [100.4, -1.6], [99.0, 0.5], [97.5, 2.5], [95.5, 4.8]],
  // Borneo
  [[109.0, 1.9], [111.5, 1.6], [113.8, 3.7], [115.8, 5.0], [117.0, 6.9], [119.2, 5.3], [117.6, 3.5], [117.8, 1.0], [116.5, -1.5], [116.2, -3.5], [114.5, -4.0], [111.8, -3.3], [110.2, -2.9], [109.9, -1.0], [109.0, 0.5]],
  // Java
  [[105.2, -6.8], [108.0, -6.3], [110.5, -6.8], [112.8, -6.9], [114.5, -7.8], [114.5, -8.7], [111.0, -8.3], [108.0, -7.8], [105.5, -7.0]],
  // Sulawesi
  [[120.0, 1.0], [122.0, 1.0], [125.0, 1.5], [124.0, 0.5], [121.6, 0.4], [121.8, -1.0], [123.3, -0.9], [123.0, -2.0], [122.5, -4.8], [121.5, -4.5], [121.0, -3.0], [120.3, -5.5], [119.5, -5.5], [119.6, -3.0], [118.8, -2.8], [119.8, 0.0]],
  // Papua
  [[131.0, -0.8], [134.0, -0.5], [137.0, -1.5], [141.0, -2.6], [141.0, -9.0], [138.5, -8.3], [137.5, -5.5], [135.0, -4.2], [133.0, -4.0], [132.5, -2.8], [131.0, -1.5]],
  // Malay Peninsula
  [[100.3, 6.3], [102.2, 6.2], [103.4, 4.5], [103.5, 2.5], [104.2, 1.4], [103.3, 1.3], [101.3, 2.8], [100.4, 4.3], [100.1, 6.0]],
];

export const LABELS = [
  { key: "lblSum", lon: 100.6, lat: -3.4 },
  { key: "lblKal", lon: 112.6, lat: 2.6 },
  { key: "lblJav", lon: 114.2, lat: -9.8 },
  { key: "lblSul", lon: 122.4, lat: 2.4 },
  { key: "lblPap", lon: 135.2, lat: -1.9 },
] as const;
