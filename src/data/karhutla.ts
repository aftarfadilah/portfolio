// Karhutla (forest and land fires) storytelling site: copy, figures and map data.

export type Lang = "en" | "id";
export const LANGS: { id: Lang; label: string; name: string }[] = [
  { id: "en", label: "EN", name: "English" },
  { id: "id", label: "ID", name: "Bahasa Indonesia" },
];

type L = { en: string; id: string };

/** Figures quoted on the page. Every one is from SiPongi / Kementerian Kehutanan via Databoks. */
export const FIGURES = {
  peakDay: 22293, // hotspots in 24 h, 21 Sep 2026
  peakDate: "21 Sep 2026",
  centralKalimantan: 11011, // 20 Sep 2026 (of 20,802 nationwide)
  nationwide20Sep: 20802,
  latest: 15085, // 4 Oct 2026
  latestDate: "4 Oct 2026",
  confidence: { high: 901, medium: 13265, low: 919 }, // 4 Oct 2026
};

/** High-confidence hotspots, the six priority provinces, 22 Sep 2026. */
export const PROVINCES: { name: L; value: number }[] = [
  { name: { en: "Central Kalimantan", id: "Kalimantan Tengah" }, value: 643 },
  { name: { en: "South Kalimantan", id: "Kalimantan Selatan" }, value: 68 },
  { name: { en: "West Kalimantan", id: "Kalimantan Barat" }, value: 50 },
  { name: { en: "South Sumatra", id: "Sumatera Selatan" }, value: 17 },
  { name: { en: "Jambi", id: "Jambi" }, value: 0 },
  { name: { en: "Riau", id: "Riau" }, value: 0 },
];

export const SOURCES: { label: string; href: string }[] = [
  {
    label: "SiPongi via Databoks: 22,293 hotspots, 21 Sep 2026",
    href: "https://databoks.katadata.co.id/en/demographics/statistics/56be4e3d12618dc/22293-hotspots-detected-across-indonesia-in-the-last-24-hours-monday-21-september-2026",
  },
  {
    label: "SiPongi via Databoks: 20,802 hotspots, 20 Sep 2026",
    href: "https://databoks.katadata.co.id/en/demographics/statistics/9c6e8e7f4b88f0b/ministry-of-forestry-indonesia-recorded-20802-hotspots-in-last-24-hours-sunday-20-september-2026",
  },
  {
    label: "SiPongi via Databoks: 15,085 hotspots, 4 Oct 2026",
    href: "https://databoks.katadata.co.id/en/demographics/statistics/afd23b6bdc1a7fb/ministry-of-forestry-indonesia-recorded-15085-hotspots-in-last-24-hours-sunday-4-october-2026",
  },
  {
    label: "Databoks: priority provinces, 21–22 Sep 2026",
    href: "https://databoks.katadata.co.id/datapublish/2026/09/23/update-hotspot-di-6-provinsi-prioritas-penanganan-karhutla-21-september-2026",
  },
  { label: "NASA FIRMS (active fire data)", href: "https://firms.modaps.eosdis.nasa.gov/" },
  {
    label: "IPB: early-warning app for Masyarakat Peduli Api",
    href: "https://repository.ipb.ac.id/handle/123456789/174049?show=full",
  },
];

