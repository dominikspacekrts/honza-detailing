"use client";

import { useActionState, useState } from "react";
import { deleteVoucher, saveVoucher, type ActionState } from "@/app/actions/admin";
import { Feedback, SubmitButton } from "@/components/admin/ui";
import type { Service, Voucher } from "@/lib/database.types";
import { formatPrice } from "@/lib/time";

const initial: ActionState = { status: "idle" };

export function VouchersManager({
  vouchers,
  services,
}: {
  vouchers: Voucher[];
  services: Pick<Service, "id" | "name" | "price_from">[];
}) {
  const [editing, setEditing] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  return (
    <div className="flex flex-col gap-4">
      {creating ? (
        <VoucherForm
          key="new"
          services={services}
          onClose={() => setCreating(false)}
          nextSortOrder={(vouchers.at(-1)?.sort_order ?? 0) + 10}
        />
      ) : (
        <button
          type="button"
          onClick={() => setCreating(true)}
          className="card text-ink-muted hover:text-accent hover:border-accent/40 border-dashed p-5 text-sm font-medium transition-colors"
        >
          + Přidat dárkový poukaz
        </button>
      )}

      {vouchers.length === 0 && !creating && (
        <p className="card text-ink-muted p-8 text-center text-sm">
          Zatím nenabízíte žádný poukaz. Sekce se na webu skryje, dokud nějaký
          nepřidáte.
        </p>
      )}

      {vouchers.map((voucher) =>
        editing === voucher.id ? (
          <VoucherForm
            key={voucher.id}
            voucher={voucher}
            services={services}
            onClose={() => setEditing(null)}
          />
        ) : (
          <article key={voucher.id} className="card sheen p-5">
            <div className="flex flex-wrap items-start gap-4">
              <div className="font-display text-gradient min-w-[6rem] text-2xl font-bold tracking-tight">
                {formatPrice(voucher.value)}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-base font-semibold">{voucher.title}</h3>
                  {voucher.highlight && (
                    <span className="chip text-accent">Nejoblíbenější</span>
                  )}
                  {!voucher.active && <span className="chip">Skrytý</span>}
                </div>
                <div className="text-ink-muted mt-1 text-sm">
                  Platí {voucher.validity_months} měsíců
                  {voucher.service_id && (
                    <>
                      {" · na službu "}
                      {services.find((s) => s.id === voucher.service_id)?.name ??
                        "smazaná služba"}
                    </>
                  )}
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setEditing(voucher.id)}
                  className="btn btn-ghost btn-sm"
                >
                  Upravit
                </button>
                <form
                  action={deleteVoucher}
                  onSubmit={(e) => {
                    if (!confirm(`Smazat poukaz „${voucher.title}"?`)) e.preventDefault();
                  }}
                >
                  <input type="hidden" name="id" value={voucher.id} />
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

function VoucherForm({
  voucher,
  services,
  onClose,
  nextSortOrder = 0,
}: {
  voucher?: Voucher;
  services: Pick<Service, "id" | "name" | "price_from">[];
  onClose: () => void;
  nextSortOrder?: number;
}) {
  const [state, action] = useActionState(saveVoucher, initial);

  return (
    <form action={action} className="card sheen glow-accent flex flex-col gap-5 p-6">
      <input type="hidden" name="id" value={voucher?.id ?? ""} />

      <div className="flex items-center justify-between gap-4">
        <h3 className="font-display text-lg font-bold tracking-tight">
          {voucher ? "Úprava poukazu" : "Nový poukaz"}
        </h3>
        <button type="button" onClick={onClose} className="btn btn-ghost btn-sm">
          Zavřít
        </button>
      </div>

      <div>
        <label className="label" htmlFor="vch-title">
          Název
        </label>
        <input
          id="vch-title"
          name="title"
          className="field"
          defaultValue={voucher?.title}
          placeholder="Poukaz na Kompletní detailing"
          required
        />
      </div>

      <div>
        <label className="label" htmlFor="vch-description">
          Popis
        </label>
        <textarea
          id="vch-description"
          name="description"
          rows={2}
          className="field"
          defaultValue={voucher?.description ?? ""}
          placeholder="Pro koho se hodí a co za něj dostane."
        />
      </div>

      <div className="grid gap-5 sm:grid-cols-3">
        <div>
          <label className="label" htmlFor="vch-value">
            Hodnota (Kč)
          </label>
          <input
            id="vch-value"
            name="value"
            type="number"
            min={0}
            step={100}
            className="field"
            defaultValue={voucher?.value ?? 1000}
            required
          />
        </div>

        <div>
          <label className="label" htmlFor="vch-validity">
            Platnost (měsíců)
          </label>
          <input
            id="vch-validity"
            name="validity_months"
            type="number"
            min={1}
            max={60}
            className="field"
            defaultValue={voucher?.validity_months ?? 12}
            required
          />
        </div>

        <div>
          <label className="label" htmlFor="vch-service">
            Na konkrétní službu
          </label>
          <select
            id="vch-service"
            name="service_id"
            className="field"
            defaultValue={voucher?.service_id ?? ""}
          >
            <option value="">— otevřený poukaz na částku —</option>
            {services.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid items-end gap-5 sm:grid-cols-3">
        <div>
          <label className="label" htmlFor="vch-sort">
            Pořadí
          </label>
          <input
            id="vch-sort"
            name="sort_order"
            type="number"
            min={0}
            step={10}
            className="field"
            defaultValue={voucher?.sort_order ?? nextSortOrder}
          />
        </div>
        <Checkbox
          label="Označit jako nejoblíbenější"
          name="highlight"
          defaultChecked={voucher?.highlight ?? false}
        />
        <Checkbox
          label="Zobrazovat na webu"
          name="active"
          defaultChecked={voucher?.active ?? true}
        />
      </div>

      <Feedback state={state} />

      <div className="flex justify-end gap-2">
        <button type="button" onClick={onClose} className="btn btn-ghost btn-sm">
          Zrušit
        </button>
        <SubmitButton>{voucher ? "Uložit změny" : "Přidat poukaz"}</SubmitButton>
      </div>
    </form>
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
