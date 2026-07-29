"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/lib/database.types";

let browserClient: ReturnType<typeof createBrowserClient<Database>> | undefined;

/**
 * Jeden sdílený klient na celou aplikaci.
 *
 * Každé volání `createBrowserClient` zakládá vlastní auth vrstvu a ty se pak
 * mezi sebou perou o zámek — druhému klientovi `getSession()` nikdy nedoběhne
 * a komponenta zůstane viset v načítacím stavu. Proto instanci držíme jednu.
 */
export function createClient() {
  browserClient ??= createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
  return browserClient;
}