/** Flat copy dictionary. Components call t("key"). */
export const C = {
  back: { en: "← portfolio", id: "← portofolio" },
  langAria: { en: "Language", id: "Bahasa" },
  chapters: { en: "Chapters", id: "Bab" },
  scroll: { en: "scroll", id: "gulir" },

  // nav labels
  nav1: { en: "The sky", id: "Langit" },
  nav2: { en: "Hotspot", id: "Titik panas" },
  nav3: { en: "Where", id: "Di mana" },
  nav4: { en: "Why there", id: "Mengapa" },
  nav5: { en: "The smoke", id: "Asap" },
  nav6: { en: "People", id: "Manusia" },
  nav7: { en: "You", id: "Kamu" },

  // 1 · hero
  heroKicker: { en: "Karhutla · Indonesia · dry season 2026", id: "Karhutla · Indonesia · kemarau 2026" },
  heroTitle: { en: "The fire is the last chapter.", id: "Api hanyalah bab terakhir." },
  heroLead: {
    en: "In a single day this September, satellites saw this many heat signals across Indonesia:",
    id: "Dalam satu hari di bulan September ini, satelit menangkap sinyal panas sebanyak ini di seluruh Indonesia:",
  },
  heroUnit: { en: "hotspots in 24 hours", id: "titik panas dalam 24 jam" },
  heroSource: { en: "SiPongi · Ministry of Forestry · 21 Sep 2026", id: "SiPongi · Kementerian Kehutanan · 21 Sep 2026" },
  heroTail: {
    en: "But a hotspot is not a fire. Let's find out what it really is, and what happens long before it appears.",
    id: "Tapi titik panas bukan api. Mari kita lihat apa sebenarnya ia, dan apa yang terjadi jauh sebelum ia muncul.",
  },

  // 2 · hotspot
  c2Kicker: { en: "Chapter 1 · What is a hotspot?", id: "Bab 1 · Apa itu titik panas?" },
  c2Title: { en: "A pixel that runs hot.", id: "Sebuah piksel yang terlalu panas." },
  c2Body: {
    en: "A satellite sweeps the land in a grid of small pixels and measures heat from each one. A pixel far hotter than its neighbours becomes a hotspot. That is all it is: a heat anomaly. The Ministry of Forestry says it cannot be equated with a single fire, or with area burned.",
    id: "Satelit menyapu daratan dalam kotak-kotak piksel kecil dan mengukur panas tiap piksel. Piksel yang jauh lebih panas dari sekitarnya menjadi titik panas. Hanya itu: anomali suhu. Kementerian Kehutanan menegaskan angkanya tidak sama dengan satu kejadian api, apalagi luas terbakar.",
  },
  c2Hint: { en: "Tap a pixel to inspect it. Values are illustrative.", id: "Ketuk sebuah piksel untuk memeriksanya. Nilai bersifat ilustrasi." },
  c2Temp: { en: "Brightness temperature", id: "Suhu kecerahan" },
  c2None: { en: "Select a pixel on the grid.", id: "Pilih satu piksel pada kotak." },
  conf_h: { en: "High confidence", id: "Keyakinan tinggi" },
  conf_n: { en: "Medium confidence", id: "Keyakinan sedang" },
  conf_l: { en: "Low confidence", id: "Keyakinan rendah" },
  conf_c: { en: "Background", id: "Latar" },
  conf_h_d: {
    en: "Strongly hotter than its surroundings. Most likely active burning, though the number alone does not say how big or how long.",
    id: "Jauh lebih panas dari sekitarnya. Kemungkinan besar pembakaran aktif, namun angkanya tidak menunjukkan seberapa luas atau lama.",
  },
  conf_n_d: {
    en: "Hotter than normal, but could be a small fire, a field burn, or a hot surface. Needs a second look.",
    id: "Lebih panas dari normal, tapi bisa berupa api kecil, pembakaran lahan, atau permukaan panas. Perlu dicek ulang.",
  },
  conf_l_d: {
    en: "Barely above background. Could be sun-heated bare ground or an industrial heat source rather than a wildfire.",
    id: "Hanya sedikit di atas latar. Bisa tanah gersang yang terpanggang matahari atau sumber panas industri, bukan kebakaran hutan.",
  },
  conf_c_d: { en: "Normal ground temperature. Nothing to flag.", id: "Suhu tanah normal. Tidak ada yang ditandai." },

  // 3 · map
  c3Kicker: { en: "Chapter 2 · Where it burns", id: "Bab 2 · Di mana api membara" },
  c3Title: { en: "One province carried the day.", id: "Satu provinsi memikul hari itu." },
  c3Body: {
    en: "On 20 September, Central Kalimantan alone held 11,011 of the 20,802 hotspots in the country. Most of the dots below are medium confidence: the satellite is suspicious, not certain.",
    id: "Pada 20 September, Kalimantan Tengah sendiri memuat 11.011 dari 20.802 titik panas di seluruh negeri. Sebagian besar titik di bawah berkeyakinan sedang: satelit curiga, belum pasti.",
  },
  c3MapNote: {
    en: "Schematic map. Dot positions are illustrative; each dot stands for ~50 hotspots, split by the real confidence mix of 4 Oct 2026.",
    id: "Peta skematis. Posisi titik bersifat ilustrasi; tiap titik mewakili ±50 titik panas, dibagi sesuai komposisi keyakinan nyata 4 Okt 2026.",
  },
  c3Filter: { en: "Confidence", id: "Keyakinan" },
  c3Shown: { en: "hotspots shown (4 Oct 2026)", id: "titik panas ditampilkan (4 Okt 2026)" },
  c3Bars: { en: "High-confidence hotspots · priority provinces · 22 Sep 2026", id: "Titik panas keyakinan tinggi · provinsi prioritas · 22 Sep 2026" },
  c3Zero: { en: "none", id: "nihil" },
  lblKal: { en: "Kalimantan", id: "Kalimantan" },
  lblSum: { en: "Sumatra", id: "Sumatera" },
  lblJav: { en: "Java", id: "Jawa" },
  lblSul: { en: "Sulawesi", id: "Sulawesi" },
  lblPap: { en: "Papua", id: "Papua" },

  // 4 · peat
  c4Kicker: { en: "Chapter 3 · Why there", id: "Bab 3 · Mengapa di sana" },
  c4Title: { en: "It burns from below.", id: "Ia terbakar dari bawah." },
  c4Hint: { en: "Scroll to move the story. The model is a cutaway, not to scale.", id: "Gulir untuk menggerakkan cerita. Model berupa potongan, tidak berskala." },
  p1T: { en: "A swamp that behaves like a sponge", id: "Rawa yang bekerja seperti spons" },
  p1B: {
    en: "Peatland is soil made of centuries of dead plants, kept wet by a high water table. Wet peat does not burn.",
    id: "Gambut adalah tanah dari tumpukan tumbuhan mati selama berabad-abad, dijaga basah oleh muka air yang tinggi. Gambut basah tidak terbakar.",
  },
  p2T: { en: "Canals let the water out", id: "Kanal membuang airnya" },
  p2B: {
    en: "Drainage canals cut through the peat. The water table sinks and the top layer is left dry, like a sponge squeezed out.",
    id: "Kanal drainase membelah gambut. Muka air turun dan lapisan atas mengering, seperti spons yang diperas.",
  },
  p3T: { en: "The dry season does the rest", id: "Kemarau menyelesaikan sisanya" },
  p3B: {
    en: "Trees dry and thin out. The dried peat is now fuel, stacked metres deep.",
    id: "Pohon mengering dan menjarang. Gambut kering kini menjadi bahan bakar, bertumpuk hingga bermeter-meter.",
  },
  p4T: { en: "One spark is enough", id: "Satu percikan sudah cukup" },
  p4B: {
    en: "A field burn, a dropped ember, a lit cigarette. The surface catches first.",
    id: "Pembakaran lahan, bara yang jatuh, puntung rokok. Permukaan terbakar lebih dulu.",
  },
  p5T: { en: "Then it goes underground", id: "Lalu ia merambat ke bawah tanah" },
  p5B: {
    en: "The fire creeps down into the dry peat and smoulders there, producing thick smoke even after the flames at the surface are gone. It stops only where the peat is wet again.",
    id: "Api merambat turun ke gambut kering dan membara di sana, menghasilkan asap pekat meski nyala di permukaan sudah padam. Ia berhenti hanya ketika gambut kembali basah.",
  },
  legWater: { en: "Water table", id: "Muka air" },
  legPeat: { en: "Peat", id: "Gambut" },
  legFire: { en: "Smouldering", id: "Membara" },
  noGl: {
    en: "Your browser could not start 3D graphics, so the model is not shown. The five steps above still tell the story.",
    id: "Peramban kamu tidak dapat menjalankan grafis 3D, sehingga model tidak ditampilkan. Kelima langkah di atas tetap menceritakan kisahnya.",
  },

  // 5 · smoke
  c5Kicker: { en: "Chapter 4 · The smoke travels", id: "Bab 4 · Asap menjalar" },
  c5Title: { en: "The haze doesn't stop at the border.", id: "Kabut asap tidak berhenti di perbatasan." },
  c5Body: {
    en: "In the dry season the prevailing wind over Sumatra and Kalimantan blows from the south-east, carrying smoke towards the Malacca Strait, the Malay Peninsula and Singapore. Peat smoke is rich in PM2.5, particles small enough to reach deep into the lungs.",
    id: "Di musim kemarau, angin dominan di atas Sumatera dan Kalimantan bertiup dari tenggara, membawa asap ke arah Selat Malaka, Semenanjung Malaysia, dan Singapura. Asap gambut kaya PM2,5, partikel yang cukup kecil untuk masuk jauh ke dalam paru-paru.",
  },
  wind: { en: "Dry-season wind", id: "Angin musim kemarau" },
  lblMY: { en: "Malay Peninsula", id: "Semenanjung Malaysia" },
  ispuTitle: { en: "How does the air feel? Slide the ISPU index.", id: "Seperti apa udaranya? Geser indeks ISPU." },
  ispuIndex: { en: "ISPU", id: "ISPU" },
  ispu0: { en: "Good", id: "Baik" },
  ispu1: { en: "Moderate", id: "Sedang" },
  ispu2: { en: "Unhealthy", id: "Tidak sehat" },
  ispu3: { en: "Very unhealthy", id: "Sangat tidak sehat" },
  ispu4: { en: "Hazardous", id: "Berbahaya" },
  ispu0d: { en: "Go about your day normally.", id: "Beraktivitas seperti biasa." },
  ispu1d: {
    en: "Fine for most people. Very sensitive people should watch for symptoms.",
    id: "Aman bagi kebanyakan orang. Kelompok yang sangat sensitif perlu waspada gejala.",
  },
  ispu2d: {
    en: "Sensitive groups (children, elderly, asthma, heart disease) should limit time outdoors. Wear a well-fitting mask outside.",
    id: "Kelompok sensitif (anak, lansia, asma, jantung) sebaiknya kurangi di luar ruangan. Pakai masker yang pas saat keluar.",
  },
  ispu3d: {
    en: "Everyone should reduce outdoor activity. Keep windows closed; wear a mask rated for fine particles if you must go out.",
    id: "Semua orang sebaiknya mengurangi aktivitas luar ruangan. Tutup jendela; pakai masker untuk partikel halus bila harus keluar.",
  },
  ispu4d: {
    en: "Stay indoors, use clean-air rooms if available, and follow local guidance. Seek care for breathing difficulty.",
    id: "Tetap di dalam ruangan, gunakan ruang udara bersih bila ada, dan ikuti arahan setempat. Cari pertolongan medis bila sesak napas.",
  },
  ispuNote: {
    en: "Categories follow the Indonesian ISPU scale. Advice is general, not medical guidance.",
    id: "Kategori mengikuti skala ISPU Indonesia. Saran bersifat umum, bukan nasihat medis.",
  },

  // 6 · people
  c6Kicker: { en: "Chapter 5 · The people in it", id: "Bab 5 · Orang-orang di dalamnya" },
  c6Title: { en: "A day inside the haze.", id: "Sehari di dalam kabut." },
  c6Note: {
    en: "Illustrative composites. These are not real people or quotes; they show situations that fire seasons create.",
    id: "Komposit ilustratif. Mereka bukan orang sungguhan dan bukan kutipan nyata; hanya menggambarkan situasi yang muncul di musim api.",
  },
  pe1T: { en: "The village fire volunteer", id: "Relawan api desa" },
  pe1B: {
    en: "Walks the edge of the peat at dawn, checking canals and watching for smoke. Villagers like this are organised as Masyarakat Peduli Api (MPA), the first people to see a small fire while it is still small.",
    id: "Menyusuri tepi gambut saat fajar, memeriksa kanal dan mencari asap. Warga seperti ini terhimpun dalam Masyarakat Peduli Api (MPA), orang pertama yang melihat api kecil selagi masih kecil.",
  },
  pe2T: { en: "The student at the window", id: "Pelajar di jendela" },
  pe2B: {
    en: "The sky is orange at 9 a.m. and the school asks everyone to wear masks. Children breathe faster than adults, so the same air costs them more.",
    id: "Langit jingga pukul 9 pagi dan sekolah meminta semua memakai masker. Anak bernapas lebih cepat dari orang dewasa, jadi udara yang sama lebih berat bagi mereka.",
  },
  pe3T: { en: "The smallholder at the canal", id: "Petani kecil di tepi kanal" },
  pe3B: {
    en: "Fire is the cheapest way to clear a field, and the dry peat makes it easy. A stray ember can outrun the plan. Rewetting the peat protects his land too.",
    id: "Api adalah cara termurah membuka lahan, dan gambut kering membuatnya mudah. Satu bara liar bisa melampaui rencana. Membasahi kembali gambut juga melindungi lahannya sendiri.",
  },

  // 7 · action
  c7Kicker: { en: "Chapter 6 · What you can do", id: "Bab 6 · Yang bisa kamu lakukan" },
  c7Title: { en: "You can't put out peat. You can change the odds.", id: "Kamu tak bisa memadamkan gambut. Tapi kamu bisa mengubah peluangnya." },
  a1T: { en: "Stay safe", id: "Jaga diri" },
  a1B: {
    en: "Check your local ISPU. Keep a fitted mask at home. Close windows on bad days, and look after children and elders first.",
    id: "Cek ISPU di daerahmu. Siapkan masker yang pas di rumah. Tutup jendela di hari buruk, dan utamakan anak serta lansia.",
  },
  a2T: { en: "Speak up", id: "Bersuara" },
  a2B: {
    en: "Never burn land or rubbish in dry season. If you see smoke, report it to the village head, the local BPBD or the Manggala Agni brigade with where, when and a photo.",
    id: "Jangan membakar lahan atau sampah di musim kemarau. Bila melihat asap, laporkan ke kepala desa, BPBD setempat, atau regu Manggala Agni: di mana, kapan, dan sertakan foto.",
  },
  a3T: { en: "Read the number", id: "Baca angkanya" },
  a3B: {
    en: "Treat a hotspot count as a warning light, not a body count. Ask for confidence level, area, and the source before sharing a headline.",
    id: "Anggap jumlah titik panas sebagai lampu peringatan, bukan hitungan korban. Tanyakan tingkat keyakinan, luas, dan sumbernya sebelum membagikan judul berita.",
  },
  quizTitle: { en: "Read the number: three quick checks", id: "Baca angkanya: tiga uji cepat" },
  qTrue: { en: "True", id: "Benar" },
  qFalse: { en: "False", id: "Salah" },
  qRight: { en: "Right.", id: "Tepat." },
  qWrong: { en: "Not quite.", id: "Belum tepat." },
  qAgain: { en: "Try again", id: "Ulangi" },
  q1: { en: "22,293 hotspots means 22,293 separate fires.", id: "22.293 titik panas berarti 22.293 kebakaran terpisah." },
  q1e: {
    en: "False. A hotspot is a satellite heat anomaly; it cannot be equated with one fire or area burned.",
    id: "Salah. Titik panas adalah anomali suhu dari satelit; tidak bisa disamakan dengan satu kebakaran atau luas terbakar.",
  },
  q2: { en: "A high-confidence hotspot is more likely to be real burning than a low-confidence one.", id: "Titik panas berkeyakinan tinggi lebih mungkin pembakaran nyata daripada yang berkeyakinan rendah." },
  q2e: { en: "True. Confidence reflects how strongly the pixel stands out from its surroundings.", id: "Benar. Keyakinan mencerminkan seberapa kuat piksel itu menonjol dari sekitarnya." },
  q3: { en: "When the flames at the surface are gone, a peat fire is out.", id: "Ketika nyala di permukaan padam, api gambut sudah mati." },
  q3e: { en: "False. Peat can smoulder underground and keep producing smoke until it reaches wet peat.", id: "Salah. Gambut bisa membara di bawah tanah dan terus berasap sampai bertemu gambut basah." },
  liveTitle: { en: "Live from NASA FIRMS", id: "Langsung dari NASA FIRMS" },
  liveLoading: { en: "Checking the satellite feed…", id: "Memeriksa data satelit…" },
  liveOff: {
    en: "The live feed is switched off on this deployment. Set FIRMS_MAP_KEY (a free key from NASA FIRMS) to turn it on.",
    id: "Data langsung dimatikan pada deployment ini. Setel FIRMS_MAP_KEY (kunci gratis dari NASA FIRMS) untuk mengaktifkannya.",
  },
  liveErr: { en: "The satellite feed could not be reached right now.", id: "Data satelit tidak dapat dijangkau saat ini." },
  liveBody: { en: "VIIRS detections over Indonesia, last 24 hours", id: "Deteksi VIIRS di Indonesia, 24 jam terakhir" },
  liveTotal: { en: "detections", id: "deteksi" },

  // footer
  foot: { en: "Sources and caveats", id: "Sumber dan catatan" },
  footNote: {
    en: "Hotspots are satellite heat detections, not confirmed fires or burned area. Maps, pixel values and 3D models here are illustrations built to explain; national figures are quoted from the sources below.",
    id: "Titik panas adalah deteksi suhu satelit, bukan kebakaran terkonfirmasi atau luas terbakar. Peta, nilai piksel, dan model 3D di sini adalah ilustrasi untuk menjelaskan; angka nasional dikutip dari sumber di bawah.",
  },
} satisfies Record<string, L>;

