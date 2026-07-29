import { Header } from "@/components/site/header";
import { Footer } from "@/components/site/footer";
import { getSettings } from "@/lib/data";

export default async function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const settings = await getSettings();

  return (
    <>
      <Header
        brandName={settings.brand.name}
        tagline={settings.brand.tagline}
        logoUrl={settings.brand.logoUrl}
      />
      <main className="flex-1 pt-18">{children}</main>
      <Footer settings={settings} />
    </>
  );
}
