import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthCard, AuthForm } from "@/components/site/auth-form";
import { getSessionUser } from "@/lib/auth";

export const metadata: Metadata = { title: "Přihlášení" };

export default async function SignInPage({
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
      eyebrow="Váš účet"
      title="Vítejte zpátky"
      subtitle="Přihlaste se a rezervace se vám předvyplní vašimi údaji."
      footer={
        <>
          Ještě nemáte účet?{" "}
          <Link
            href={`/registrace${next ? `?next=${encodeURIComponent(next)}` : ""}`}
            className="text-accent font-medium hover:underline"
          >
            Zaregistrujte se
          </Link>
        </>
      }
    >
      <AuthForm mode="signin" next={next} />
    </AuthCard>
  );
}
