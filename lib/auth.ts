import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/database.types";

export type SessionUser = {
  id: string;
  email: string;
  profile: Profile | null;
};

/**
 * Vrátí přihlášeného uživatele i s profilem, nebo null.
 * `cache()` zajistí, že se v rámci jednoho požadavku ptáme jen jednou —
 * volá to layout i jednotlivé stránky.
 */
export const getSessionUser = cache(async (): Promise<SessionUser | null> => {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;

    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();

    return { id: user.id, email: user.email ?? "", profile: profile ?? null };
  } catch {
    return null;
  }
});

export async function requireAdmin(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user?.profile?.is_admin) {
    throw new Error("Přístup jen pro administrátory.");
  }
  return user;
}
