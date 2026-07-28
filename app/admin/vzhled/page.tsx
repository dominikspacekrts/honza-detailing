import { SiteEditor } from "@/components/admin/site-editor";
import { AdminHeader } from "@/components/admin/ui";
import { getSiteSettings } from "@/lib/settings";

export const metadata = { title: "Úprava webu" };

export default async function AdminAppearancePage() {
  const settings = await getSiteSettings();

  return (
    <>
      <AdminHeader
        eyebrow="Obsah a vzhled"
        title="Úprava webu"
        subtitle="Barvy, texty i fotky hlavní stránky. Barvy vidíte hned v administraci, po uložení se projeví na webu."
      />
      <SiteEditor settings={settings} />
    </>
  );
}
