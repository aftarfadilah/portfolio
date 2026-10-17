/**
 * Wiki content for the Kanagawa page: every entry is drawn in ASCII.
 *
 * Facts come from the sources listed on each entry (Met Museum essay, British
 * Museum, Harvard Art Museums, Daily Art, The Art Newspaper, PMC/ResearchGate
 * wave papers, ...). Claims that rest on a single source are flagged "warn".
 */

export type Tone = "sea" | "fuji" | "gold" | "ink";

export type Block =
  | { t: "art"; tone: Tone; lines: string[] }
  | { t: "h"; text: string }
  | { t: "p"; text: string }
  | { t: "kv"; rows: [string, string][] }
  | { t: "quote"; text: string; by: string }
  | { t: "warn"; text: string };

export type Source = { label: string; url: string };

export type Entry = {
  id: string;
  num: string;
  title: string;
  sub: string;
  blocks: Block[];
  sources: Source[];
};

/** A spot on the print. (u, v) is the position in the picture, r the radius as a fraction of its width. */
export type Hotspot = {
  id: string;
  entry: string;
  num: string;
  label: string;
  u: number;
  v: number;
  r: number;
  note?: string;
};

const art = (s: string) => s.replace(/^\n/, "").replace(/\s+$/, "").split("\n");

const WAVE_ART = art(String.raw`
                    _.---~~~~---._
               _.-~'  *  '  *  '  '~-._     ,~,~,
           _.-'  '   *   '   *    '   '-. ,*'*'*,
        .-'  *   '    _.--~~~~--._  *    '/'*\*'/
      .'  '   *    .-'            '-.  '  \'*/~'
     /  *   '   * .'     HOLLOW     '.  *   '~'
    ;  '   *   ' /     (nami ura)     \   '
    |   *   '   ;                     ;  *
     \_  *   '   \                   /  _/
  ~~~~~'-.__ *  ' '-._           _.-'_.-'~~~~~~~
         ~~~'-.______'-._______.-'~~~
`);

const WAVE_GAUGE = art(String.raw`
   about 10 m      boat ~ 12-15 m long
        |  ____
        | /    \
        |/  ~~~ \              ___/\___
 10 m   ||  ~~~  |      ______/        \______
        |\  ~~~ /      (the wave looms over them)
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
   scale 1                  Y
   scale 2                Y   Y
   scale 3              Y Y   Y Y
   scale 4            YY YY   YY YY
        every finger of foam splits again into
        smaller fingers: the same shape at
        every size, like a fractal.
`);

const FUJI_ART = art(String.raw`
                        /\
                       /**\
                      /*'*'\          3,776 m
                     /_/\/\_\        (tiny here)
                    /        \
                   /          \
  ~~~~~~~~~~~~~~~~/____________\~~~~~~~~~~~~~~~~
`);

const FUJI_FRAME = art(String.raw`
          _.--~~~~~~--._
        .'  *  '  *  '  '.
       /       /\          \
      ;       /**\          ;
      |      /_/\_\         |    Fuji sits in the
      ;                     ;    hollow of the wave
       \  ~~~~~~~~~~~~~~~~ /
  ~~~~~~'-.______________.-'~~~~~~
`);

const HORIZON_ART = art(String.raw`
   EUROPEAN             HOKUSAI
   ........             ..../\/\.....
   .      .             .  /    \   .   <- wave
   .~~~~~~.             . /      \  .      towers
   high horizon         ~~~~~~~~~~~~~    low horizon
`);

const BOAT_ART = art(String.raw`
            o  o  o  o  o  o  o  o      <- rowers
         __/\_/\_/\_/\_/\_/\_/\_/\__
   _____/___________________________\_____
  <_______________________________________>
 ~~~~~'~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~'~~~~
`);

const ROUTE_ART = art(String.raw`
   IZU / BOSO  ------------>  EDO BAY MARKETS
   (fishing grounds)          (Tokyo today)
        |                           ^
        |  fresh bonito, live fish  |
        '-----[ oshiokuri-bune ]----'
                 fast and low
`);

const BLUE_STACK = art(String.raw`
   KEYBLOCK ........ sumi outlines     ||||||||
   PASS  1 ......... indigo + Prussian ########
   PASS  2 ......... pure Prussian     ========
                     -> a bolder, deeper blue
`);

