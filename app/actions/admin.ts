"use server";

import { revalidatePath, updateTag } from "next/cache";
import { z } from "zod";
import { sendStatusUpdate } from "@/lib/email";
import { DEFAULT_SETTINGS, getSiteSettings, mergeSettings } from "@/lib/settings";
import { TAGS } from "@/lib/data";
import { createClient } from "@/lib/supabase/server";
import { zonedToUtc } from "@/lib/time";
import type { Booking, BookingStatus, Service } from "@/lib/database.types";

export type ActionState = { status: "idle" | "ok" | "error"; message?: string };

const ok = (message: string): ActionState => ({ status: "ok", message });
const fail = (message: string): ActionState => ({ status: "error", message });

/** Ověří, že akci spouští admin. Vrací klienta vázaného na jeho session. */
async function adminClient() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Nejste přihlášení.");

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile?.is_admin) throw new Error("Nemáte oprávnění administrátora.");
  return supabase;
}

/**
 * Zneplatní cache veřejných dat. Bez značky by změna v adminu zůstala
 * na webu neviditelná, protože `lib/data.ts` drží obsah napříč požadavky.
 */
function revalidateSite(...tags: string[]) {
  for (const tag of tags.length ? tags : Object.values(TAGS)) {
    updateTag(tag);
  }
  revalidatePath("/", "layout");
  revalidatePath("/admin", "layout");
}

// ===========================================================================
// Rezervace
// ===========================================================================
const STATUSES = ["pending", "confirmed", "completed", "cancelled"] as const;

export async function setBookingStatus(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  try {
    const supabase = await adminClient();
    const id = String(formData.get("id") ?? "");
    const status = String(formData.get("status") ?? "") as BookingStatus;
    const notify = formData.get("notify") === "on";

    if (!id || !STATUSES.includes(status)) return fail("Neplatný stav rezervace.");

    const { data: booking, error } = await supabase
      .from("bookings")
      .update({ status })
      .eq("id", id)
      .select("*")
      .single<Booking>();

    if (error || !booking) return fail("Změnu se nepodařilo uložit.");

    if (notify && (status === "confirmed" || status === "cancelled")) {
      const [{ data: service }, settings] = await Promise.all([
        supabase.from("services").select("*").eq("id", booking.service_id).single<Service>(),
        getSiteSettings(),
      ]);
      if (service) {
        await sendStatusUpdate({ booking, service, settings }).catch(() => null);
      }
    }

    revalidateSite();
    revalidatePath("/ucet");
    return ok("Stav rezervace je aktualizovaný.");
  } catch (e) {
    return fail((e as Error).message);
  }
}

export async function saveBookingNote(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  try {
    const supabase = await adminClient();
    const id = String(formData.get("id") ?? "");
    const note = String(formData.get("admin_note") ?? "").slice(0, 2000);

    const { error } = await supabase
      .from("bookings")
      .update({ admin_note: note || null })
      .eq("id", id);

    if (error) return fail("Poznámku se nepodařilo uložit.");
    revalidatePath("/admin");
    return ok("Poznámka uložena.");
  } catch (e) {
    return fail((e as Error).message);
  }
}

// ===========================================================================
// Služby
// ===========================================================================
const serviceSchema = z.object({
  id: z.string().uuid().optional().or(z.literal("")),
  name: z.string().trim().min(2, "Zadejte název služby."),
  slug: z
    .string()
    .trim()
    .regex(/^[a-z0-9-]+$/, "Slug smí obsahovat jen malá písmena, čísla a pomlčky."),
  tagline: z.string().trim().max(120).optional().or(z.literal("")),
  description: z.string().trim().max(1200).optional().or(z.literal("")),
  category: z.string().trim().min(1, "Zadejte kategorii."),
  price_from: z.coerce.number().int().min(0),
  price_note: z.string().trim().max(40).optional().or(z.literal("")),
  duration_min: z.coerce.number().int().min(15, "Minimálně 15 minut.").max(2880),
  features: z.string().optional().or(z.literal("")),
  highlight: z.coerce.boolean().optional(),
  whole_day: z.coerce.boolean().optional(),
  active: z.coerce.boolean().optional(),
  sort_order: z.coerce.number().int().min(0).max(9999),
});