export type Key = keyof typeof C;

// ───────────────────────────── map geometry ─────────────────────────────

/** lon/lat → SVG. 20 px per degree; lon 94–142, lat 8 to -11. */
export const MAP = { w: 960, h: 380, lon0: 94, lat0: 8, k: 20 };
export const px = (lon: number, lat: number): [number, number] => [(lon - MAP.lon0) * MAP.k, (MAP.lat0 - lat) * MAP.k];

type LL = [number, number][];
const sumatra: LL = [[95.3, 5.6], [97.4, 5.3], [98.7, 3.8], [100.5, 2.2], [103.3, 0.8], [104.3, -1.0], [106.0, -3.2], [105.9, -5.8], [104.6, -5.9], [102.3, -4.0], [100.4, -1.6], [99.0, 0.5], [97.5, 2.5], [95.5, 4.8]];
const borneo: LL = [[109.0, 1.9], [111.5, 1.6], [113.8, 3.7], [115.8, 5.0], [117.0, 6.9], [119.2, 5.3], [117.6, 3.5], [117.8, 1.0], [116.5, -1.5], [116.2, -3.5], [114.5, -4.0], [111.8, -3.3], [110.2, -2.9], [109.9, -1.0], [109.0, 0.5]];
const java: LL = [[105.2, -6.8], [108.0, -6.3], [110.5, -6.8], [112.8, -6.9], [114.5, -7.8], [114.5, -8.7], [111.0, -8.3], [108.0, -7.8], [105.5, -7.0]];
const sulawesi: LL = [[120.0, 1.0], [122.0, 1.0], [125.0, 1.5], [124.0, 0.5], [121.6, 0.4], [121.8, -1.0], [123.3, -0.9], [123.0, -2.0], [122.5, -4.8], [121.5, -4.5], [121.0, -3.0], [120.3, -5.5], [119.5, -5.5], [119.6, -3.0], [118.8, -2.8], [119.8, 0.0]];
const papua: LL = [[131.0, -0.8], [134.0, -0.5], [137.0, -1.5], [141.0, -2.6], [141.0, -9.0], [138.5, -8.3], [137.5, -5.5], [135.0, -4.2], [133.0, -4.0], [132.5, -2.8], [131.0, -1.5]];
const peninsula: LL = [[100.3, 6.3], [102.2, 6.2], [103.4, 4.5], [103.5, 2.5], [104.2, 1.4], [103.3, 1.3], [101.3, 2.8], [100.4, 4.3], [100.1, 6.0]];

