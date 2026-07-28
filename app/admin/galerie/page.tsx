import { GalleryManager } from "@/components/admin/gallery-manager";
import { AdminHeader } from "@/components/admin/ui";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Galerie" };

export default async function AdminGalleryPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("gallery_items")
    .select("*")
    .order("featured", { ascending: false })
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });

  return (
    <>
      <AdminHeader
        eyebrow="Reference"
        title="Galerie hotových zakázek"
        subtitle="Fotky se okamžitě objeví na hlavní stránce v sekci Realizace. Když nahrajete i fotku „před“, návštěvník dostane posuvník pro porovnání."
      />
      <GalleryManager items={data ?? []} />
    </>
  );
}
