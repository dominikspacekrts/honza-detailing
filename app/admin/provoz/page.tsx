import { BlockedSlots, HoursEditor } from "@/components/admin/hours-editor";
import { AdminHeader } from "@/components/admin/ui";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Provoz a volno" };

export default async function AdminOperationsPage() {
  const supabase = await createClient();

  const [hoursRes, blockedRes] = await Promise.all([
    supabase.from("business_hours").select("*"),
    supabase
      .from("blocked_slots")
      .select("*")
      .gte("ends_at", new Date().toISOString())
      .order("starts_at", { ascending: true }),
  ]);

  return (
    <>
      <AdminHeader
        eyebrow="Kalendář"
        title="Provoz a volno"
        subtitle="Otevírací doba a blokace určují, které termíny zákazníci uvidí jako volné."
      />

      <div className="grid gap-6 xl:grid-cols-2 xl:items-start">
        <HoursEditor hours={hoursRes.data ?? []} />
        <BlockedSlots slots={blockedRes.data ?? []} />
      </div>
    </>
  );
}