export const ISLANDS = { sumatra, borneo, java, sulawesi, papua };
export const NEIGHBOURS = { peninsula };

const toPath = (pts: LL) => "M" + pts.map(([lo, la]) => px(lo, la).map((n) => n.toFixed(1)).join(",")).join("L") + "Z";
export const PATHS: Record<string, string> = Object.fromEntries(
  Object.entries({ ...ISLANDS, ...NEIGHBOURS }).map(([k, v]) => [k, toPath(v)]),
);

function inside(pt: [number, number], poly: LL): boolean {
  const [x, y] = pt;
  let c = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i];
    const [xj, yj] = poly[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c;
  }
  return c;
}

function rng(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export type Conf = "h" | "n" | "l";
export type Dot = { x: number; y: number; c: Conf; d: number };

// Where the dots cluster: [lon, lat, spread, weight, island polygon]
const CLUSTERS: [number, number, number, number, LL][] = [
  [113.6, -2.4, 0.9, 0.46, borneo], // Central Kalimantan
  [115.2, -3.0, 0.5, 0.07, borneo], // South Kalimantan
  [110.6, -0.4, 0.6, 0.1, borneo], // West Kalimantan
  [104.2, -3.2, 0.7, 0.1, sumatra], // South Sumatra
  [102.0, -0.6, 0.6, 0.07, sumatra], // Riau / Jambi
  [138.5, -7.6, 0.9, 0.08, papua], // southern Papua
  [121.5, -3.0, 0.7, 0.04, sulawesi],
  [110.5, -7.5, 0.5, 0.02, java],
];

/** ~300 dots at ~50 hotspots each, confidence split from the real 4 Oct 2026 mix. */
function makeDots(): Dot[] {
  const r = rng(2610);
  const N = 300;
  const { high, medium, low } = FIGURES.confidence;
  const total = high + medium + low;
  const nH = Math.round((high / total) * N);
  const nL = Math.round((low / total) * N);
  const dots: Dot[] = [];
  const sum = CLUSTERS.reduce((a, c) => a + c[3], 0);
  const gauss = () => (r() + r() + r() + r() - 2) / 0.58;
  while (dots.length < N) {
    let pick = r() * sum;
    const cl = CLUSTERS.find((c) => (pick -= c[3]) <= 0) ?? CLUSTERS[0];
    const lo = cl[0] + gauss() * cl[2];
    const la = cl[1] + gauss() * cl[2] * 0.8;
    if (!inside([lo, la], cl[4])) continue;
    const [x, y] = px(lo, la);
    dots.push({ x, y, c: "n", d: r() * 2 });
  }
  // The highest-confidence dots concentrate in the biggest cluster (first dots drawn).
  dots.slice(0, nH).forEach((d) => (d.c = "h"));
  dots.slice(N - nL).forEach((d) => (d.c = "l"));
  return dots.sort((a, b) => a.d - b.d);
}
export const DOTS: Dot[] = makeDots();
export const DOT_WEIGHT = Math.round(FIGURES.latest / DOTS.length);

export const CONF_COLOR: Record<Conf, string> = { h: "#ff4d1c", n: "#ffb347", l: "#9aa7b4" };

/** ISPU bands (Indonesian air standard index). */
export const ISPU = [
  { max: 50, color: "#2fb65f", name: "ispu0", desc: "ispu0d" },
  { max: 100, color: "#2f7fd8", name: "ispu1", desc: "ispu1d" },
  { max: 200, color: "#e9c43a", name: "ispu2", desc: "ispu2d" },
  { max: 300, color: "#e04a3a", name: "ispu3", desc: "ispu3d" },
  { max: 500, color: "#1b1b1f", name: "ispu4", desc: "ispu4d" },
] as const satisfies readonly { max: number; color: string; name: Key; desc: Key }[];

/** Pixels of the "satellite view": [temperature K, confidence]. Illustrative. */
export type Pixel = { k: number; c: Conf | "c" };
export const GRID_W = 12;
export const GRID_H = 7;
export const GRID: Pixel[] = (() => {
  const r = rng(77);
  const out: Pixel[] = [];
  const hot: Record<string, Pixel> = {
    "7,3": { k: 361, c: "h" },
    "6,3": { k: 344, c: "h" },
    "7,4": { k: 337, c: "h" },
    "3,2": { k: 322, c: "n" },
    "9,1": { k: 318, c: "n" },
    "10,5": { k: 314, c: "l" },
    "1,5": { k: 311, c: "l" },
  };
  for (let y = 0; y < GRID_H; y++)
    for (let x = 0; x < GRID_W; x++) out.push(hot[`${x},${y}`] ?? { k: Math.round(298 + r() * 6), c: "c" });
  return out;
})();
