"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { saveSettings, type ActionState } from "@/app/actions/admin";
import { ImageUpload } from "@/components/admin/image-upload";
import { Feedback, SubmitButton } from "@/components/admin/ui";
import { LogoMark } from "@/components/logo";
import type { SiteSettings } from "@/lib/settings";

const initial: ActionState = { status: "idle" };

const TABS = [
  { id: "brand", label: "Značka a barvy" },
  { id: "hero", label: "Úvodní sekce" },
  { id: "story", label: "Příběh" },
  { id: "sections", label: "Nadpisy sekcí" },
  { id: "booking", label: "Rezervace" },
  { id: "contact", label: "Kontakt a SEO" },
] as const;

type TabId = (typeof TABS)[number]["id"];

const PRESETS = [
  { name: "Ledová zeleň", accent: "#22E5C8", accent2: "#3B7BFF", background: "#04060B", surface: "#0B1018" },
  { name: "Ohnivá oranž", accent: "#FF8A3D", accent2: "#FF3D6E", background: "#0A0604", surface: "#160F0A" },
  { name: "Fialová noc", accent: "#A78BFA", accent2: "#22D3EE", background: "#06050D", surface: "#100E1C" },
  { name: "Zlatý lak", accent: "#E9C46A", accent2: "#F4A261", background: "#0A0805", surface: "#151109" },
  { name: "Chladná ocel", accent: "#93C5FD", accent2: "#C4B5FD", background: "#05070D", surface: "#0D1220" },
];

