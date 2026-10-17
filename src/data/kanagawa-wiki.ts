/**
 * Wiki content for the Kanagawa page, in English, Indonesian and Japanese.
 * Every entry is drawn in ASCII. The art is language-neutral (numbers, romaji
 * and proper nouns only); the explanations live in the translated text.
 *
 * Facts come from the sources listed on each entry (Met Museum essay, British
 * Museum, Harvard Art Museums, Daily Art, The Art Newspaper, PMC/ResearchGate
 * wave papers, ...). Claims that rest on a single source are flagged "warn".
 */

export type Lang = "en" | "id" | "ja";
export type T = Record<Lang, string>;
export const LANGS: { id: Lang; label: string; name: string }[] = [
  { id: "en", label: "EN", name: "English" },
  { id: "id", label: "ID", name: "Bahasa Indonesia" },
  { id: "ja", label: "JA", name: "日本語" },
];

const t = (en: string, id: string, ja: string): T => ({ en, id, ja });

export type Tone = "sea" | "fuji" | "gold" | "ink";

export type Block =
  | { t: "art"; tone: Tone; lines: string[] }
  | { t: "h"; text: T }
  | { t: "p"; text: T }
  | { t: "kv"; rows: [T, T][] }
  | { t: "quote"; text: T; by: T }
  | { t: "warn"; text: T };

export type Source = { label: string; url: string };

export type Entry = {
  id: string;
  num: string;
  title: T;
  sub: T;
  blocks: Block[];
  sources: Source[];
};

/** A spot on the print. (u, v) is the position in the picture, r the radius as a fraction of its width. */
export type Hotspot = {
  id: string;
  entry: string;
  num: string;
  label: T;
  u: number;
  v: number;
  r: number;
  note?: T;
};

/** What the wave canvas needs to draw a marker. */
export type Spot = { id: string; num: string; label: string; u: number; v: number; r: number };

/** Interface strings. */
export const UI: Record<
  Lang,
  {
    open: string;
    index: string;
    prev: string;
    next: string;
    close: string;
    prevAria: string;
    nextAria: string;
    closeAria: string;
    panelAria: string;
    sources: string;
    introA: string;
    introB: string;
    footer: string;
    langAria: string;
  }
> = {
  en: {
    open: "[ WIKI ] 9 entries",
    index: "index",
    prev: "< prev",
    next: "next >",
    close: "x esc",
    prevAria: "Previous entry",
    nextAria: "Next entry",
    closeAria: "Close wiki",
    panelAria: "Kanagawa wiki",
    sources: "sources",
    introA: "The Great Wave off Kanagawa, nine entries.",
    introB: "Click a gold marker on the print, or pick one:",
    footer: "Hokusai, c. 1831 (public domain) · click the gold markers for the wiki · move to light the lantern",
    langAria: "Language",
  },
  id: {
    open: "[ WIKI ] 9 entri",
    index: "indeks",
    prev: "< sebelumnya",
    next: "lanjut >",
    close: "x esc",
    prevAria: "Entri sebelumnya",
    nextAria: "Entri berikutnya",
    closeAria: "Tutup wiki",
    panelAria: "Wiki Kanagawa",
    sources: "sumber",
    introA: "The Great Wave off Kanagawa, sembilan entri.",
    introB: "Klik penanda emas pada cetakan, atau pilih satu:",
    footer: "Hokusai, sekitar 1831 (domain publik) · klik penanda emas untuk membuka wiki · gerakkan penunjuk untuk menyalakan lentera",
    langAria: "Bahasa",
  },
  ja: {
    open: "[ 解説 ] 9項目",
    index: "目次",
    prev: "< 前へ",
    next: "次へ >",
    close: "x esc",
    prevAria: "前の項目",
    nextAria: "次の項目",
    closeAria: "解説を閉じる",
    panelAria: "神奈川沖浪裏の解説",
    sources: "出典",
    introA: "神奈川沖浪裏、全9項目。",
    introB: "版画上の金色の印をクリックするか、次から選んでください:",
    footer: "北斎、1831年頃(パブリックドメイン) · 金色の印をクリックして解説を開く · ポインタを動かすと提灯が灯る",
    langAria: "言語",
  },
};

const art = (s: string) => s.replace(/^\n/, "").replace(/\s+$/, "").split("\n");

// Display width: kanji and kana take two columns in the panel.
const WIDE = /[ᄀ-ᅟ⺀-꓏가-힣豈-﫿︰-﹯＀-｠￠-￦]/;
export const cols = (s: string) => [...s].reduce((n, c) => n + (WIDE.test(c) ? 2 : 1), 0);
export const isWide = (c: string) => WIDE.test(c);
const padW = (s: string, w: number) => s + " ".repeat(Math.max(0, w - cols(s)));

