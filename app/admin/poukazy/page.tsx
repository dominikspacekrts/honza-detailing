import { VouchersManager } from "@/components/admin/vouchers-manager";
import { AdminHeader } from "@/components/admin/ui";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Dárkové poukazy" };

export default async function AdminVouchersPage() {
  const supabase = await createClient();

  const [vouchersRes, servicesRes] = await Promise.all([
    supabase.from("vouchers").select("*").order("sort_order", { ascending: true }),
    supabase
      .from("services")
      .select("id, name, price_from")
      .eq("active", true)
      .order("sort_order", { ascending: true }),
  ]);

  return (
    <>
      <AdminHeader
        eyebrow="Nabídka"
        title="Dárkové poukazy"
        subtitle="Co si u vás jde koupit jako dárek. Změny se ihned projeví na hlavní stránce v sekci Dárkové poukazy."
      />
      <VouchersManager
        vouchers={vouchersRes.data ?? []}
        services={servicesRes.data ?? []}
      />
    </>
  );
}
