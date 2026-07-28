"use client";

import { useActionState, useState } from "react";
import { deleteService, saveService, type ActionState } from "@/app/actions/admin";
import { Feedback, SubmitButton } from "@/components/admin/ui";
import type { Service } from "@/lib/database.types";
import { formatDuration, formatPrice } from "@/lib/time";

const initial: ActionState = { status: "idle" };

export function ServicesManager({ services }: { services: Service[] }) {
  const [editing, setEditing] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  return (
    <div className="flex flex-col gap-4">
      {creating ? (
        <ServiceForm
          key="new"
          onClose={() => setCreating(false)}
          nextSortOrder={(services.at(-1)?.sort_order ?? 0) + 10}
        />
      ) : (
        <button
          type="button"
          onClick={() => setCreating(true)}
          className="card text-ink-muted hover:text-accent hover:border-accent/40 border-dashed p-5 text-sm font-medium transition-colors"
        >
          + Přidat novou službu
        </button>
      )}

      {services.map((service) =>
        editing === service.id ? (
          <ServiceForm
            key={service.id}
            service={service}
            onClose={() => setEditing(null)}
          />
        ) : (
          <article key={service.id} className="card sheen p-5">
            <div className="flex flex-wrap items-start gap-4">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-display text-lg font-bold tracking-tight">
                    {service.name}
                  </h3>
                  {service.highlight && (
                    <span className="chip text-accent">Zvýrazněná</span>
                  )}
                  {service.whole_day && <span className="chip">Celodenní</span>}
                  {!service.active && <span className="chip">Skrytá</span>}
                </div>
                <div className="text-ink-muted mt-1.5 text-sm">
                  {service.category} ·{" "}
                  {service.whole_day ? "celý den" : formatDuration(service.duration_min)} ·{" "}
                  {service.price_note || ""} {formatPrice(service.price_from)}
                </div>
                <div className="text-ink-faint mt-1 font-mono text-xs">
                  /rezervace?sluzba={service.slug}
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setEditing(service.id)}
                  className="btn btn-ghost btn-sm"
                >
                  Upravit
                </button>
                <form
                  action={deleteService}
                  onSubmit={(e) => {
                    if (
                      !confirm(
                        `Opravdu smazat službu „${service.name}"? Nelze smazat, pokud na ni existují rezervace.`,
                      )
                    ) {
                      e.preventDefault();
                    }
                  }}
                >
                  <input type="hidden" name="id" value={service.id} />
                  <button
                    type="submit"
                    className="btn btn-ghost btn-sm text-red-300 hover:border-red-400/40"
                  >
                    Smazat
                  </button>
                </form>
              </div>
            </div>
          </article>
        ),
      )}
    </div>
  );
}

function ServiceForm({
  service,
  onClose,
  nextSortOrder = 0,
}: {
  service?: Service;
  onClose: () => void;
  nextSortOrder?: number;
}) {
  const [state, action] = useActionState(saveService, initial);

  return (
    <form action={action} className="card sheen glow-accent flex flex-col gap-5 p-6">
      <input type="hidden" name="id" value={service?.id ?? ""} />

      <div className="flex items-center justify-between gap-4">
        <h3 className="font-display text-lg font-bold tracking-tight">
          {service ? "Úprava služby" : "Nová služba"}
        </h3>
        <button type="button" onClick={onClose} className="btn btn-ghost btn-sm">
          Zavřít
        </button>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <Input label="Název" name="name" defaultValue={service?.name} required />
        <Input
          label="Slug (v adrese)"
          name="slug"
          defaultValue={service?.slug}
          pattern="[a-z0-9-]+"
          placeholder="keramicka-ochrana"
          required
        />
      </div>

      <Input
        label="Podtitulek"
        name="tagline"
        defaultValue={service?.tagline ?? ""}
        placeholder="Roky lesku pod tvrdou skořápkou"
      />

      <div>
        <label className="label" htmlFor="svc-description">
          Popis
        </label>
        <textarea
          id="svc-description"
          name="description"
          rows={3}
          className="field"
          defaultValue={service?.description ?? ""}
        />
      </div>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <Input
          label="Kategorie"
          name="category"
          defaultValue={service?.category ?? "Detailing"}
          required
        />
        <Input
          label="Cena od (Kč)"
          name="price_from"
          type="number"
          min={0}
          step={100}
          defaultValue={service?.price_from ?? 0}
          required
        />
        <Input
          label="Poznámka k ceně"
          name="price_note"
          defaultValue={service?.price_note ?? "od"}
          placeholder="od / dle stavu"
        />
        <Input
          label="Délka (minut)"
          name="duration_min"
          type="number"
          min={15}
          step={15}
          defaultValue={service?.duration_min ?? 60}
          required
        />
      </div>

      <div>
        <label className="label" htmlFor="svc-features">
          Co je v ceně — každý bod na nový řádek
        </label>
        <textarea
          id="svc-features"
          name="features"
          rows={5}
          className="field font-mono text-xs"
          defaultValue={(service?.features ?? []).join("\n")}
          placeholder={"Bezkontaktní předmytí\nRuční mytí metodou dvou kbelíků"}
        />
      </div>

      <div className="grid items-end gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <Input
          label="Pořadí"
          name="sort_order"
          type="number"
          min={0}
          step={10}
          defaultValue={service?.sort_order ?? nextSortOrder}
        />
        <Checkbox
          label="Celodenní — zabere celý den"
          name="whole_day"
          defaultChecked={service?.whole_day ?? false}
        />
        <Checkbox
          label="Zvýraznit jako nejžádanější"
          name="highlight"
          defaultChecked={service?.highlight ?? false}
        />
        <Checkbox
          label="Zobrazovat na webu"
          name="active"
          defaultChecked={service?.active ?? true}
        />
      </div>

      <p className="text-ink-faint text-xs leading-relaxed">
        U celodenní zakázky se v ten den nedá objednat nic dalšího — zákazník volí
        jen čas, kdy vůz přiveze. Údaj „délka" se pak nepoužije.
      </p>

      <Feedback state={state} />

      <div className="flex justify-end gap-2">
        <button type="button" onClick={onClose} className="btn btn-ghost btn-sm">
          Zrušit
        </button>
        <SubmitButton>{service ? "Uložit změny" : "Přidat službu"}</SubmitButton>
      </div>
    </form>
  );
}

function Input({
  label,
  name,
  ...props
}: { label: string; name: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div>
      <label className="label" htmlFor={`svc-${name}`}>
        {label}
      </label>
      <input id={`svc-${name}`} name={name} className="field" {...props} />
    </div>
  );
}

function Checkbox({
  label,
  name,
  defaultChecked,
}: {
  label: string;
  name: string;
  defaultChecked?: boolean;
}) {
  return (
    <label className="text-ink-muted flex cursor-pointer items-center gap-3 py-2.5 text-sm">
      <input
        type="checkbox"
        name={name}
        defaultChecked={defaultChecked}
        className="size-4 accent-[var(--accent)]"
      />
      {label}
    </label>
  );
}