const WAVE_ART = art(String.raw`
                    _.---~~~~---._
               _.-~'  *  '  *  '  '~-._     ,~,~,
           _.-'  '   *   '   *    '   '-. ,*'*'*,
        .-'  *   '    _.--~~~~--._  *    '/'*\*'/
      .'  '   *    .-'            '-.  '  \'*/~'
     /  *   '   * .'                '.  *   '~'
    ;  '   *   ' /     (nami ura)     \   '
    |   *   '   ;                     ;  *
     \_  *   '   \                   /  _/
  ~~~~~'-.__ *  ' '-._           _.-'_.-'~~~~~~~
         ~~~'-.______'-._______.-'~~~
`);

const WAVE_GAUGE = art(String.raw`
   ~10 m             12-15 m
     |  ____
     | /    \
     |/  ~~~ \              ___/\___
 10 m||  ~~~  |      ______/        \______
     |\  ~~~ /
     | \____/
   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
`);

const CLAW_ART = art(String.raw`
         ,-.     ,-.     ,-.     ,-.     ,-.
        ( * )   ( * )   ( * )   ( * )   ( * )
         '\/     '\/     '\/     '\/     '\/
      ~~-._\_/-._\_/-._\_/-._\_/-._\_/-._\_/~~
`);

const CLAW_FRACTAL = art(String.raw`
   x1                       Y
   x2                     Y   Y
   x3                   Y Y   Y Y
   x4                 YY YY   YY YY
`);

const FUJI_ART = art(String.raw`
                        /\
                       /**\
                      /*'*'\          3,776 m
                     /_/\/\_\
                    /        \
                   /          \
  ~~~~~~~~~~~~~~~~/____________\~~~~~~~~~~~~~~~~
`);

const FUJI_FRAME = art(String.raw`
          _.--~~~~~~--._
        .'  *  '  *  '  '.
       /       /\          \
      ;       /**\          ;
      |      /_/\_\         |
      ;                     ;
       \  ~~~~~~~~~~~~~~~~ /
  ~~~~~~'-.______________.-'~~~~~~
`);

const HORIZON_ART = art(String.raw`
   EU                   HOKUSAI
   ........             ..../\/\.....
   .      .             .  /    \   .
   .~~~~~~.             . /      \  .
   -------------        ~~~~~~~~~~~~~~~
`);

const BOAT_ART = art(String.raw`
            o  o  o  o  o  o  o  o
         __/\_/\_/\_/\_/\_/\_/\_/\__
   _____/___________________________\_____
  <_______________________________________>
 ~~~~~'~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~'~~~~
`);

const ROUTE_ART = art(String.raw`
   IZU / BOSO  ------------>  EDO BAY
        |                           ^
        |                           |
        '-----[ oshiokuri-bune ]----'
`);

const BLUE_STACK = art(String.raw`
   K ........ ||||||||||||
   1 ........ ############
   2 ........ ============
`);

const BLUE_ROUTE = art(String.raw`
   BERLIN 1706 ------> DEJIMA ------> EDO 1831
                       Nagasaki        bero-ai
`);

const TITLE_ROWS: [string, string, string][] = [
  ["A", "Fugaku sanjurokkei", "富嶽三十六景"],
  ["B", "Kanagawa oki nami ura", "神奈川沖浪裏"],
  ["C", "Hokusai aratame Iitsu hitsu", "北斎改為一筆"],
];
const TITLE_ART = [
  "  .--------------------------------------------.",
  ...TITLE_ROWS.map(([k, r, j]) => `  |  ${k}  ${padW(r, 27)} ${j}  |`),
  "  '--------------------------------------------'",
];

const PROCESS_ART = art(String.raw`
   [1] ------> [2] ------> [3] ------> [4]
                |            |            |
                v            v            v
              |||||        #####        =====
`);

const SCIENCE_ART = art(String.raw`
   phi = 1.618
   +-----------------+----------+
   |                 |          |
   |        A        |    B     |
   |                 +----+-----+
   |                 | C  |
   +-----------------+----+
`);

const LEGACY_ART = art(String.raw`
   1831 ------- 1888 ------- 1905 ------- 2024
    |            |            |            |
    *            *            *            *
`);

