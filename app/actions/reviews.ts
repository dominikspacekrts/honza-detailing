"use server";

import { updateTag } from "next/cache";
import { z } from "zod";
import { TAGS } from "@/lib/data";
import { createClient } from "@/lib/supabase/server";

const schema = z.object({
  rating: z.coerce.number().int().min(1, "Vyberte hodnocení").max(5),
  body: z
    .string()
    .trim()
    .min(20, "Napište prosím alespoň 20 znaků.")
    .max(1500, "Recenze je příliš dlouhá."),
  car: z.string().trim().max(80).optional().or(z.literal("")),
});

export type ReviewFormState = {
  status: "idle" | "success" | "error";
  message?: string;
};

export async function submitReview(
  _prev: ReviewFormState,
  formData: FormData,
): Promise<ReviewFormState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { status: "error", message: "Recenzi mohou přidat jen přihlášení zákazníci." };
  }

  const parsed = schema.safeParse({
    rating: formData.get("rating"),
    body: formData.get("body"),
    car: formData.get("car"),
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: parsed.error.issues[0]?.message ?? "Zkontrolujte prosím formulář.",
    };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .maybeSingle();

  const { error } = await supabase.from("reviews").insert({
    user_id: user.id,
    author_name: profile?.full_name?.trim() || user.email?.split("@")[0] || "Zákazník",
    car: parsed.data.car || null,
    rating: parsed.data.rating,
    body: parsed.data.body,
    approved: false,
  });

  if (error) {
    return { status: "error", message: "Recenzi se nepodařilo uložit. Zkuste to prosím znovu." };
  }

  updateTag(TAGS.reviews);
  return {
    status: "success",
    message: "Děkujeme! Recenzi zveřejníme, jakmile ji zkontrolujeme.",
  };
}