const BLUE_ROUTE = art(String.raw`
   BERLIN 1706 --> EUROPE --> DEJIMA --> EDO 1831
   (made by         ~~~~      (Nagasaki   "bero-ai"
    accident)                  harbour)    new blue
`);

const TITLE_ART = art(String.raw`
    .------------------------------------.
    |  A  SERIES    Fugaku sanjurokkei   |
    |  B  PRINT     Kanagawa oki nami ura|
    |  C  SIGNED    Hokusai aratame      |
    |               Iitsu hitsu          |
    '------------------------------------'
          (top left corner of the print)
`);

const PROCESS_ART = art(String.raw`
  [ DRAWING ] --> [ KEYBLOCK ] --> [ COLOUR BLOCKS ]
   Hokusai         carved in         one block for
   (brush)         cherry wood       each colour
                        |                  |
                        v                  v
                   outlines  ------>  [ PRINT ]
                                      rubbed by hand
`);

const SCIENCE_ART = art(String.raw`
   GOLDEN RECTANGLE (phi = 1.618)
   +-----------------+----------+
   |                 |          |
   |        A        |    B     |
   |                 +----+-----+
   |                 | C  |
   +-----------------+----+
   each cut leaves a smaller copy of the same shape
`);

const LEGACY_ART = art(String.raw`
   1831 ------- 1888 ------- 1905 ------- 2024
    |            |            |            |
  the print   Van Gogh     Debussy      Japan's
              admires it   La Mer       1000-yen
                           cover        note
`);

