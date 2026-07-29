import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/session";

/** Obnovuje Supabase session u každého požadavku (dřívější „middleware"). */
export async function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  /**
   * Záměrně úzký výběr. Obnova session je síťové kolo na Supabase, takže běží
   * jen tam, kde na přihlášení opravdu záleží. Veřejné stránky si session
   * čtou samy a nepotřebují ji obnovovat při každém prokliku.
   */
  matcher: ["/admin/:path*", "/ucet/:path*", "/prihlaseni", "/registrace"],
};
