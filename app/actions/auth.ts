"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

export type AuthState = { status: "idle" | "error" | "info"; message?: string };

const safeNext = (value: FormDataEntryValue | null) => {
  const next = typeof value === "string" ? value : "";
  return next.startsWith("/") && !next.startsWith("//") ? next : "/ucet";
};

/** Přeloží nejčastější chyby Supabase do češtiny. */
function translate(message: string): string {
  const m = message.toLowerCase();
  if (m.includes("invalid login credentials")) return "Nesprávný e-mail nebo heslo.";
  if (m.includes("email not confirmed"))
    return "E-mail zatím není potvrzený. Zkontrolujte schránku.";
  if (m.includes("already registered") || m.includes("already been registered"))
    return "Účet s tímto e-mailem už existuje. Zkuste se přihlásit.";
  if (m.includes("password should be")) return "Heslo musí mít alespoň 8 znaků.";
  if (m.includes("rate limit") || m.includes("too many"))
    return "Příliš mnoho pokusů. Zkuste to prosím za chvíli.";
  return "Něco se nepovedlo. Zkuste to prosím znovu.";
}

// ---------------------------------------------------------------------------
// Přihlášení
// ---------------------------------------------------------------------------
const signInSchema = z.object({
  email: z.string().trim().email("Zadejte platný e-mail."),
  password: z.string().min(1, "Zadejte heslo."),
});

export async function signIn(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const parsed = signInSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { status: "error", message: parsed.error.issues[0]!.message };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error) return { status: "error", message: translate(error.message) };

  revalidatePath("/", "layout");
  redirect(safeNext(formData.get("next")));
}

// ---------------------------------------------------------------------------
// Registrace
// ---------------------------------------------------------------------------
const signUpSchema = z.object({
  fullName: z.string().trim().min(2, "Zadejte prosím jméno a příjmení."),
  email: z.string().trim().email("Zadejte platný e-mail."),
  phone: z
    .string()
    .trim()
    .min(9, "Zadejte telefonní číslo.")
    .max(20, "Telefonní číslo je příliš dlouhé."),
  password: z.string().min(8, "Heslo musí mít alespoň 8 znaků."),
});

export async function signUp(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const parsed = signUpSchema.safeParse({
    fullName: formData.get("fullName"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { status: "error", message: parsed.error.issues[0]!.message };
  }

  const { fullName, email, phone, password } = parsed.data;
  const supabase = await createClient();

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName, phone },
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}/auth/callback`,
    },
  });

  if (error) return { status: "error", message: translate(error.message) };

  // Bez session = Supabase čeká na potvrzení e-mailu.
  if (!data.session) {
    return {
      status: "info",
      message:
        "Účet je založený. Potvrďte prosím e-mail odkazem, který jsme vám poslali, a pak se přihlaste.",
    };
  }

  revalidatePath("/", "layout");
  redirect(safeNext(formData.get("next")));
}

// ---------------------------------------------------------------------------
// Úprava profilu
// ---------------------------------------------------------------------------
const profileSchema = z.object({
  full_name: z.string().trim().min(2, "Zadejte jméno a příjmení."),
  phone: z.string().trim().min(9, "Zadejte telefonní číslo."),
  car_make: z.string().trim().max(60).optional().or(z.literal("")),
  car_model: z.string().trim().max(60).optional().or(z.literal("")),
  car_plate: z.string().trim().max(20).optional().or(z.literal("")),
});

export async function updateProfile(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { status: "error", message: "Nejste přihlášení." };

  const parsed = profileSchema.safeParse({
    full_name: formData.get("full_name"),
    phone: formData.get("phone"),
    car_make: formData.get("car_make"),
    car_model: formData.get("car_model"),
    car_plate: formData.get("car_plate"),
  });

  if (!parsed.success) {
    return { status: "error", message: parsed.error.issues[0]!.message };
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      full_name: parsed.data.full_name,
      phone: parsed.data.phone,
      car_make: parsed.data.car_make || null,
      car_model: parsed.data.car_model || null,
      car_plate: parsed.data.car_plate || null,
    })
    .eq("id", user.id);

  if (error) return { status: "error", message: "Údaje se nepodařilo uložit." };

  revalidatePath("/ucet");
  revalidatePath("/rezervace");
  return { status: "info", message: "Údaje jsou uložené. Předvyplníme je při rezervaci." };
}

// ---------------------------------------------------------------------------
// Zrušení vlastní rezervace
// ---------------------------------------------------------------------------
export async function cancelOwnBooking(formData: FormData) {
  const bookingId = String(formData.get("bookingId") ?? "");
  if (!bookingId) return;

  const supabase = await createClient();
  await supabase.rpc("cancel_my_booking", { booking_id: bookingId });

  revalidatePath("/ucet");
}
