import { ServicesManager } from "@/components/admin/services-manager";
import { AdminHeader } from "@/components/admin/ui";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Služby a ceník" };

export default async function AdminServicesPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("services")
    .select("*")
    .order("sort_order", { ascending: true });

  return (
    <>
      <AdminHeader
        eyebrow="Nabídka"
        title="Služby a ceník"
        subtitle="Změny se ihned promítnou na web i do rezervačního formuláře. Délka služby určuje, kolik místa zabere v kalendáři."
      />
      <ServicesManager services={data ?? []} />
    </>
  );
}
