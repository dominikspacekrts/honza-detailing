import { Header } from "@/components/site/header";
import { Footer } from "@/components/site/footer";
import { getSessionUser } from "@/lib/auth";
import { getSiteSettings } from "@/lib/settings";

export default async function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [settings, user] = await Promise.all([getSiteSettings(), getSessionUser()]);

  return (
    <>
      <Header
        brandName={settings.brand.name}
        tagline={settings.brand.tagline}
        logoUrl={settings.brand.logoUrl}
        user={
          user
            ? {
                email: user.email,
                name: user.profile?.full_name ?? null,
                isAdmin: user.profile?.is_admin ?? false,
              }
            : null
        }
      />
      <main className="flex-1 pt-18">{children}</main>
      <Footer settings={settings} />
    </>
  );
}
