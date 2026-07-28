import { createClient } from "@/lib/supabase/server";

/** Struktura obsahu webu, kterou lze celou měnit v /admin/vzhled. */
export type SiteSettings = {
  brand: { name: string; short: string; tagline: string; logoUrl: string };
  theme: {
    accent: string;
    accent2: string;
    background: string;
    surface: string;
    radius: number;
    glow: number;
    grain: boolean;
  };
  hero: {
    badge: string;
    title: string;
    titleAccent: string;
    subtitle: string;
    ctaPrimary: string;
    ctaSecondary: string;
    imageUrl: string;
    stats: { value: string; label: string }[];
  };
  story: {
    badge: string;
    title: string;
    paragraphs: string[];
    imageUrl: string;
    milestones: { year: string; title: string; text: string }[];
  };
  services: { title: string; subtitle: string };
  gallery: { title: string; subtitle: string };
  reviews: { title: string; subtitle: string };
  booking: {
    title: string;
    subtitle: string;
    paymentNote: string;
    slotStepMin: number;
    leadTimeHours: number;
    maxDaysAhead: number;
  };
  contact: {
    title: string;
    address: string;
    phone: string;
    email: string;
    ico: string;
    instagram: string;
    facebook: string;
    mapEmbed: string;
    hoursNote: string;
  };
  seo: { title: string; description: string };
};

export const DEFAULT_SETTINGS: SiteSettings = {
  brand: {
    name: "Honza Detailing",
    short: "HD",
    tagline: "Prémiový auto detailing",
    logoUrl: "",
  },
  theme: {
    accent: "#22E5C8",
    accent2: "#3B7BFF",
    background: "#04060B",
    surface: "#0B1018",
    radius: 18,
    glow: 55,
    grain: true,
  },
  hero: {
    badge: "Detailing studio · Praha",
    title: "Vaše auto si zaslouží",
    titleAccent: "víc než myčku",
    subtitle:
      "Ruční péče, korekce laku a keramická ochrana. Každý vůz řešíme jako jediný v garáži — bez fronty, bez kompromisů.",
    ctaPrimary: "Rezervovat termín",
    ctaSecondary: "Prohlédnout práce",
    imageUrl: "",
    stats: [
      { value: "600+", label: "ošetřených vozů" },
      { value: "4,9", label: "průměrné hodnocení" },
      { value: "5 let", label: "záruka na keramiku" },
      { value: "1", label: "vůz denně v garáži" },
    ],
  },
  story: {
    badge: "Náš příběh",
    title: "Začalo to jednou garáží a jedním Golfem",
    paragraphs: [
      "V roce 2019 jsem si po večerech v pronajaté garáži hrál s vlastním Golfem. Leštičku jsem si koupil na zkoušku, s tím, že to „nějak zvládnu“. Zvládl jsem to špatně — a přesně to mě nastartovalo.",
      "Následovaly stovky hodin na kurzech, tisíce hodin u vozů a spousta zkažených aplikátorů. Dneska má Honza Detailing vlastní studio s filtrovanou vodou, kontrolovaným osvětlením a vybavením, o kterém se mi tehdy ani nesnilo.",
      "Jedna věc se ale nezměnila: v garáži je vždycky jen jeden vůz denně. Ne proto, že bychom nestíhali, ale proto, že spěch je v detailingu ta nejdražší chyba.",
    ],
    imageUrl: "",
    milestones: [
      { year: "2019", title: "První leštička", text: "Garáž 3×6 metrů, jeden Golf a hodně pokusů a omylů." },
      { year: "2021", title: "Certifikace", text: "Školení na korekci laku a aplikaci keramických ochran." },
      { year: "2023", title: "Vlastní studio", text: "Řízené osvětlení, filtrovaná voda, bezprašná zóna." },
      { year: "2026", title: "600+ vozů", text: "Od Fabií po Porsche. Každý dostal stejnou péči." },
    ],
  },
  services: {
    title: "Služby",
    subtitle:
      "Od rychlé údržby po kompletní proměnu vozu. Ceny jsou orientační — finální cenu potvrdíme po prohlídce vozu.",
  },
  gallery: {
    title: "Hotové zakázky",
    subtitle: "Žádné stock fotky. Všechno jsou vozy, které prošly naší garáží.",
  },
  reviews: {
    title: "Co říkají zákazníci",
    subtitle:
      "Recenze může přidat každý, kdo u nás byl. Zveřejňujeme je bez cenzury — jen po kontrole spamu.",
  },
  booking: {
    title: "Rezervace termínu",
    subtitle: "Vyberte službu, den a čas. Do pár vteřin vám přijde potvrzení na e-mail.",
    paymentNote:
      "Platba probíhá hotově na místě po předání vozu. Rezervace je nezávazná — zrušit ji můžete kdykoliv do 24 hodin před termínem.",
    slotStepMin: 30,
    leadTimeHours: 12,
    maxDaysAhead: 60,
  },
  contact: {
    title: "Kde nás najdete",
    address: "Průmyslová 1472/11, 102 00 Praha 10",
    phone: "+420 777 123 456",
    email: "info@hdetailing.cz",
    ico: "12345678",
    instagram: "https://instagram.com/honzadetailing",
    facebook: "",
    mapEmbed: "",
    hoursNote: "Po–Pá 8:00–18:00 · So 9:00–14:00 · Ne zavřeno",
  },
  seo: {
    title: "Honza Detailing — prémiový auto detailing Praha",
    description:
      "Ruční mytí, renovace laku, keramická ochrana a hloubkové čištění interiéru. Rezervujte si termín online.",
  },
};

type Plain = Record<string, unknown>;

const isPlainObject = (v: unknown): v is Plain =>
  typeof v === "object" && v !== null && !Array.isArray(v);

/** Doplní chybějící klíče z výchozího nastavení — DB nikdy nemusí být kompletní. */
export function mergeSettings<T>(base: T, override: unknown): T {
  if (!isPlainObject(override)) return base;
  if (!isPlainObject(base)) return (override as T) ?? base;

  const out: Plain = { ...(base as Plain) };
  for (const [key, value] of Object.entries(override)) {
    if (value === undefined || value === null) continue;
    const current = (base as Plain)[key];
    out[key] =
      isPlainObject(current) && isPlainObject(value)
        ? mergeSettings(current, value)
        : value;
  }
  return out as T;
}

/** Načte nastavení webu. Při chybějícím/nedostupném Supabase vrací výchozí obsah. */
export async function getSiteSettings(): Promise<SiteSettings> {
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("site_settings")
      .select("data")
      .eq("id", true)
      .maybeSingle();

    return mergeSettings(DEFAULT_SETTINGS, data?.data);
  } catch {
    return DEFAULT_SETTINGS;
  }
}