export async function saveService(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  try {
    const supabase = await adminClient();
    const parsed = serviceSchema.safeParse({
      id: formData.get("id"),
      name: formData.get("name"),
      slug: formData.get("slug"),
      tagline: formData.get("tagline"),
      description: formData.get("description"),
      category: formData.get("category"),
      price_from: formData.get("price_from"),
      price_note: formData.get("price_note"),
      duration_min: formData.get("duration_min"),
      features: formData.get("features"),
      highlight: formData.get("highlight") === "on",
      whole_day: formData.get("whole_day") === "on",
      active: formData.get("active") === "on",
      sort_order: formData.get("sort_order") || 0,
    });

    if (!parsed.success) return fail(parsed.error.issues[0]!.message);

    const { id, features, ...rest } = parsed.data;
    const payload = {
      ...rest,
      tagline: rest.tagline || null,
      description: rest.description || null,
      price_note: rest.price_note || null,
      highlight: Boolean(rest.highlight),
      whole_day: Boolean(rest.whole_day),
      active: Boolean(rest.active),
      features: (features ?? "")
        .split("\n")
        .map((f) => f.trim())
        .filter(Boolean),
    };

    const { error } = id
      ? await supabase.from("services").update(payload).eq("id", id)
      : await supabase.from("services").insert(payload);

    if (error) {
      return fail(
        error.code === "23505"
          ? "Služba s tímto slugem už existuje."
          : "Službu se nepodařilo uložit.",
      );
    }

    revalidateSite(TAGS.services);
    return ok(id ? "Služba upravena." : "Služba přidána.");
  } catch (e) {
    return fail((e as Error).message);
  }
}

export async function deleteService(formData: FormData) {
  const supabase = await adminClient();
  const id = String(formData.get("id") ?? "");
  if (id) await supabase.from("services").delete().eq("id", id);
  revalidateSite(TAGS.services);
}

// ===========================================================================
// Galerie
// ===========================================================================
const gallerySchema = z.object({
  id: z.string().uuid().optional().or(z.literal("")),
  title: z.string().trim().min(2, "Zadejte název zakázky."),
  car: z.string().trim().max(80).optional().or(z.literal("")),
  description: z.string().trim().max(600).optional().or(z.literal("")),
  image_url: z.string().trim().url("Nahrajte prosím fotku „po“."),
  before_url: z.string().trim().url().optional().or(z.literal("")),
  featured: z.coerce.boolean().optional(),
  sort_order: z.coerce.number().int().min(0).max(9999),
});

export async function saveGalleryItem(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  try {
    const supabase = await adminClient();
    const parsed = gallerySchema.safeParse({
      id: formData.get("id"),
      title: formData.get("title"),
      car: formData.get("car"),
      description: formData.get("description"),
      image_url: formData.get("image_url"),
      before_url: formData.get("before_url"),
      featured: formData.get("featured") === "on",
      sort_order: formData.get("sort_order") || 0,
    });

    if (!parsed.success) return fail(parsed.error.issues[0]!.message);

    const { id, ...rest } = parsed.data;
    const payload = {
      ...rest,
      car: rest.car || null,
      description: rest.description || null,
      before_url: rest.before_url || null,
      featured: Boolean(rest.featured),
    };

    const { error } = id
      ? await supabase.from("gallery_items").update(payload).eq("id", id)
      : await supabase.from("gallery_items").insert(payload);

    if (error) return fail("Zakázku se nepodařilo uložit.");

    revalidateSite(TAGS.gallery);
    return ok(id ? "Zakázka upravena." : "Zakázka přidána do galerie.");
  } catch (e) {
    return fail((e as Error).message);
  }
}

export async function deleteGalleryItem(formData: FormData) {
  const supabase = await adminClient();
  const id = String(formData.get("id") ?? "");
  if (id) await supabase.from("gallery_items").delete().eq("id", id);
  revalidateSite(TAGS.gallery);
}

// ===========================================================================
// Dárkové poukazy
// ===========================================================================
const voucherSchema = z.object({
  id: z.string().uuid().optional().or(z.literal("")),
  title: z.string().trim().min(2, "Zadejte název poukazu."),
  description: z.string().trim().max(600).optional().or(z.literal("")),
  value: z.coerce.number().int().min(0).max(1_000_000),
  service_id: z.string().uuid().optional().or(z.literal("")),
  validity_months: z.coerce
    .number()
    .int()
    .min(1, "Platnost musí být alespoň 1 měsíc.")
    .max(60),
  highlight: z.coerce.boolean().optional(),
  active: z.coerce.boolean().optional(),
  sort_order: z.coerce.number().int().min(0).max(9999),
});

export async function saveVoucher(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  try {
    const supabase = await adminClient();
    const parsed = voucherSchema.safeParse({
      id: formData.get("id"),
      title: formData.get("title"),
      description: formData.get("description"),
      value: formData.get("value"),
      service_id: formData.get("service_id"),
      validity_months: formData.get("validity_months"),
      highlight: formData.get("highlight") === "on",
      active: formData.get("active") === "on",
      sort_order: formData.get("sort_order") || 0,
    });

    if (!parsed.success) return fail(parsed.error.issues[0]!.message);

    const { id, ...rest } = parsed.data;
    const payload = {
      ...rest,
      description: rest.description || null,
      service_id: rest.service_id || null,
      highlight: Boolean(rest.highlight),
      active: Boolean(rest.active),
    };

    const { error } = id
      ? await supabase.from("vouchers").update(payload).eq("id", id)
      : await supabase.from("vouchers").insert(payload);

    if (error) return fail("Poukaz se nepodařilo uložit.");

    revalidateSite(TAGS.vouchers);
    return ok(id ? "Poukaz upraven." : "Poukaz přidán.");
  } catch (e) {
    return fail((e as Error).message);
  }
}