export function SiteEditor({ settings }: { settings: SiteSettings }) {
  const [draft, setDraft] = useState<SiteSettings>(settings);
  const [tab, setTab] = useState<TabId>("brand");
  const [state, action] = useActionState(saveSettings, initial);

  // Živý náhled — barvy se okamžitě propíšou do celé administrace.
  useEffect(() => {
    const root = document.documentElement;
    const applied: [string, string][] = [
      ["--accent", draft.theme.accent],
      ["--accent-2", draft.theme.accent2],
      ["--bg", draft.theme.background],
      ["--surface", draft.theme.surface],
      ["--radius", `${draft.theme.radius}px`],
      ["--glow", String(draft.theme.glow / 100)],
    ];
    applied.forEach(([key, value]) => root.style.setProperty(key, value));

    return () => applied.forEach(([key]) => root.style.removeProperty(key));
  }, [draft.theme]);

  const set = <K extends keyof SiteSettings>(
    section: K,
    patch: Partial<SiteSettings[K]>,
  ) => setDraft((d) => ({ ...d, [section]: { ...d[section], ...patch } }));

  const serialized = useMemo(() => JSON.stringify(draft), [draft]);

  return (
    <form action={action}>
      <input type="hidden" name="data" value={serialized} />

      <div className="mb-7 flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`btn btn-sm ${tab === t.id ? "btn-primary" : "btn-ghost"}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_20rem] xl:items-start">
        <div className="flex flex-col gap-6">
          {/* ---------------------------------------------------- Značka */}
          {tab === "brand" && (
            <>
              <Card title="Značka">
                <div className="grid gap-5 sm:grid-cols-3">
                  <Text
                    label="Název"
                    value={draft.brand.name}
                    onChange={(name) => set("brand", { name })}
                  />
                  <Text
                    label="Zkratka"
                    value={draft.brand.short}
                    onChange={(short) => set("brand", { short })}
                  />
                  <Text
                    label="Podtitulek"
                    value={draft.brand.tagline}
                    onChange={(tagline) => set("brand", { tagline })}
                  />
                </div>
                <div className="mt-6">
                  <ImageUpload
                    name="__logo"
                    bucket="site"
                    label="Vlastní logo (nepovinné)"
                    defaultValue={draft.brand.logoUrl}
                    onValueChange={(logoUrl) => set("brand", { logoUrl })}
                    hint="Necháte-li prázdné, použije se vestavěný monogram. Nejlépe PNG/SVG s průhledným pozadím."
                  />
                </div>
              </Card>

              <Card title="Barevné schéma">
                <div className="mb-6 flex flex-wrap gap-2">
                  {PRESETS.map((preset) => (
                    <button
                      key={preset.name}
                      type="button"
                      onClick={() =>
                        set("theme", {
                          accent: preset.accent,
                          accent2: preset.accent2,
                          background: preset.background,
                          surface: preset.surface,
                        })
                      }
                      className="btn btn-ghost btn-sm gap-2"
                    >
                      <span
                        className="size-3.5 rounded-full"
                        style={{
                          background: `linear-gradient(120deg, ${preset.accent}, ${preset.accent2})`,
                        }}
                      />
                      {preset.name}
                    </button>
                  ))}
                </div>

                <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                  <Color
                    label="Hlavní akcent"
                    value={draft.theme.accent}
                    onChange={(accent) => set("theme", { accent })}
                  />
                  <Color
                    label="Doplňkový akcent"
                    value={draft.theme.accent2}
                    onChange={(accent2) => set("theme", { accent2 })}
                  />
                  <Color
                    label="Pozadí"
                    value={draft.theme.background}
                    onChange={(background) => set("theme", { background })}
                  />
                  <Color
                    label="Panely"
                    value={draft.theme.surface}
                    onChange={(surface) => set("theme", { surface })}
                  />
                </div>

                <div className="mt-7 grid gap-6 sm:grid-cols-2">
                  <Range
                    label="Zaoblení rohů"
                    value={draft.theme.radius}
                    min={0}
                    max={36}
                    unit="px"
                    onChange={(radius) => set("theme", { radius })}
                  />
                  <Range
                    label="Intenzita záře"
                    value={draft.theme.glow}
                    min={0}
                    max={100}
                    unit="%"
                    onChange={(glow) => set("theme", { glow })}
                  />
                </div>

                <Toggle
                  className="mt-5"
                  label="Jemné zrno přes celý web (filmový nádech)"
                  checked={draft.theme.grain}
                  onChange={(grain) => set("theme", { grain })}
                />
              </Card>
            </>
          )}

          {/* ------------------------------------------------------ Hero */}
          {tab === "hero" && (
            <>
              <Card title="Úvodní sekce">
                <div className="flex flex-col gap-5">
                  <Text
                    label="Odznak nad nadpisem"
                    value={draft.hero.badge}
                    onChange={(badge) => set("hero", { badge })}
                  />
                  <div className="grid gap-5 sm:grid-cols-2">
                    <Text
                      label="Nadpis — první část"
                      value={draft.hero.title}
                      onChange={(title) => set("hero", { title })}
                    />
                    <Text
                      label="Nadpis — barevná část"
                      value={draft.hero.titleAccent}
                      onChange={(titleAccent) => set("hero", { titleAccent })}
                    />
                  </div>
                  <Area
                    label="Podnadpis"
                    value={draft.hero.subtitle}
                    onChange={(subtitle) => set("hero", { subtitle })}
                  />
                  <div className="grid gap-5 sm:grid-cols-2">
                    <Text
                      label="Hlavní tlačítko"
                      value={draft.hero.ctaPrimary}
                      onChange={(ctaPrimary) => set("hero", { ctaPrimary })}
                    />
                    <Text
                      label="Vedlejší tlačítko"
                      value={draft.hero.ctaSecondary}
                      onChange={(ctaSecondary) => set("hero", { ctaSecondary })}
                    />
                  </div>
                  <ImageUpload
                    name="__hero"
                    bucket="site"
                    label="Úvodní fotka"
                    defaultValue={draft.hero.imageUrl}
                    onValueChange={(imageUrl) => set("hero", { imageUrl })}
                    hint="Nejlépe na výšku nebo čtvercová, minimálně 1200 px."
                  />
                </div>
              </Card>

              <Card
                title="Čísla pod úvodem"
                description="Čtyři údaje, které se zobrazí v pruhu pod úvodní sekcí."
              >
                <div className="flex flex-col gap-3">
                  {draft.hero.stats.map((stat, i) => (
                    <div key={i} className="flex gap-3">
                      <input
                        className="field w-32"
                        value={stat.value}
                        onChange={(e) => {
                          const stats = [...draft.hero.stats];
                          stats[i] = { ...stat, value: e.target.value };
                          set("hero", { stats });
                        }}
                        placeholder="600+"
                      />
                      <input
                        className="field flex-1"
                        value={stat.label}
                        onChange={(e) => {
                          const stats = [...draft.hero.stats];
                          stats[i] = { ...stat, label: e.target.value };
                          set("hero", { stats });
                        }}
                        placeholder="ošetřených vozů"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          set("hero", {
                            stats: draft.hero.stats.filter((_, j) => j !== i),
                          })
                        }
                        className="btn btn-ghost btn-sm text-red-300"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() =>
                      set("hero", {
                        stats: [...draft.hero.stats, { value: "", label: "" }],
                      })
                    }
                    className="btn btn-ghost btn-sm w-fit"
                  >
                    + Přidat údaj
                  </button>
                </div>
              </Card>
            </>
          )}

          {/* ---------------------------------------------------- Příběh */}
          {tab === "story" && (
            <>
              <Card title="Sekce Příběh">
                <div className="flex flex-col gap-5">
                  <div className="grid gap-5 sm:grid-cols-[10rem_1fr]">
                    <Text
                      label="Odznak"
                      value={draft.story.badge}
                      onChange={(badge) => set("story", { badge })}
                    />
                    <Text
                      label="Nadpis"
                      value={draft.story.title}
                      onChange={(title) => set("story", { title })}
                    />
                  </div>

                  <div>
                    <span className="label">Odstavce</span>
                    <div className="flex flex-col gap-3">
                      {draft.story.paragraphs.map((paragraph, i) => (
                        <div key={i} className="flex gap-3">
                          <textarea
                            className="field flex-1"
                            rows={3}
                            value={paragraph}
                            onChange={(e) => {
                              const paragraphs = [...draft.story.paragraphs];
                              paragraphs[i] = e.target.value;
                              set("story", { paragraphs });
                            }}
                          />
                          <button
                            type="button"
                            onClick={() =>
                              set("story", {
                                paragraphs: draft.story.paragraphs.filter(
                                  (_, j) => j !== i,
                                ),
                              })
                            }
                            className="btn btn-ghost btn-sm h-fit text-red-300"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() =>
                          set("story", {
                            paragraphs: [...draft.story.paragraphs, ""],
                          })
                        }
                        className="btn btn-ghost btn-sm w-fit"
                      >
                        + Přidat odstavec
                      </button>
                    </div>
                  </div>

                  <ImageUpload
                    name="__story"
                    bucket="site"
                    label="Fotka studia"
                    defaultValue={draft.story.imageUrl}
                    onValueChange={(imageUrl) => set("story", { imageUrl })}
                  />
                </div>
              </Card>

              <Card title="Milníky" description="Časová osa pod příběhem.">
                <div className="flex flex-col gap-4">
                  {draft.story.milestones.map((milestone, i) => (
                    <div
                      key={i}
                      className="grid gap-3 rounded-xl border border-[var(--line)] p-4 sm:grid-cols-[6rem_1fr_2fr_auto]"
                    >
                      <input
                        className="field"
                        value={milestone.year}
                        onChange={(e) => {
                          const milestones = [...draft.story.milestones];
                          milestones[i] = { ...milestone, year: e.target.value };
                          set("story", { milestones });
                        }}
                        placeholder="2019"
                      />
                      <input
                        className="field"
                        value={milestone.title}
                        onChange={(e) => {
                          const milestones = [...draft.story.milestones];
                          milestones[i] = { ...milestone, title: e.target.value };
                          set("story", { milestones });
                        }}
                        placeholder="První leštička"
                      />
                      <input
                        className="field"
                        value={milestone.text}
                        onChange={(e) => {
                          const milestones = [...draft.story.milestones];
                          milestones[i] = { ...milestone, text: e.target.value };
                          set("story", { milestones });
                        }}
                        placeholder="Krátký popis…"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          set("story", {
                            milestones: draft.story.milestones.filter(
                              (_, j) => j !== i,
                            ),
                          })
                        }
                        className="btn btn-ghost btn-sm text-red-300"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() =>
                      set("story", {
                        milestones: [
                          ...draft.story.milestones,
                          { year: "", title: "", text: "" },
                        ],
                      })
                    }
                    className="btn btn-ghost btn-sm w-fit"
                  >
                    + Přidat milník
                  </button>
                </div>
              </Card>
            </>
          )}

          {/* -------------------------------------------------- Nadpisy */}
          {tab === "sections" && (
            <Card
              title="Nadpisy a popisky sekcí"
              description="Texty nad jednotlivými bloky hlavní stránky."
            >
              <div className="flex flex-col gap-7">
                {(["services", "gallery", "vouchers", "reviews"] as const).map((key) => (
                  <div key={key} className="flex flex-col gap-5">
                    <div className="eyebrow">
                      {key === "services"
                        ? "Služby"
                        : key === "gallery"
                          ? "Realizace"
                          : key === "vouchers"
                            ? "Dárkové poukazy"
                            : "Recenze"}
                    </div>
                    <Text
                      label="Nadpis"
                      value={draft[key].title}
                      onChange={(title) => set(key, { title })}
                    />
                    <Area
                      label="Popisek"
                      value={draft[key].subtitle}
                      onChange={(subtitle) => set(key, { subtitle })}
                    />
                    {key === "vouchers" && (
                      <Area
                        label="Poznámka pod poukazy"
                        value={draft.vouchers.note}
                        onChange={(note) => set("vouchers", { note })}
                      />
                    )}
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* ------------------------------------------------- Rezervace */}
          {tab === "booking" && (
            <Card
              title="Rezervační formulář"
              description="Texty a pravidla, podle kterých se nabízejí volné termíny."
            >
              <div className="flex flex-col gap-5">
                <Text
                  label="Nadpis"
                  value={draft.booking.title}
                  onChange={(title) => set("booking", { title })}
                />
                <Area
                  label="Popisek"
                  value={draft.booking.subtitle}
                  onChange={(subtitle) => set("booking", { subtitle })}
                />
                <Area
                  label="Poznámka k platbě"
                  value={draft.booking.paymentNote}
                  onChange={(paymentNote) => set("booking", { paymentNote })}
                />

                <div className="grid gap-5 sm:grid-cols-3">
                  <Number
                    label="Krok termínů (min)"
                    value={draft.booking.slotStepMin}
                    min={15}
                    max={120}
                    step={15}
                    hint="Po kolika minutách nabízet začátky."
                    onChange={(slotStepMin) => set("booking", { slotStepMin })}
                  />
                  <Number
                    label="Minimální předstih (h)"
                    value={draft.booking.leadTimeHours}
                    min={0}
                    max={168}
                    hint="Kolik hodin dopředu musí být objednáno."
                    onChange={(leadTimeHours) => set("booking", { leadTimeHours })}
                  />
                  <Number
                    label="Rezervovat max. dopředu (dní)"
                    value={draft.booking.maxDaysAhead}
                    min={7}
                    max={365}
                    onChange={(maxDaysAhead) => set("booking", { maxDaysAhead })}
                  />
                </div>
              </div>
            </Card>
          )}

          {/* --------------------------------------------- Kontakt a SEO */}
          {tab === "contact" && (
            <>
              <Card title="Kontaktní údaje">
                <div className="flex flex-col gap-5">
                  <Text
                    label="Nadpis sekce"
                    value={draft.contact.title}
                    onChange={(title) => set("contact", { title })}
                  />
                  <div className="grid gap-5 sm:grid-cols-2">
                    <Text
                      label="Telefon"
                      value={draft.contact.phone}
                      onChange={(phone) => set("contact", { phone })}
                    />
                    <Text
                      label="E-mail"
                      value={draft.contact.email}
                      onChange={(email) => set("contact", { email })}
                    />
                  </div>
                  <Text
                    label="Adresa"
                    value={draft.contact.address}
                    onChange={(address) => set("contact", { address })}
                  />
                  <div className="grid gap-5 sm:grid-cols-3">
                    <Text
                      label="IČO"
                      value={draft.contact.ico}
                      onChange={(ico) => set("contact", { ico })}
                    />
                    <Text
                      label="Instagram"
                      value={draft.contact.instagram}
                      onChange={(instagram) => set("contact", { instagram })}
                    />
                    <Text
                      label="Facebook"
                      value={draft.contact.facebook}
                      onChange={(facebook) => set("contact", { facebook })}
                    />
                  </div>
                  <Text
                    label="Shrnutí otevírací doby (v patičce)"
                    value={draft.contact.hoursNote}
                    onChange={(hoursNote) => set("contact", { hoursNote })}
                  />
                  <Area
                    label="Vložená mapa (HTML kód iframe)"
                    value={draft.contact.mapEmbed}
                    onChange={(mapEmbed) => set("contact", { mapEmbed })}
                    hint="Zkopírujte „Vložit mapu“ z Mapy.cz nebo Google Maps. Z bezpečnostních důvodů se použije jen adresa mapy — jiné weby web nezobrazí."
                  />
                </div>
              </Card>

              <Card title="SEO — jak se web ukazuje ve vyhledávání">
                <div className="flex flex-col gap-5">
                  <Text
                    label="Titulek stránky"
                    value={draft.seo.title}
                    onChange={(title) => set("seo", { title })}
                  />
                  <Area
                    label="Popis stránky"
                    value={draft.seo.description}
                    onChange={(description) => set("seo", { description })}
                    hint="Ideálně 120–160 znaků."
                  />
                </div>
              </Card>
            </>
          )}
        </div>

        {/* ----------------------------------------------------- Náhled */}
        <aside className="card xl:sticky xl:top-8">
          <div className="border-b border-[var(--line)] px-5 py-4">
            <span className="eyebrow">Živý náhled</span>
          </div>

          <div
            className="p-5"
            style={{
              background: draft.theme.background,
              borderRadius: "0 0 var(--radius) var(--radius)",
            }}
          >
            <div className="flex items-center gap-3">
              {draft.brand.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={draft.brand.logoUrl} alt="" className="h-9 w-auto" />
              ) : (
                <LogoMark size={36} static className="text-ink" />
              )}
              <span className="font-display text-[0.8rem] font-bold tracking-[0.16em] uppercase">
                {draft.brand.name}
              </span>
            </div>

            <div
              className="mt-5 p-4"
              style={{
                background: draft.theme.surface,
                borderRadius: `${draft.theme.radius}px`,
                border: "1px solid color-mix(in oklab, #fff 10%, transparent)",
              }}
            >
              <div className="font-display text-lg leading-tight font-bold">
                {draft.hero.title}{" "}
                <span className="text-gradient">{draft.hero.titleAccent}</span>
              </div>
              <p className="text-ink-muted mt-2 line-clamp-3 text-xs leading-relaxed">
                {draft.hero.subtitle}
              </p>
              <div className="mt-4 flex gap-2">
                <span className="btn btn-primary btn-sm pointer-events-none">
                  {draft.hero.ctaPrimary}
                </span>
                <span className="btn btn-ghost btn-sm pointer-events-none">
                  {draft.hero.ctaSecondary}
                </span>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2">
              {draft.hero.stats.slice(0, 4).map((stat, i) => (
                <div
                  key={i}
                  className="p-3 text-center"
                  style={{
                    background: draft.theme.surface,
                    borderRadius: `${draft.theme.radius}px`,
                  }}
                >
                  <div className="font-display text-gradient text-base font-bold">
                    {stat.value || "—"}
                  </div>
                  <div className="text-ink-faint mt-0.5 text-[0.6rem] tracking-wide uppercase">
                    {stat.label || "popisek"}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-3 border-t border-[var(--line)] p-5">
            <Feedback state={state} />
            <SubmitButton className="btn btn-primary w-full">
              Uložit a zveřejnit
            </SubmitButton>
            <button
              type="button"
              onClick={() => setDraft(settings)}
              className="btn btn-ghost btn-sm w-full"
            >
              Vrátit neuložené změny
            </button>
          </div>
        </aside>
      </div>
    </form>
  );
}

// ---------------------------------------------------------------------------
// Drobné vstupy
// ---------------------------------------------------------------------------

function Card({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="card">
      <div className="border-b border-[var(--line)] px-6 py-5">
        <h2 className="font-display text-lg font-bold tracking-tight">{title}</h2>
        {description && <p className="text-ink-muted mt-1 text-sm">{description}</p>}
      </div>
      <div className="p-6">{children}</div>
    </section>
  );
}

function Text({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="label">{label}</span>
      <input
        className="field"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}

function Area({
  label,
  value,
  onChange,
  hint,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  hint?: string;
}) {
  return (
    <label className="block">
      <span className="label">{label}</span>
      <textarea
        className="field"
        rows={3}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      {hint && <p className="text-ink-faint mt-1.5 text-xs">{hint}</p>}
    </label>
  );
}

function Number({
  label,
  value,
  onChange,
  hint,
  ...props
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  hint?: string;
  min?: number;
  max?: number;
  step?: number;
}) {
  return (
    <label className="block">
      <span className="label">{label}</span>
      <input
        type="number"
        className="field"
        value={value}
        onChange={(e) => onChange(globalThis.Number(e.target.value))}
        {...props}
      />
      {hint && <p className="text-ink-faint mt-1.5 text-xs">{hint}</p>}
    </label>
  );
}

function Color({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <span className="label">{label}</span>
      <div className="flex items-center gap-2.5">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value.toUpperCase())}
          className="size-11 shrink-0 cursor-pointer rounded-xl border border-[var(--line)] bg-transparent p-1"
          aria-label={label}
        />
        <input
          className="field font-mono text-xs uppercase"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          maxLength={9}
        />
      </div>
    </div>
  );
}

function Range({
  label,
  value,
  min,
  max,
  unit,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  unit: string;
  onChange: (value: number) => void;
}) {
  return (
    <label className="block">
      <span className="label flex items-center justify-between">
        {label}
        <span className="text-accent font-mono normal-case">
          {value}
          {unit}
        </span>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(globalThis.Number(e.target.value))}
        className="w-full accent-[var(--accent)]"
      />
    </label>
  );
}

function Toggle({
  label,
  checked,
  onChange,
  className = "",
}: {
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
  className?: string;
}) {
  return (
    <label
      className={`text-ink-muted flex cursor-pointer items-center gap-3 text-sm ${className}`}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="size-4 accent-[var(--accent)]"
      />
      {label}
    </label>
  );
}
