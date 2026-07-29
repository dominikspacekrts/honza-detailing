"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Logo } from "@/components/logo";
import { createClient } from "@/lib/supabase/client";

type HeaderUser = {
  name: string | null;
  isAdmin: boolean;
};

const NAV = [
  { href: "/#sluzby", label: "Služby" },
  { href: "/#pribeh", label: "Příběh" },
  { href: "/#galerie", label: "Realizace" },
  { href: "/#poukazy", label: "Poukazy" },
  { href: "/#recenze", label: "Recenze" },
  { href: "/#kontakt", label: "Kontakt" },
];

export function Header({
  brandName,
  tagline,
  logoUrl,
}: {
  brandName: string;
  tagline: string;
  logoUrl: string;
}) {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  /** `undefined` = ještě nevíme, `null` = nepřihlášen. */
  const [user, setUser] = useState<HeaderUser | null | undefined>(undefined);
  const router = useRouter();

  /**
   * Stav přihlášení řešíme až v prohlížeči. Na serveru by to znamenalo
   * ověřovat token u Supabase při každém zobrazení stránky — a veřejné
   * stránky by se kvůli tomu nedaly předgenerovat.
   */
  useEffect(() => {
    const supabase = createClient();
    let active = true;

    async function resolve(userId: string | null) {
      if (!userId) {
        if (active) setUser(null);
        return;
      }
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, is_admin")
        .eq("id", userId)
        .maybeSingle();

      if (active) {
        setUser({
          name: profile?.full_name ?? null,
          isAdmin: profile?.is_admin ?? false,
        });
      }
    }

    supabase.auth
      .getSession()
      .then(({ data }) => resolve(data.session?.user.id ?? null));

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      void resolve(session?.user.id ?? null);
    });

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-500 ${
        scrolled
          ? "border-b border-[var(--line)] bg-[color-mix(in_oklab,var(--bg)_82%,transparent)] backdrop-blur-xl"
          : "border-b border-transparent"
      }`}
    >
      <div className="container-page flex h-18 items-center justify-between gap-6 py-3.5">
        <Link href="/" className="shrink-0 transition-opacity hover:opacity-80">
          <Logo name={brandName} tagline={tagline} imageUrl={logoUrl} size={38} />
        </Link>

        <nav className="hidden items-center gap-1 lg:flex">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-ink-muted hover:text-ink relative rounded-full px-3.5 py-2 text-sm font-medium transition-colors hover:bg-[color-mix(in_oklab,var(--ink)_6%,transparent)]"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden min-h-9 items-center gap-2.5 lg:flex">
          {user === undefined ? (
            <span className="skeleton h-9 w-44 rounded-full" aria-hidden />
          ) : user ? (
            <>
              {user.isAdmin && (
                <Link href="/admin" className="btn btn-ghost btn-sm">
                  Admin
                </Link>
              )}
              <Link href="/ucet" className="btn btn-ghost btn-sm">
                {user.name?.split(" ")[0] ?? "Můj účet"}
              </Link>
              <button onClick={signOut} className="btn btn-ghost btn-sm" type="button">
                Odhlásit
              </button>
            </>
          ) : (
            <>
              <Link href="/prihlaseni" className="btn btn-ghost btn-sm">
                Přihlásit
              </Link>
              <Link href="/registrace" className="btn btn-ghost btn-sm">
                Registrovat
              </Link>
            </>
          )}
          <Link href="/rezervace" className="btn btn-primary btn-sm">
            Rezervovat
          </Link>
        </div>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? "Zavřít menu" : "Otevřít menu"}
          aria-expanded={open}
          className="glass relative z-50 grid size-11 place-items-center rounded-full lg:hidden"
        >
          <span className="relative block h-3.5 w-5">
            <span
              className={`bg-ink absolute left-0 block h-0.5 w-5 rounded transition-all duration-300 ${
                open ? "top-1.5 rotate-45" : "top-0"
              }`}
            />
            <span
              className={`bg-ink absolute left-0 block h-0.5 w-5 rounded transition-all duration-300 ${
                open ? "top-1.5 -rotate-45" : "top-3"
              }`}
            />
          </span>
        </button>
      </div>

      {/* Mobilní menu */}
      <div
        className={`fixed inset-0 top-0 z-40 origin-top bg-[color-mix(in_oklab,var(--bg)_96%,transparent)] backdrop-blur-2xl transition-all duration-400 lg:hidden ${
          open
            ? "pointer-events-auto opacity-100"
            : "pointer-events-none -translate-y-3 opacity-0"
        }`}
      >
        <div className="container-page flex h-full flex-col justify-center gap-2 pt-20 pb-12">
          {NAV.map((item, i) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              style={{ transitionDelay: open ? `${80 + i * 45}ms` : "0ms" }}
              className={`font-display border-b border-[var(--line)] py-4 text-2xl font-semibold transition-all duration-500 ${
                open ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
              }`}
            >
              {item.label}
            </Link>
          ))}

          <div className="mt-8 flex flex-col gap-3" onClick={() => setOpen(false)}>
            <Link href="/rezervace" className="btn btn-primary w-full">
              Rezervovat termín
            </Link>
            {user ? (
              <>
                <Link href="/ucet" className="btn btn-ghost w-full">
                  Můj účet
                </Link>
                {user.isAdmin && (
                  <Link href="/admin" className="btn btn-ghost w-full">
                    Administrace
                  </Link>
                )}
                <button onClick={signOut} className="btn btn-ghost w-full" type="button">
                  Odhlásit se
                </button>
              </>
            ) : (
              <>
                <Link href="/prihlaseni" className="btn btn-ghost w-full">
                  Přihlásit se
                </Link>
                <Link href="/registrace" className="btn btn-ghost w-full">
                  Vytvořit účet
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
