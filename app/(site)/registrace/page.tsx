import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthCard, AuthForm } from "@/components/site/auth-form";
import { getSessionUser } from "@/lib/auth";

export const metadata: Metadata = { title: "Registrace" };

export default async function SignUpPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  const user = await getSessionUser();
  // `//zlo.cz` je taky „cesta začínající lomítkem", ale prohlížeč ji přečte
  // jako cizí doménu — proto se kontroluje i dvojité lomítko.
  if (user) redirect(next?.startsWith("/") && !next.startsWith("//") ? next : "/ucet");

  return (
    <AuthCard
      eyebrow="Nový účet"
      title="Rezervujte na dvě kliknutí"
      subtitle="Uložíme si vaše jméno, telefon i vozidlo. Při příští rezervaci už nic nevyplňujete."
      footer={
        <>
          Už máte účet?{" "}
          <Link
            href={`/prihlaseni${next ? `?next=${encodeURIComponent(next)}` : ""}`}
            className="text-accent font-medium hover:underline"
          >
            Přihlaste se
          </Link>
        </>
      }
    >
      <AuthForm mode="signup" next={next} />
    </AuthCard>
  );
}
