import Link from "next/link";
import { Contact } from "@/components/site/sections/contact";
import { GalleryGrid } from "@/components/site/sections/gallery";
import { Hero } from "@/components/site/sections/hero";
import { Process } from "@/components/site/sections/process";
import { Reviews } from "@/components/site/sections/reviews";
import { Services } from "@/components/site/sections/services";
import { Story } from "@/components/site/sections/story";
import { Vouchers } from "@/components/site/sections/vouchers";
import { SectionHeading } from "@/components/site/section-heading";
import { Reveal } from "@/components/site/reveal";
import { getSessionUser } from "@/lib/auth";
import {
  averageRating,
  getApprovedReviews,
  getBusinessHours,
  getGallery,
  getServices,
  getSettings,
  getVouchers,
} from "@/lib/data";

export default async function HomePage() {
  // Vše naráz — veřejná data jdou z cache, jen session se čte z cookies.
  const [settings, user, services, reviews, gallery, hours, vouchers] =
    await Promise.all([
      getSettings(),
      getSessionUser(),
      getServices(),
      getApprovedReviews(),
      getGallery(),
      getBusinessHours(),
      getVouchers(),
    ]);

  const average = averageRating(reviews);

  return (
    <>
      <Hero
        hero={settings.hero}
        rating={average !== null ? { average, count: reviews.length } : null}
      />

      <Services copy={settings.services} services={services} />

      <Story story={settings.story} />

      <Process />

      {/* Galerie */}
      <section id="galerie" className="scroll-mt-24 py-24 md:py-32">
        <div className="container-page">
          <SectionHeading
            eyebrow="Realizace"
            title={settings.gallery.title}
            subtitle={settings.gallery.subtitle}
          />
          <div className="mt-14">
            {gallery.length > 0 ? (
              <GalleryGrid items={gallery} />
            ) : (
              <Reveal className="card p-10 text-center">
                <p className="text-ink-muted text-sm">
                  Galerie je zatím prázdná. Fotky hotových zakázek přidáte v
                  administraci v sekci{" "}
                  <Link href="/admin/galerie" className="text-accent underline">
                    Galerie
                  </Link>
                  .
                </p>
              </Reveal>
            )}
          </div>
        </div>
      </section>

      <Vouchers
        copy={settings.vouchers}
        vouchers={vouchers}
        contact={settings.contact}
      />

      <Reviews
        copy={settings.reviews}
        reviews={reviews}
        isLoggedIn={Boolean(user)}
        average={average}
      />

      {/* Závěrečná výzva */}
      <section className="pb-8">
        <div className="container-page">
          <Reveal>
            <div
              className="card sheen glow-accent relative overflow-hidden px-8 py-14 text-center sm:px-14 sm:py-20"
              style={{ borderRadius: "calc(var(--radius) * 1.6)" }}
            >
              <div
                className="absolute inset-0 opacity-70"
                style={{
                  background:
                    "radial-gradient(60% 100% at 50% 0%, color-mix(in oklab, var(--accent) 20%, transparent), transparent 68%)",
                }}
                aria-hidden
              />
              <div className="relative">
                <div className="eyebrow mb-5">Volné termíny průběžně</div>
                <h2 className="font-display mx-auto max-w-2xl text-3xl leading-[1.1] font-bold tracking-tight text-balance sm:text-5xl">
                  Rezervujte si <span className="text-gradient">svůj den v garáži</span>
                </h2>
                <p className="text-ink-muted mx-auto mt-5 max-w-xl text-pretty">
                  {settings.booking.paymentNote}
                </p>
                <div className="mt-9 flex flex-wrap justify-center gap-3">
                  <Link href="/rezervace" className="btn btn-primary">
                    Vybrat termín
                  </Link>
                  <a
                    href={`tel:${settings.contact.phone.replace(/\s/g, "")}`}
                    className="btn btn-ghost"
                  >
                    {settings.contact.phone}
                  </a>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      <Contact contact={settings.contact} hours={hours} />
    </>
  );
}
