"use server";

import { updateTag } from "next/cache";
import { z } from "zod";
import { TAGS } from "@/lib/data";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { createAdminClient, createClient } from "@/lib/supabase/server";

const schema = z.object({
  rating: z.coerce.number().int().min(1, "Vyberte hodnocení").max(5),
  body: z
    .string()
    .trim()
    .min(20, "Napište prosím alespoň 20 znaků.")
    .max(1500, "Recenze je příliš dlouhá."),
  car: z.string().trim().max(80).optional().or(z.literal("")),
  authorName: z.string().trim().max(80).optional().or(z.literal("")),
});

export type ReviewFormState = {
  status: "idle" | "success" | "error";
  message?: string;
};

/**
 * Přijme recenzi od kohokoliv — přihlášení není potřeba.
 *
 * Zápis jde přes service-role klienta, protože RLS povoluje vkládání jen
 * přihlášeným. Díky tomu tu držíme kontrolu nad tím, co se ukládá:
 * `approved` je vždy false, takže se bez schválení v adminu nic nezveřejní.
 */
export async function submitReview(
  _prev: ReviewFormState,
  formData: FormData,
): Promise<ReviewFormState> {
  // Skryté pole, které vyplní jen robot — tváříme se, že se odeslalo.
  if (String(formData.get("website") ?? "").trim() !== "") {
    return { status: "success", message: "Děkujeme za recenzi." };
  }

  // Honeypot chytí hloupé roboty; strop na IP zbytek.
  const limit = rateLimit("review", await clientIp(), 3, 3600);
  if (!limit.ok) {
    return {
      status: "error",
      message: "Z této adresy přišlo příliš mnoho recenzí. Zkuste to prosím později.",
    };
  }

  const parsed = schema.safeParse({
    rating: formData.get("rating"),
    body: formData.get("body"),
    car: formData.get("car"),
    authorName: formData.get("authorName"),
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: parsed.error.issues[0]?.message ?? "Zkontrolujte prosím formulář.",
    };
  }

  // Přihlášenému vezmeme jméno z profilu, host si ho vyplní sám.
  let userId: string | null = null;
  let authorName = parsed.data.authorName ?? "";

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      userId = user.id;
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", user.id)
        .maybeSingle();

      authorName =
        profile?.full_name?.trim() || authorName || user.email?.split("@")[0] || "";
    }
  } catch {
    // Bez session se recenze uloží jako od hosta.
  }

  if (!authorName.trim()) {
    return {
      status: "error",
      message: "Zadejte prosím jméno, pod kterým se recenze zobrazí.",
    };
  }

  const { error } = await createAdminClient()
    .from("reviews")
    .insert({
      user_id: userId,
      author_name: authorName.trim().slice(0, 80),
      car: parsed.data.car || null,
      rating: parsed.data.rating,
      body: parsed.data.body,
      approved: false,
    });

  if (error) {
    console.error("[reviews] uložení selhalo:", error);
    return {
      status: "error",
      message: "Recenzi se nepodařilo uložit. Zkuste to prosím znovu.",
    };
  }

  updateTag(TAGS.reviews);
  return {
    status: "success",
    message: "Děkujeme! Recenzi zveřejníme, jakmile ji zkontrolujeme.",
  };
}