export const ENTRIES: Entry[] = [
  {
    id: "wave",
    num: "01",
    title: t("THE WAVE", "OMBAK BESAR", "大波"),
    sub: t("nami / the breaking crest", "nami / puncak ombak yang pecah", "波 / 砕けようとする波頭"),
    blocks: [
      { t: "art", tone: "sea", lines: WAVE_ART },
      {
        t: "p",
        text: t(
          "A wave about to break, towering over three boats. Some estimates put it as tall as 10 metres (about 33 feet).",
          "Ombak yang hampir pecah, menjulang di atas tiga perahu. Beberapa perkiraan menyebut tingginya mencapai 10 meter (sekitar 33 kaki).",
          "今にも砕けそうな大波が、三艘の舟の上にそびえ立っています。高さは10メートル(約33フィート)に達するという推定もあります。",
        ),
      },
      { t: "art", tone: "sea", lines: WAVE_GAUGE },
      {
        t: "kv",
        rows: [
          [
            t("KIND", "JENIS", "種類"),
            t(
              "plunging breaker or rogue wave, not a tsunami",
              "ombak pecah menukik atau gelombang liar, bukan tsunami",
              "巻き波、または巨大波。津波ではない",
            ),
          ],
          [
            t("MOMENT", "MOMEN", "瞬間"),
            t("the instant before the lip falls", "sesaat sebelum puncaknya jatuh", "波頭が崩れ落ちる直前"),
          ],
        ],
      },
      { t: "h", text: t("tsunami? probably not", "tsunami? kemungkinan besar bukan", "津波ではないのか") },
      {
        t: "p",
        text: t(
          "The wave is often called a tsunami. Physicists disagree: a 2009 analysis (Cartwright and Nakamura) concluded the picture far more likely shows an extreme plunging breaker, a big storm wave on the point of breaking over the boats. Other writers call it a rogue wave. A tsunami does not curl like this.",
          "Ombak ini sering disebut tsunami. Para fisikawan tidak setuju: analisis tahun 2009 (Cartwright dan Nakamura) menyimpulkan bahwa gambar ini jauh lebih mungkin menunjukkan ombak pecah menukik yang ekstrem, yaitu ombak badai besar yang hendak pecah di atas perahu-perahu itu. Penulis lain menyebutnya gelombang liar (rogue wave). Tsunami tidak melengkung seperti ini.",
          "この波はよく津波だと言われます。しかし物理学者の見解は異なります。2009年の分析(CartwrightとNakamura)は、これは極端な巻き波、つまり舟の上で砕けようとする大きな嵐の波である可能性がはるかに高いと結論づけました。巨大波(ローグウェーブ)と呼ぶ研究者もいます。津波はこのようには巻きません。",
        ),
      },
      { t: "h", text: t("what does the title mean?", "apa arti judulnya?", "題名の意味は?") },
      {
        t: "p",
        text: t(
          "Kanagawa oki nami ura. Museums translate nami ura differently: \"Under the Wave off Kanagawa\" (Harvard), \"The Hollow of the Deep Sea Wave off Kanagawa\" (Bristol Museums).",
          "Kanagawa oki nami ura. Museum menerjemahkan nami ura dengan berbeda-beda, misalnya \"Under the Wave off Kanagawa\" (Harvard) dan \"The Hollow of the Deep Sea Wave off Kanagawa\" (Bristol Museums).",
          "題名は「神奈川沖浪裏」。浪裏の英訳は美術館ごとに異なり、ハーバード美術館は \"Under the Wave off Kanagawa\"、ブリストル博物館は \"The Hollow of the Deep Sea Wave off Kanagawa\" としています。",
        ),
      },
    ],
    sources: [
      { label: "Daily Art: Hokusai's Great Wave Explained", url: "https://www.dailyartmagazine.com/great-wave-hokusai/" },
      { label: "Cartwright & Nakamura: what kind of a wave is it?", url: "https://www.researchgate.net/publication/250902633_What_kind_of_a_wave_is_Hokusai's_Great_wave_off_Kanagawa" },
      { label: "Rogue wave analysis (PMC)", url: "https://www.ncbi.nlm.nih.gov/pmc/articles/PMC3645210/" },
      { label: "Harvard Art Museums record", url: "https://harvardartmuseums.org/art/210190" },
    ],
  },
  {
    id: "claws",
    num: "02",
    title: t("THE CLAWS", "CAKAR OMBAK", "波の爪"),
    sub: t("the foam fingers", "jari-jari buih", "しぶきの指"),
    blocks: [
      { t: "art", tone: "sea", lines: CLAW_ART },
      {
        t: "p",
        text: t(
          "At the crest the foam splits into finger-like claws that reach down over the boats.",
          "Di puncaknya, buih terpecah menjadi cakar seperti jari yang menjulur turun ke atas perahu-perahu.",
          "波頭では泡が指のような爪に分かれ、舟の上へ伸びています。",
        ),
      },
      {
        t: "quote",
        text: t(
          "These waves are claws, and the boat is caught in them, you can feel it.",
          "Ombak-ombak ini adalah cakar, dan perahunya terperangkap di dalamnya, kita bisa merasakannya.",
          "この波は爪だ。舟はその中に捕らえられている。それが肌で感じられる。",
        ),
        by: t(
          "Vincent van Gogh to his brother Theo, 1888 (wording varies by source)",
          "Vincent van Gogh kepada adiknya Theo, 1888 (kata-katanya berbeda-beda menurut sumber)",
          "フィンセント・ファン・ゴッホが弟テオに宛てて、1888年(文言は資料により異なる)",
        ),
      },
      { t: "art", tone: "ink", lines: CLAW_FRACTAL },
      {
        t: "p",
        text: t(
          "Every finger of foam splits again into smaller fingers: the same shape at every size, like a fractal.",
          "Setiap jari buih terpecah lagi menjadi jari yang lebih kecil: bentuk yang sama di setiap ukuran, seperti fraktal.",
          "泡の指はそれぞれさらに小さな指に分かれます。どの大きさでも同じ形が現れ、フラクタルのようです。",
        ),
      },
      {
        t: "warn",
        text: t(
          "The fractal reading is a modern interpretation (a Yale maths page admires how Hokusai showed fractal aspects of nature). Nothing shows he meant it.",
          "Tafsir fraktal adalah interpretasi modern (sebuah laman matematika Yale mengagumi cara Hokusai menampilkan sifat fraktal alam). Tidak ada bukti bahwa ia memang bermaksud demikian.",
          "フラクタルという読みは現代の解釈です(イェール大学の数学ページは、北斎が自然のフラクタル的な側面を描いたと称賛しています)。北斎自身がそれを意図した証拠はありません。",
        ),
      },
    ],
    sources: [
      { label: "The Art Newspaper: Starry Night and the Great Wave", url: "https://theartnewspaper.com/2018/09/28/how-van-goghs-starry-night-was-inspired-by-hokusais-great-wave" },
      { label: "Yale: fractals in Hokusai", url: "https://gauss.math.yale.edu/public_html/People/frame/Fractals/Panorama/Art/Hokusai/Hokusai.html" },
    ],
  },
  {
    id: "fuji",
    num: "03",
    title: t("MOUNT FUJI", "GUNUNG FUJI", "富士山"),
    sub: t("Fuji-san / the small calm peak", "Fuji-san / puncak kecil yang tenang", "Fuji-san / 小さく静かな頂"),
    blocks: [
      { t: "art", tone: "fuji", lines: FUJI_ART },
      {
        t: "p",
        text: t(
          "The print belongs to Thirty-six Views of Mount Fuji, so Fuji is the nominal subject, yet it is the smallest thing in the picture: a snow-capped triangle far off, beneath the arc of the wave.",
          "Cetakan ini bagian dari seri Tiga Puluh Enam Pemandangan Gunung Fuji, jadi Fuji secara nama adalah subjeknya, namun ia justru yang terkecil di gambar: segitiga berpuncak salju di kejauhan, di bawah lengkungan ombak.",
          "この作品は「富嶽三十六景」の一枚で、名目上の主題は富士山です。しかし画面の中では最も小さく、波の弧の下の遠くに雪をいただく三角形として描かれています。",
        ),
      },
      { t: "art", tone: "fuji", lines: FUJI_FRAME },
      {
        t: "kv",
        rows: [
          [
            t("HEIGHT", "TINGGI", "標高"),
            t("3,776 m, Japan's highest mountain", "3.776 m, gunung tertinggi di Jepang", "3,776メートル。日本一高い山"),
          ],
          [
            t("ROLE", "PERAN", "役割"),
            t(
              "calm and distant against a violent foreground",
              "tenang dan jauh di balik latar depan yang ganas",
              "荒々しい手前の波に対する、静かで遠い存在",
            ),
          ],
        ],
      },
      { t: "h", text: t("a low horizon", "cakrawala yang rendah", "低い水平線") },
      {
        t: "p",
        text: t(
          "Hokusai studied European, especially Dutch, prints and took on linear perspective. His own twist is the very low horizon line: the sea rises above it, and the wave towers over Fuji.",
          "Hokusai mempelajari karya Eropa, terutama Belanda, dan mengambil perspektif linear. Sentuhan khasnya adalah garis cakrawala yang sangat rendah: laut naik di atasnya, dan ombak menjulang di atas Fuji.",
          "北斎はヨーロッパ、特にオランダの版画を学び、線遠近法を取り入れました。独自の工夫は非常に低い水平線です。海は水平線より高くせり上がり、波は富士の上にそびえます。",
        ),
      },
      { t: "art", tone: "ink", lines: HORIZON_ART },
      {
        t: "warn",
        text: t(
          "Whether wave and mountain are rivals or equals is interpretation: some read the wave as larger than Fuji, others as matching it in power.",
          "Apakah ombak dan gunung bersaing atau setara adalah soal tafsir: ada yang menganggap ombak lebih besar dari Fuji, ada yang menganggap keduanya sama kuat.",
          "波と山が競っているのか対等なのかは解釈の問題です。波のほうが富士より大きいと見る人も、力は互角だと見る人もいます。",
        ),
      },
    ],
    sources: [
      { label: "Daily Art: Hokusai's Great Wave Explained", url: "https://www.dailyartmagazine.com/great-wave-hokusai/" },
      { label: "Artnet: three things about the Great Wave", url: "https://news.artnet.com/art-world/three-things-hokusai-great-wave-2367449" },
    ],
  },
  {
    id: "boats",
    num: "04",
    title: t("THE THREE BOATS", "TIGA PERAHU", "三艘の舟"),
    sub: t(
      "oshiokuri-bune / fast fish carriers",
      "oshiokuri-bune / perahu pengangkut ikan yang cepat",
      "押送船 / 魚を運ぶ快速船",
    ),
    blocks: [
      { t: "art", tone: "gold", lines: BOAT_ART },
      {
        t: "p",
        text: t(
          "Three oshiokuri-bune, fast boats that rushed fish from Izu and the Boso peninsula to the markets of Edo (Tokyo) Bay. The crews are not panicking: they crouch low and keep pulling with discipline.",
          "Tiga oshiokuri-bune, perahu cepat yang membawa ikan dari Izu dan Semenanjung Boso ke pasar-pasar Teluk Edo (Tokyo). Para awaknya tidak panik: mereka membungkuk rendah dan terus mendayung dengan disiplin.",
          "三艘の押送船(おしおくりぶね)です。伊豆や房総から江戸湾(今の東京湾)の市場へ、魚を急いで運ぶ快速船でした。乗組員は慌てず、身をかがめて規律正しく櫂を漕ぎ続けています。",
        ),
      },
      { t: "art", tone: "gold", lines: ROUTE_ART },
      {
        t: "kv",
        rows: [
          [
            t("CARGO", "MUATAN", "積荷"),
            t(
              "fresh fish; one source names bonito, a springtime delicacy that sold dear in the capital",
              "ikan segar; satu sumber menyebut bonito, hidangan musim semi yang dijual mahal di ibu kota",
              "新鮮な魚。ある資料はカツオを挙げ、春の味覚として江戸で高値で売れたとしています",
            ),
          ],
          [
            t("SIZE", "UKURAN", "大きさ"),
            t(
              "barges 12 to 15 m long for carrying live fish",
              "tongkang sepanjang 12 sampai 15 m untuk mengangkut ikan hidup",
              "活魚を運ぶ全長12〜15メートルの舟",
            ),
          ],
          [
            t("SETTING", "LATAR", "場所"),
            t(
              "rough water outside the mouth of Tokyo Bay",
              "perairan ganas di luar mulut Teluk Tokyo",
              "東京湾の入り口の外の荒れた海",
            ),
          ],
        ],
      },
      {
        t: "warn",
        text: t(
          "One museum source says each boat has eight rowers and two passengers. It is the only one I found, so count the figures in the print yourself.",
          "Satu sumber museum menyebut setiap perahu berisi delapan pendayung dan dua penumpang. Hanya itu sumber yang saya temukan, jadi hitung sendiri sosok-sosok di cetakan.",
          "ある美術館の資料は、各舟に漕ぎ手8人と乗客2人がいるとしています。見つかったのはこの資料だけなので、ぜひ版画の人物を自分で数えてみてください。",
        ),
      },
    ],
    sources: [
      { label: "Musei di Genova: The Great Wave", url: "https://www.museidigenova.it/en/node/10004" },
      { label: "Artnet: three things about the Great Wave", url: "https://news.artnet.com/art-world/three-things-hokusai-great-wave-2367449" },
      { label: "Surfertoday: facts about the print", url: "https://www.surfertoday.com/surfing/the-great-wave-off-kanagawa-fascinating-facts-about-the-famous-japanese-print" },
    ],
  },
  {
    id: "blue",
    num: "05",
    title: t("PRUSSIAN BLUE", "BIRU PRUSIA", "プルシアンブルー"),
    sub: t("bero-ai / the imported blue", "bero-ai / biru impor", "ベロ藍 / 輸入された青"),
    blocks: [
      { t: "art", tone: "sea", lines: BLUE_STACK },
      {
        t: "kv",
        rows: [
          [t("K", "K", "K"), t("sumi outlines (keyblock)", "garis tinta sumi (balok utama)", "墨の輪郭線(主版)")],
          [t("1", "1", "1"), t("indigo mixed with Prussian blue", "indigo dicampur biru Prusia", "藍とプルシアンブルーを混ぜたもの")],
          [t("2", "2", "2"), t("pure Prussian blue on top", "biru Prusia murni di atasnya", "その上に純粋なプルシアンブルー")],
        ],
      },
      {
        t: "p",
        text: t(
          "The deep blues are a synthetic pigment, Prussian blue, first made by accident in Berlin in the early 1700s (one source names Johann Jacob Diesbach, 1706). It reached Japan through the Dutch trade at Dejima, Nagasaki.",
          "Biru yang pekat itu adalah pigmen sintetis, biru Prusia, yang pertama kali dibuat secara tidak sengaja di Berlin pada awal 1700-an (satu sumber menyebut Johann Jacob Diesbach, 1706). Pigmen ini sampai ke Jepang lewat perdagangan Belanda di Dejima, Nagasaki.",
          "深い青は合成顔料のプルシアンブルーで、18世紀初めにベルリンで偶然生まれました(ある資料はヨハン・ヤコブ・ディースバッハ、1706年としています)。オランダ貿易を通じて長崎の出島から日本に入りました。",
        ),
      },
      { t: "art", tone: "sea", lines: BLUE_ROUTE },
      { t: "h", text: t("what the Met found", "temuan Met", "メトロポリタン美術館の調査") },
      {
        t: "p",
        text: t(
          "Spectroscopy at the Met showed printers did not simply swap indigo for Prussian blue. They mixed the two in one printing and laid pure Prussian blue in another, for a more nuanced effect.",
          "Spektroskopi di Met menunjukkan bahwa para pencetak tidak sekadar mengganti indigo dengan biru Prusia. Mereka mencampur keduanya dalam satu pencetakan dan menumpuk biru Prusia murni pada pencetakan lain, demi efek yang lebih halus.",
          "メトロポリタン美術館の分光分析により、摺師は藍をプルシアンブルーに単純に置き換えたのではないことが分かりました。一度の摺りでは両者を混ぜ、別の摺りでは純粋なプルシアンブルーを重ね、より繊細な効果を生んでいます。",
        ),
      },
      {
        t: "p",
        text: t(
          "The publisher Eijudo advertised the series for the 1831 New Year and highlighted Prussian blue as a new feature.",
          "Penerbit Eijudo mengiklankan seri ini untuk Tahun Baru 1831 dan menonjolkan biru Prusia sebagai fitur baru.",
          "版元の永寿堂は、この揃物を1831年の新年向けに宣伝し、プルシアンブルーを新しい特色として強調しました。",
        ),
      },
    ],
    sources: [
      { label: "The Met: The Great Wave, Anatomy of an Icon", url: "https://www.metmuseum.org/essays/hokusai-great-wave" },
      { label: "The Conversation: how a blue pigment changed the world", url: "https://theconversation.com/friday-essay-from-the-great-wave-to-starry-night-how-a-blue-pigment-changed-the-world-81031" },
    ],
  },
  {
    id: "title",
    num: "06",
    title: t("THE CARTOUCHE", "KARTUS JUDUL", "題名の枠"),
    sub: t("title, series and signature", "judul, seri, dan tanda tangan", "題名、シリーズ名、署名"),
    blocks: [
      { t: "art", tone: "ink", lines: TITLE_ART },
      {
        t: "kv",
        rows: [
          [
            t("SERIES", "SERI", "シリーズ"),
            t(
              "Fugaku sanjurokkei, Thirty-six Views of Mount Fuji",
              "Fugaku sanjurokkei, Tiga Puluh Enam Pemandangan Gunung Fuji",
              "富嶽三十六景",
            ),
          ],
          [t("PRINT", "CETAKAN", "作品名"), t("Kanagawa oki nami ura", "Kanagawa oki nami ura", "神奈川沖浪裏")],
          [
            t("SIGNED", "TTD", "署名"),
            t(
              "Hokusai aratame Iitsu hitsu, 'brush of Iitsu, formerly Hokusai' (Christie's reading)",
              "Hokusai aratame Iitsu hitsu, 'kuas Iitsu, dahulu Hokusai' (pembacaan Christie's)",
              "北斎改為一筆。「北斎あらため為一(Iitsu)筆」(クリスティーズの読み)",
            ),
          ],
          [
            t("ARTIST", "SENIMAN", "絵師"),
            t(
              "Katsushika Hokusai, 1760 to 1849, about 70 when the series appeared",
              "Katsushika Hokusai, 1760 sampai 1849, sekitar 70 tahun saat seri ini terbit",
              "葛飾北斎(1760〜1849)。シリーズ刊行時は70歳前後",
            ),
          ],
          [
            t("PUBLISHER", "PENERBIT", "版元"),
            t("Nishimuraya Yohachi (Eijudo)", "Nishimuraya Yohachi (Eijudo)", "西村屋与八(永寿堂)"),
          ],
          [
            t("DATE", "TANGGAL", "刊行"),
            t(
              "c. 1830-32 (Met); probably late 1831 (British Museum)",
              "sekitar 1830-32 (Met); kemungkinan akhir 1831 (British Museum)",
              "1830〜32年頃(メトロポリタン美術館)。1831年末とみられる(大英博物館)",
            ),
          ],
        ],
      },
      {
        t: "p",
        text: t(
          "Publisher and censor seals appear on many impressions, though the Museum of Fine Arts, Boston notes that some of its impressions carry none.",
          "Segel penerbit dan sensor muncul pada banyak cetakan, meski Museum of Fine Arts, Boston mencatat bahwa sebagian cetakan miliknya tidak memilikinya.",
          "版元印と検閲印が見られる摺りも多いのですが、ボストン美術館は、所蔵する摺りの一部にはどちらもないと記しています。",
        ),
      },
    ],
    sources: [
      { label: "Hopp Museum record (signature)", url: "https://hoppmuseum.hu/en/collection/pdfexport/126967-the-great-wave-of-kanagawa" },
      { label: "British Museum record", url: "https://www.britishmuseum.org/collection/object/A_2008-3008-1" },
      { label: "Harvard Art Museums record", url: "https://harvardartmuseums.org/art/210190" },
      { label: "The Met essay", url: "https://www.metmuseum.org/essays/hokusai-great-wave" },
    ],
  },
  {
    id: "process",
    num: "07",
    title: t("THE MAKING", "PROSES PEMBUATAN", "制作工程"),
    sub: t("woodblock printing", "cetak balok kayu", "木版画の摺り"),
    blocks: [
      { t: "art", tone: "gold", lines: PROCESS_ART },
      {
        t: "kv",
        rows: [
          [t("1", "1", "1"), t("Drawing: Hokusai's brush", "Gambar: sapuan kuas Hokusai", "下絵: 北斎の筆")],
          [
            t("2", "2", "2"),
            t(
              "Keyblock: outlines carved in cherry wood, cut first",
              "Balok utama: garis luar diukir di kayu ceri, dibuat lebih dulu",
              "主版: 桜の木に輪郭を彫る。最初に彫る",
            ),
          ],
          [t("3", "3", "3"), t("Colour blocks: one block per colour", "Balok warna: satu balok untuk tiap warna", "色版: 色ごとに一枚")],
          [
            t("4", "4", "4"),
            t(
              "Print: rubbed by hand, one colour at a time",
              "Cetak: digosok dengan tangan, satu warna setiap kali",
              "摺り: 手で擦り、一色ずつ重ねる",
            ),
          ],
        ],
      },
      {
        t: "kv",
        rows: [
          [
            t("BLOCKS", "BLOK", "版木"),
            t(
              "7 hand-carved blocks (one museum-related source)",
              "7 balok yang diukir tangan (satu sumber terkait museum)",
              "手彫りの版木7枚(美術館関連のある資料)",
            ),
          ],
          [
            t("RUN", "JUMLAH", "部数"),
            t(
              "about 8,000 impressions printed, about 200 survive (one source)",
              "sekitar 8.000 cetakan dibuat, sekitar 200 masih ada (satu sumber)",
              "約8,000枚が摺られ、現存は約200枚(ある資料)",
            ),
          ],
        ],
      },
      {
        t: "warn",
        text: t(
          "Block and print-run figures each come from a single source. Treat them as estimates.",
          "Angka balok dan jumlah cetakan masing-masing hanya berasal dari satu sumber. Anggap sebagai perkiraan.",
          "版木の数と摺りの部数は、それぞれ単一の資料に基づきます。目安としてお考えください。",
        ),
      },
    ],
    sources: [
      { label: "mokuhanga: Hokusai's Great Wave", url: "https://mokuhanga1.com/great-wave" },
      { label: "Daily Art: how Japanese woodcuts are made", url: "https://www.dailyartmagazine.com/how-japanese-woodcuts-are-made/" },
      { label: "British Museum record", url: "https://www.britishmuseum.org/collection/object/A_2008-3008-1" },
    ],
  },
  {
    id: "science",
    num: "08",
    title: t("GEOMETRY & SCIENCE", "GEOMETRI & SAINS", "幾何学と科学"),
    sub: t("triangle, circle, fractal", "segitiga, lingkaran, fraktal", "三角形、円、フラクタル"),
    blocks: [
      { t: "art", tone: "ink", lines: SCIENCE_ART },
      {
        t: "p",
        text: t(
          "Fuji is a triangle and the waves are built on circles. A 1967 paper in the Journal of Graphic Science of Japan found a golden rectangle playing the pivotal role in the composition.",
          "Fuji adalah segitiga dan ombaknya dibangun dari lingkaran. Sebuah makalah tahun 1967 di Journal of Graphic Science of Japan menemukan bahwa persegi panjang emas berperan penting dalam komposisinya.",
          "富士は三角形で、波は円を基にして構成されています。1967年の「図学研究」(Journal of Graphic Science of Japan)の論文は、構図の要として黄金矩形が働いていると指摘しました。",
        ),
      },
      {
        t: "warn",
        text: t(
          "Golden-spiral overlays are only an approximate fit laid on afterwards. They do not prove Hokusai drew it that way.",
          "Lapisan spiral emas hanyalah kecocokan perkiraan yang ditempelkan belakangan. Itu tidak membuktikan bahwa Hokusai menggambarnya demikian.",
          "黄金螺旋を重ねた図は、後から当てはめた近似にすぎません。北斎がそのように描いた証拠にはなりません。",
        ),
      },
      {
        t: "p",
        text: t(
          "Wave physicists have used the print as a case study, and the claw-like foam keeps being read as fractal. Both readings are modern.",
          "Fisikawan gelombang telah memakai cetakan ini sebagai studi kasus, dan buih berbentuk cakar terus ditafsirkan sebagai fraktal. Kedua pembacaan itu bersifat modern.",
          "波を研究する物理学者がこの版画を事例として使い、爪のような泡はたびたびフラクタルとして読まれてきました。どちらも現代の読み方です。",
        ),
      },
    ],
    sources: [
      { label: "J-STAGE: golden rectangle (1967)", url: "https://www.jstage.jst.go.jp/article/jsgs1967/41/4/41_4_3/_article" },
      { label: "Art & Object: golden ratio", url: "https://cdn.artandobject.com/slideshows/golden-ratio-revealed-7-masterpieces" },
      { label: "PNAS: Dissecting the Great Wave", url: "https://www.pnas.org/doi/10.1073/pnas.1413975111" },
    ],
  },
  {
    id: "legacy",
    num: "09",
    title: t("AFTERLIFE", "WARISAN", "その後の影響"),
    sub: t("Debussy, Van Gogh and beyond", "Debussy, Van Gogh, dan seterusnya", "ドビュッシー、ゴッホ、そして現代へ"),
    blocks: [
      { t: "art", tone: "gold", lines: LEGACY_ART },
      {
        t: "kv",
        rows: [
          [
            t("1905", "1905", "1905"),
            t(
              "A detail of the print is the cover of the first edition of Debussy's La Mer (Durand). He put his own name where Hokusai's signature sits.",
              "Detail cetakan ini menjadi sampul edisi pertama La Mer karya Debussy (Durand). Ia menaruh namanya sendiri di tempat tanda tangan Hokusai.",
              "版画の部分図がドビュッシー「海」初版(デュラン社)の表紙になりました。彼は北斎の署名がある位置に自分の名前を置いています。",
            ),
          ],
          [
            t("1888", "1888", "1888"),
            t(
              "Van Gogh writes to Theo about the print's claw-like waves. Martin Bailey argues it fed The Starry Night (1889).",
              "Van Gogh menulis kepada Theo tentang ombak berbentuk cakar pada cetakan ini. Martin Bailey berpendapat cetakan ini memengaruhi The Starry Night (1889).",
              "ゴッホは弟テオへの手紙で、この版画の爪のような波に触れています。マーティン・ベイリーは、これが「星月夜」(1889年)に影響したと論じています。",
            ),
          ],
          [
            t("2024", "2024", "2024"),
            t(
              "The wave appears on Japan's new 1000-yen note.",
              "Ombak ini muncul pada uang kertas 1000 yen baru Jepang.",
              "この波は日本の新千円札にも描かれています。",
            ),
          ],
        ],
      },
      {
        t: "warn",
        text: t(
          "The Starry Night link is Bailey's theory. The Art Newspaper calls the influence loose. The 1000-yen note comes from general knowledge, not from my search.",
          "Kaitan dengan The Starry Night adalah teori Bailey. The Art Newspaper menyebut pengaruhnya longgar. Soal uang 1000 yen berasal dari pengetahuan umum, bukan dari pencarian saya.",
          "「星月夜」との関連はベイリーの説です。The Art Newspaper は影響を「ゆるやか」としています。千円札の件は検索ではなく一般的な知識によります。",
        ),
      },
    ],
    sources: [
      { label: "The Met: Hokusai and Debussy", url: "https://www.metmuseum.org/en/perspectives/debussy-la-mer" },
      { label: "The Art Newspaper: Starry Night and the Great Wave", url: "https://theartnewspaper.com/2018/09/28/how-van-goghs-starry-night-was-inspired-by-hokusais-great-wave" },
    ],
  },
];

