import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AdminShell } from "@/components/admin/shell";
import { getSessionUser } from "@/lib/auth";
import { getSiteSettings } from "@/lib/settings";

export const metadata: Metadata = {
  title: { default: "Administrace", template: "%s — Administrace" },
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getSessionUser();
  if (!user) redirect("/prihlaseni?next=/admin");
  if (!user.profile?.is_admin) redirect("/");

  const settings = await getSiteSettings();

  return (
    <AdminShell
      brandName={settings.brand.name}
      userName={user.profile.full_name ?? user.email}
    >
      {children}
    </AdminShell>
  );
}
