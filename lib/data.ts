import { createClient } from "@supabase/supabase-js";
import { unstable_cache } from "next/cache";
import type {
  BusinessHour,
  Database,
  GalleryItem,
  Review,
  Service,
  Voucher,
} from "@/lib/database.types";
import { DEFAULT_SETTINGS, mergeSettings, type SiteSettings } from "@/lib/settings";

/**
 * Veřejná data webu — služby, poukazy, galerie, recenze, nastavení.
 *
 * Čte se anonymním klientem BEZ cookies: obsah je pro všechny stejný, takže
 * se dá držet v cache napříč požadavky. Bez toho každá stránka pálila několik
 * kol do Supabase a načítala se stovky ms.
 *
 * Cache se neruší časem, ale značkami — admin akce zavolá `revalidateTag`,
 * takže změna je na webu okamžitě.
 */

export const TAGS = {
  settings: "site-settings",
  services: "services",
  vouchers: "vouchers",
  gallery: "gallery",
  reviews: "reviews",
  hours: "business-hours",
} as const;

/** Anonymní klient bez vazby na session — nutné, aby šel výsledek cachovat. */
function publicClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}

/** Obalí načítání cachí a spolkne výpadek databáze — web se vykreslí i tak. */
function cached<T>(
  key: string,
  tag: string,
  load: (db: ReturnType<typeof publicClient>) => Promise<T>,
  fallback: T,
) {
  return unstable_cache(
    async () => {
      try {
        return await load(publicClient());
      } catch {
        return fallback;
      }
    },
    [key],
    { tags: [tag] },
  );
}

export const getSettings = cached<SiteSettings>(
  "settings",
  TAGS.settings,
  async (db) => {
    const { data } = await db
      .from("site_settings")
      .select("data")
      .eq("id", true)
      .maybeSingle();
    return mergeSettings(DEFAULT_SETTINGS, data?.data);
  },
  DEFAULT_SETTINGS,
);

export const getServices = cached<Service[]>(
  "services",
  TAGS.services,
  async (db) => {
    const { data } = await db
      .from("services")
      .select("*")
      .eq("active", true)
      .order("sort_order", { ascending: true });
    return data ?? [];
  },
  [],
);

export const getVouchers = cached<Voucher[]>(
  "vouchers",
  TAGS.vouchers,
  async (db) => {
    const { data } = await db
      .from("vouchers")
      .select("*")
      .eq("active", true)
      .order("sort_order", { ascending: true });
    return data ?? [];
  },
  [],
);

export const getGallery = cached<GalleryItem[]>(
  "gallery",
  TAGS.gallery,
  async (db) => {
    const { data } = await db
      .from("gallery_items")
      .select("*")
      .order("featured", { ascending: false })
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false })
      .limit(9);
    return data ?? [];
  },
  [],
);

export const getApprovedReviews = cached<Review[]>(
  "reviews",
  TAGS.reviews,
  async (db) => {
    const { data } = await db
      .from("reviews")
      .select("*")
      .eq("approved", true)
      .order("featured", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(8);
    return data ?? [];
  },
  [],
);

export const getBusinessHours = cached<BusinessHour[]>(
  "hours",
  TAGS.hours,
  async (db) => {
    const { data } = await db.from("business_hours").select("*");
    return data ?? [];
  },
  [],
);

/** Průměrné hodnocení z publikovaných recenzí. */
export function averageRating(reviews: Review[]): number | null {
  if (reviews.length === 0) return null;
  return reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
}