export const HOTSPOTS: Hotspot[] = [
  { id: "wave", entry: "wave", num: "01", label: t("THE WAVE", "OMBAK BESAR", "大波"), u: 0.3, v: 0.16, r: 0.14 },
  { id: "claws", entry: "claws", num: "02", label: t("THE CLAWS", "CAKAR OMBAK", "波の爪"), u: 0.5, v: 0.29, r: 0.09 },
  { id: "fuji", entry: "fuji", num: "03", label: t("MOUNT FUJI", "GUNUNG FUJI", "富士山"), u: 0.635, v: 0.665, r: 0.06 },
  {
    id: "boat-1", entry: "boats", num: "4a", label: t("BOAT I", "PERAHU I", "舟I"), u: 0.12, v: 0.62, r: 0.08,
    note: t(
      "BOAT I (this wiki's label): far left, its hull half-lost in foam and the dark curl of the wave.",
      "PERAHU I (sebutan di wiki ini): paling kiri, lambungnya setengah hilang di dalam buih dan lengkung gelap ombak.",
      "舟I(この解説での呼び名): 左端。船体は泡と波の暗い巻きの中に半ば隠れています。",
    ),
  },
  {
    id: "boat-2", entry: "boats", num: "4b", label: t("BOAT II", "PERAHU II", "舟II"), u: 0.725, v: 0.64, r: 0.1,
    note: t(
      "BOAT II: right of centre, crew bent over their oars, Fuji just above its hull.",
      "PERAHU II: di kanan tengah, awaknya membungkuk di atas dayung, Fuji tepat di atas lambungnya.",
      "舟II: 中央やや右。乗組員は櫂に身を伏せ、船体のすぐ上に富士が見えます。",
    ),
  },
  {
    id: "boat-3", entry: "boats", num: "4c", label: t("BOAT III", "PERAHU III", "舟III"), u: 0.575, v: 0.87, r: 0.1,
    note: t(
      "BOAT III: the long pale hull in the foreground, rowers bunched at its far end.",
      "PERAHU III: lambung panjang yang pucat di latar depan, para pendayung berkumpul di ujung jauhnya.",
      "舟III: 手前の長く淡い色の船体。漕ぎ手は向こう側の端に固まっています。",
    ),
  },
  { id: "blue", entry: "blue", num: "05", label: t("PRUSSIAN BLUE", "BIRU PRUSIA", "プルシアンブルー"), u: 0.32, v: 0.36, r: 0.09 },
  { id: "title", entry: "title", num: "06", label: t("CARTOUCHE", "KARTUS", "題名の枠"), u: 0.07, v: 0.18, r: 0.07 },
];
