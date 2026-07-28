"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { LogoMark } from "@/components/logo";
import { createClient } from "@/lib/supabase/client";

const NAV = [
  { href: "/admin", label: "Přehled dne", exact: true, icon: "M3 12h4l3 8 4-16 3 8h4" },
  { href: "/admin/rezervace", label: "Rezervace", icon: "M3 9h18M7 3v3m10-3v3M5 5h14a2 2 0 012 2v12a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2z" },
  { href: "/admin/sluzby", label: "Služby a ceník", icon: "M4 7h16M4 12h16M4 17h10" },
  { href: "/admin/galerie", label: "Galerie", icon: "M4 5h16v14H4zM4 15l4.5-4.5 3.5 3.5 3-3L20 16M9 9.5a1 1 0 110-2 1 1 0 010 2z" },
  { href: "/admin/recenze", label: "Recenze", icon: "M12 3l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.9 6.1 21l1.2-6.5L2.5 9.9 9.1 9z" },
  { href: "/admin/vzhled", label: "Úprava webu", icon: "M12 3a9 9 0 100 18 2 2 0 001.7-3 2 2 0 011.7-3H18a3 3 0 003-3 9 9 0 00-9-9zM7.5 12a1 1 0 110-2 1 1 0 010 2zm3-4a1 1 0 110-2 1 1 0 010 2zm5 0a1 1 0 110-2 1 1 0 010 2z" },
  { href: "/admin/provoz", label: "Provoz a volno", icon: "M12 7v5l3 2M21 12a9 9 0 11-18 0 9 9 0 0118 0z" },
];

export function AdminShell({
  brandName,
  userName,
  children,
}: {
  brandName: string;
  userName: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  async function signOut() {
    await createClient().auth.signOut();
    router.push("/");
    router.refresh();
  }

  const nav = (
    <nav className="flex flex-col gap-1">
      {NAV.map((item) => {
        const active = item.exact
          ? pathname === item.href
          : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setOpen(false)}
            className={`flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all ${
              active
                ? "bg-[color-mix(in_oklab,var(--accent)_14%,transparent)] text-[var(--accent)]"
                : "text-ink-muted hover:bg-[color-mix(in_oklab,var(--ink)_6%,transparent)] hover:text-[var(--ink)]"
            }`}
          >
            <svg
              viewBox="0 0 24 24"
              className="size-4.5 shrink-0"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d={item.icon} />
            </svg>
            {item.label}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <div className="flex min-h-screen">
      {/* Sidebar — desktop */}
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-[var(--line)] bg-[color-mix(in_oklab,var(--surface)_60%,transparent)] p-5 backdrop-blur-xl lg:flex">
        <Link href="/" className="flex items-center gap-3 px-1.5">
          <LogoMark size={34} static className="text-ink" />
          <span className="font-display text-xs leading-tight font-bold tracking-[0.16em] uppercase">
            {brandName}
            <span className="text-accent block text-[0.6rem] tracking-[0.2em]">
              Administrace
            </span>
          </span>
        </Link>

        <div className="mt-8 flex-1">{nav}</div>

        <div className="border-t border-[var(--line)] pt-4">
          <div className="text-ink-faint truncate px-3.5 text-xs">{userName}</div>
          <div className="mt-3 flex flex-col gap-1.5">
            <Link href="/" className="btn btn-ghost btn-sm w-full">
              Zobrazit web
            </Link>
            <button onClick={signOut} className="btn btn-ghost btn-sm w-full" type="button">
              Odhlásit se
            </button>
          </div>
        </div>
      </aside>

      {/* Horní lišta — mobil */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-40 flex items-center justify-between gap-4 border-b border-[var(--line)] bg-[color-mix(in_oklab,var(--bg)_88%,transparent)] px-5 py-3.5 backdrop-blur-xl lg:hidden">
          <Link href="/admin" className="flex items-center gap-2.5">
            <LogoMark size={30} static className="text-ink" />
            <span className="font-display text-xs font-bold tracking-[0.16em] uppercase">
              Admin
            </span>
          </Link>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="btn btn-ghost btn-sm"
            aria-expanded={open}
          >
            {open ? "Zavřít" : "Menu"}
          </button>
        </header>

        {open && (
          <div className="border-b border-[var(--line)] bg-[var(--surface)] p-5 lg:hidden">
            {nav}
            <div className="mt-4 flex gap-2 border-t border-[var(--line)] pt-4">
              <Link href="/" className="btn btn-ghost btn-sm flex-1">
                Web
              </Link>
              <button onClick={signOut} className="btn btn-ghost btn-sm flex-1" type="button">
                Odhlásit
              </button>
            </div>
          </div>
        )}

        <main className="min-w-0 flex-1 p-5 sm:p-8">{children}</main>
      </div>
    </div>
  );
}