export async function deleteVoucher(formData: FormData) {
  const supabase = await adminClient();
  const id = String(formData.get("id") ?? "");
  if (id) await supabase.from("vouchers").delete().eq("id", id);
  revalidateSite(TAGS.vouchers);
}

// ===========================================================================
// Recenze
// ===========================================================================
export async function setReviewFlags(formData: FormData) {
  const supabase = await adminClient();
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const patch: { approved?: boolean; featured?: boolean } = {};
  if (formData.has("approved")) patch.approved = formData.get("approved") === "true";
  if (formData.has("featured")) patch.featured = formData.get("featured") === "true";

  if (Object.keys(patch).length > 0) {
    await supabase.from("reviews").update(patch).eq("id", id);
  }
  revalidateSite(TAGS.reviews);
}

export async function deleteReview(formData: FormData) {
  const supabase = await adminClient();
  const id = String(formData.get("id") ?? "");
  if (id) await supabase.from("reviews").delete().eq("id", id);
  revalidateSite(TAGS.reviews);
}

// ===========================================================================
// Vzhled a obsah webu
// ===========================================================================
export async function saveSettings(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  try {
    const supabase = await adminClient();
    const raw = String(formData.get("data") ?? "");

    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      return fail("Data nastavení jsou poškozená. Obnovte stránku a zkuste to znovu.");
    }

    // Sloučením s výchozím tvarem zahodíme nečekané klíče a doplníme chybějící.
    const data = mergeSettings(DEFAULT_SETTINGS, parsed);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { error } = await supabase
      .from("site_settings")
      .upsert({ id: true, data, updated_at: new Date().toISOString(), updated_by: user?.id ?? null });

    if (error) return fail("Nastavení se nepodařilo uložit.");

    revalidateSite(TAGS.settings);
    return ok("Vzhled webu je aktualizovaný.");
  } catch (e) {
    return fail((e as Error).message);
  }
}

// ===========================================================================
// Provoz — otevírací doba a blokace
// ===========================================================================
export async function saveBusinessHours(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  try {
    const supabase = await adminClient();
    const rows = [];

    for (let weekday = 0; weekday <= 6; weekday++) {
      const open = String(formData.get(`open_${weekday}`) ?? "08:00");
      const close = String(formData.get(`close_${weekday}`) ?? "17:00");
      const closed = formData.get(`closed_${weekday}`) === "on";

      if (!closed && close <= open) {
        return fail(`Zavírací čas musí být později než otevírací (den ${weekday}).`);
      }
      rows.push({ weekday, open_time: open, close_time: close, closed });
    }

    const { error } = await supabase.from("business_hours").upsert(rows);
    if (error) return fail("Otevírací dobu se nepodařilo uložit.");

    revalidateSite(TAGS.hours);
    return ok("Otevírací doba uložena.");
  } catch (e) {
    return fail((e as Error).message);
  }
}

export async function addBlockedSlot(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  try {
    const supabase = await adminClient();
    const date = String(formData.get("date") ?? "");
    const from = String(formData.get("from") ?? "");
    const to = String(formData.get("to") ?? "");
    const reason = String(formData.get("reason") ?? "").slice(0, 200);
    const wholeDay = formData.get("wholeDay") === "on";

    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return fail("Vyberte datum.");

    const startsAt = zonedToUtc(date, wholeDay ? "00:00" : from || "00:00");
    const endsAt = zonedToUtc(date, wholeDay ? "23:59" : to || "23:59");

    if (endsAt <= startsAt) return fail("Konec musí být později než začátek.");

    const { error } = await supabase.from("blocked_slots").insert({
      starts_at: startsAt.toISOString(),
      ends_at: endsAt.toISOString(),
      reason: reason || null,
    });

    if (error) return fail("Blokaci se nepodařilo uložit.");

    revalidatePath("/admin/provoz");
    return ok("Termín je zablokovaný.");
  } catch (e) {
    return fail((e as Error).message);
  }
}

export async function deleteBlockedSlot(formData: FormData) {
  const supabase = await adminClient();
  const id = String(formData.get("id") ?? "");
  if (id) await supabase.from("blocked_slots").delete().eq("id", id);
  revalidatePath("/admin/provoz");
}