export const ENTRIES: Entry[] = [
  {
    id: "wave",
    num: "01",
    title: "THE WAVE",
    sub: "nami / the breaking crest",
    blocks: [
      { t: "art", tone: "sea", lines: WAVE_ART },
      { t: "p", text: "A wave about to break, towering over three boats. Some estimates put it as tall as 10 metres (about 33 feet)." },
      { t: "art", tone: "sea", lines: WAVE_GAUGE },
      { t: "kv", rows: [
        ["KIND", "plunging breaker or rogue wave, not a tsunami"],
        ["MOMENT", "the instant before the lip falls"],
      ] },
      { t: "h", text: "tsunami? probably not" },
      { t: "p", text: "The wave is often called a tsunami. Physicists disagree: a 2009 analysis (Cartwright and Nakamura) concluded the picture far more likely shows an extreme plunging breaker, a big storm wave on the point of breaking over the boats. Other writers call it a rogue wave. A tsunami does not curl like this." },
      { t: "h", text: "what does the title mean?" },
      { t: "p", text: "Kanagawa oki nami ura. Museums translate nami ura differently: \"Under the Wave off Kanagawa\" (Harvard), \"The Hollow of the Deep Sea Wave off Kanagawa\" (Bristol Museums)." },
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
    title: "THE CLAWS",
    sub: "the foam fingers",
    blocks: [
      { t: "art", tone: "sea", lines: CLAW_ART },
      { t: "p", text: "At the crest the foam splits into finger-like claws that reach down over the boats." },
      { t: "quote", text: "These waves are claws, and the boat is caught in them, you can feel it.", by: "Vincent van Gogh to his brother Theo, 1888 (wording varies by source)" },
      { t: "art", tone: "ink", lines: CLAW_FRACTAL },
      { t: "warn", text: "The fractal reading is a modern interpretation (a Yale maths page admires how Hokusai showed fractal aspects of nature). Nothing shows he meant it." },
    ],
    sources: [
      { label: "The Art Newspaper: Starry Night and the Great Wave", url: "https://theartnewspaper.com/2018/09/28/how-van-goghs-starry-night-was-inspired-by-hokusais-great-wave" },
      { label: "Yale: fractals in Hokusai", url: "https://gauss.math.yale.edu/public_html/People/frame/Fractals/Panorama/Art/Hokusai/Hokusai.html" },
    ],
  },
  {
    id: "fuji",
    num: "03",
    title: "MOUNT FUJI",
    sub: "Fuji-san / the small calm peak",
    blocks: [
      { t: "art", tone: "fuji", lines: FUJI_ART },
      { t: "p", text: "The print belongs to Thirty-six Views of Mount Fuji, so Fuji is the nominal subject, yet it is the smallest thing in the picture: a snow-capped triangle far off, beneath the arc of the wave." },
      { t: "art", tone: "fuji", lines: FUJI_FRAME },
      { t: "kv", rows: [
        ["HEIGHT", "3,776 m, Japan's highest mountain"],
        ["ROLE", "calm and distant against a violent foreground"],
      ] },
      { t: "h", text: "a low horizon" },
      { t: "p", text: "Hokusai studied European, especially Dutch, prints and took on linear perspective. His own twist is the very low horizon line: the sea rises above it, and the wave towers over Fuji." },
      { t: "art", tone: "ink", lines: HORIZON_ART },
      { t: "warn", text: "Whether wave and mountain are rivals or equals is interpretation: some read the wave as larger than Fuji, others as matching it in power." },
    ],
    sources: [
      { label: "Daily Art: Hokusai's Great Wave Explained", url: "https://www.dailyartmagazine.com/great-wave-hokusai/" },
      { label: "Artnet: three things about the Great Wave", url: "https://news.artnet.com/art-world/three-things-hokusai-great-wave-2367449" },
    ],
  },
  {
    id: "boats",
    num: "04",
    title: "THE THREE BOATS",
    sub: "oshiokuri-bune / fast fish carriers",
    blocks: [
      { t: "art", tone: "gold", lines: BOAT_ART },
      { t: "p", text: "Three oshiokuri-bune, fast boats that rushed fish from Izu and the Boso peninsula to the markets of Edo (Tokyo) Bay. The crews are not panicking: they crouch low and keep pulling with discipline." },
      { t: "art", tone: "gold", lines: ROUTE_ART },
      { t: "kv", rows: [
        ["CARGO", "fresh fish; one source names bonito, a springtime delicacy that sold dear in the capital"],
        ["SIZE", "barges 12 to 15 m long for carrying live fish"],
        ["SETTING", "rough water outside the mouth of Tokyo Bay"],
      ] },
      { t: "warn", text: "One museum source says each boat has eight rowers and two passengers. It is the only one I found, so count the figures in the print yourself." },
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
    title: "PRUSSIAN BLUE",
    sub: "bero-ai / the imported blue",
    blocks: [
      { t: "art", tone: "sea", lines: BLUE_STACK },
      { t: "p", text: "The deep blues are a synthetic pigment, Prussian blue, first made by accident in Berlin in the early 1700s (one source names Johann Jacob Diesbach, 1706). It reached Japan through the Dutch trade at Dejima, Nagasaki." },
      { t: "art", tone: "sea", lines: BLUE_ROUTE },
      { t: "h", text: "what the Met found" },
      { t: "p", text: "Spectroscopy at the Met showed printers did not simply swap indigo for Prussian blue. They mixed the two in one printing and laid pure Prussian blue in another, for a more nuanced effect." },
      { t: "p", text: "The publisher Eijudo advertised the series for the 1831 New Year and highlighted Prussian blue as a new feature." },
    ],
    sources: [
      { label: "The Met: The Great Wave, Anatomy of an Icon", url: "https://www.metmuseum.org/essays/hokusai-great-wave" },
      { label: "The Conversation: how a blue pigment changed the world", url: "https://theconversation.com/friday-essay-from-the-great-wave-to-starry-night-how-a-blue-pigment-changed-the-world-81031" },
    ],
  },
  {
    id: "title",
    num: "06",
    title: "THE CARTOUCHE",
    sub: "title, series and signature",
    blocks: [
      { t: "art", tone: "ink", lines: TITLE_ART },
      { t: "kv", rows: [
        ["SERIES", "Fugaku sanjurokkei, Thirty-six Views of Mount Fuji"],
        ["PRINT", "Kanagawa oki nami ura"],
        ["SIGNED", "Hokusai aratame Iitsu hitsu, 'brush of Iitsu, formerly Hokusai' (Christie's reading)"],
        ["ARTIST", "Katsushika Hokusai, 1760 to 1849, about 70 when the series appeared"],
        ["PUBLISHER", "Nishimuraya Yohachi (Eijudo)"],
        ["DATE", "c. 1830-32 (Met); probably late 1831 (British Museum)"],
      ] },
      { t: "p", text: "Publisher and censor seals appear on many impressions, though the Museum of Fine Arts, Boston notes that some of its impressions carry none." },
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
    title: "THE MAKING",
    sub: "woodblock printing",
    blocks: [
      { t: "art", tone: "gold", lines: PROCESS_ART },
      { t: "p", text: "The keyblock is cut first and carries the outlines. A separate block is then cut for each colour, usually in cherry wood, and the paper is printed one colour at a time." },
      { t: "kv", rows: [
        ["BLOCKS", "7 hand-carved blocks (one museum-related source)"],
        ["RUN", "about 8,000 impressions printed, about 200 survive (one source)"],
      ] },
      { t: "warn", text: "Block and print-run figures each come from a single source. Treat them as estimates." },
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
    title: "GEOMETRY & SCIENCE",
    sub: "triangle, circle, fractal",
    blocks: [
      { t: "art", tone: "ink", lines: SCIENCE_ART },
      { t: "p", text: "Fuji is a triangle and the waves are built on circles. A 1967 paper in the Journal of Graphic Science of Japan found a golden rectangle playing the pivotal role in the composition." },
      { t: "warn", text: "Golden-spiral overlays are only an approximate fit laid on afterwards. They do not prove Hokusai drew it that way." },
      { t: "p", text: "Wave physicists have used the print as a case study, and the claw-like foam keeps being read as fractal. Both readings are modern." },
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
    title: "AFTERLIFE",
    sub: "Debussy, Van Gogh and beyond",
    blocks: [
      { t: "art", tone: "gold", lines: LEGACY_ART },
      { t: "kv", rows: [
        ["1905", "A detail of the print is the cover of the first edition of Debussy's La Mer (Durand). He put his own name where Hokusai's signature sits."],
        ["1888", "Van Gogh writes to Theo about the print's claw-like waves. Martin Bailey argues it fed The Starry Night (1889)."],
        ["2024", "The wave appears on Japan's new 1000-yen note."],
      ] },
      { t: "warn", text: "The Starry Night link is Bailey's theory. The Art Newspaper calls the influence loose. The 1000-yen note comes from general knowledge, not from my search." },
    ],
    sources: [
      { label: "The Met: Hokusai and Debussy", url: "https://www.metmuseum.org/en/perspectives/debussy-la-mer" },
      { label: "The Art Newspaper: Starry Night and the Great Wave", url: "https://theartnewspaper.com/2018/09/28/how-van-goghs-starry-night-was-inspired-by-hokusais-great-wave" },
    ],
  },
];

export const HOTSPOTS: Hotspot[] = [
  { id: "wave", entry: "wave", num: "01", label: "THE WAVE", u: 0.3, v: 0.16, r: 0.14 },
  { id: "claws", entry: "claws", num: "02", label: "THE CLAWS", u: 0.5, v: 0.29, r: 0.09 },
  { id: "fuji", entry: "fuji", num: "03", label: "MOUNT FUJI", u: 0.635, v: 0.665, r: 0.06 },
  {
    id: "boat-1", entry: "boats", num: "4a", label: "BOAT I", u: 0.12, v: 0.62, r: 0.08,
    note: "BOAT I (this wiki's label): far left, its hull half-lost in foam and the dark curl of the wave.",
  },
  {
    id: "boat-2", entry: "boats", num: "4b", label: "BOAT II", u: 0.725, v: 0.64, r: 0.1,
    note: "BOAT II: right of centre, crew bent over their oars, Fuji just above its hull.",
  },
  {
    id: "boat-3", entry: "boats", num: "4c", label: "BOAT III", u: 0.575, v: 0.87, r: 0.1,
    note: "BOAT III: the long pale hull in the foreground, rowers bunched at its far end.",
  },
  { id: "blue", entry: "blue", num: "05", label: "PRUSSIAN BLUE", u: 0.32, v: 0.36, r: 0.09 },
  { id: "title", entry: "title", num: "06", label: "CARTOUCHE", u: 0.07, v: 0.18, r: 0.07 },
];

export const entryOf = (id: string) => ENTRIES.find((e) => e.id === id);
