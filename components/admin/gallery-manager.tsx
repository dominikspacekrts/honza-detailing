"use client";

import { useActionState, useState } from "react";
import {
  deleteGalleryItem,
  saveGalleryItem,
  type ActionState,
} from "@/app/actions/admin";
import { ImageUpload } from "@/components/admin/image-upload";
import { Feedback, SubmitButton } from "@/components/admin/ui";
import type { GalleryItem } from "@/lib/database.types";

const initial: ActionState = { status: "idle" };

export function GalleryManager({ items }: { items: GalleryItem[] }) {
  const [editing, setEditing] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  return (
    <div className="flex flex-col gap-6">
      {creating ? (
        <ItemForm
          key="new"
          onClose={() => setCreating(false)}
          nextSortOrder={(items.at(-1)?.sort_order ?? 0) + 10}
        />
      ) : (
        <button
          type="button"
          onClick={() => setCreating(true)}
          className="card text-ink-muted hover:text-accent hover:border-accent/40 border-dashed p-5 text-sm font-medium transition-colors"
        >
          + Přidat hotovou zakázku
        </button>
      )}

      {editing && (
        <ItemForm
          key={editing}
          item={items.find((i) => i.id === editing)}
          onClose={() => setEditing(null)}
        />
      )}

      {items.length === 0 ? (
        <p className="card text-ink-muted p-8 text-center text-sm">
          Galerie je zatím prázdná.
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {items.map((item) => (
            <article key={item.id} className="card sheen overflow-hidden">
              <div className="relative aspect-4/3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={item.image_url}
                  alt={item.title}
                  className="size-full object-cover"
                />
                {item.before_url && (
                  <span className="absolute top-2.5 left-2.5 rounded-full bg-black/60 px-2 py-0.5 text-[0.6rem] font-bold tracking-wider text-white uppercase backdrop-blur-sm">
                    Před / po
                  </span>
                )}
                {item.featured && (
                  <span className="bg-accent absolute top-2.5 right-2.5 rounded-full px-2 py-0.5 text-[0.6rem] font-bold tracking-wider text-[var(--bg)] uppercase">
                    Nahoře
                  </span>
                )}
              </div>

              <div className="p-4">
                <h3 className="text-sm font-bold">{item.title}</h3>
                {item.car && (
                  <div className="text-ink-faint mt-0.5 text-xs">{item.car}</div>
                )}

                <div className="mt-3.5 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setEditing(item.id)}
                    className="btn btn-ghost btn-sm flex-1"
                  >
                    Upravit
                  </button>
                  <form
                    action={deleteGalleryItem}
                    onSubmit={(e) => {
                      if (!confirm(`Smazat „${item.title}" z galerie?`)) e.preventDefault();
                    }}
                  >
                    <input type="hidden" name="id" value={item.id} />
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
          ))}
        </div>
      )}
    </div>
  );
}

function ItemForm({
  item,
  onClose,
  nextSortOrder = 0,
}: {
  item?: GalleryItem;
  onClose: () => void;
  nextSortOrder?: number;
}) {
  const [state, action] = useActionState(saveGalleryItem, initial);

  return (
    <form action={action} className="card sheen glow-accent flex flex-col gap-5 p-6">
      <input type="hidden" name="id" value={item?.id ?? ""} />

      <div className="flex items-center justify-between gap-4">
        <h3 className="font-display text-lg font-bold tracking-tight">
          {item ? "Úprava zakázky" : "Nová zakázka"}
        </h3>
        <button type="button" onClick={onClose} className="btn btn-ghost btn-sm">
          Zavřít
        </button>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="gal-title">
            Název
          </label>
          <input
            id="gal-title"
            name="title"
            className="field"
            defaultValue={item?.title}
            placeholder="Keramická ochrana + korekce laku"
            required
          />
        </div>
        <div>
          <label className="label" htmlFor="gal-car">
            Vozidlo
          </label>
          <input
            id="gal-car"
            name="car"
            className="field"
            defaultValue={item?.car ?? ""}
            placeholder="BMW M4 Competition"
          />
        </div>
      </div>

      <div>
        <label className="label" htmlFor="gal-description">
          Popis
        </label>
        <textarea
          id="gal-description"
          name="description"
          rows={2}
          className="field"
          defaultValue={item?.description ?? ""}
          placeholder="Co jsme na voze dělali a jak dlouho to trvalo."
        />
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <ImageUpload
          name="image_url"
          label="Fotka PO (povinná)"
          defaultValue={item?.image_url ?? ""}
          required
          hint="Hlavní fotka zobrazená v galerii."
        />
        <ImageUpload
          name="before_url"
          label="Fotka PŘED (nepovinná)"
          defaultValue={item?.before_url ?? ""}
          hint="Když ji přidáte, na webu se zobrazí posuvník před / po."
        />
      </div>

      <div className="grid items-end gap-5 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="gal-sort">
            Pořadí
          </label>
          <input
            id="gal-sort"
            name="sort_order"
            type="number"
            min={0}
            step={10}
            className="field"
            defaultValue={item?.sort_order ?? nextSortOrder}
          />
        </div>
        <label className="text-ink-muted flex cursor-pointer items-center gap-3 py-2.5 text-sm">
          <input
            type="checkbox"
            name="featured"
            defaultChecked={item?.featured ?? false}
            className="size-4 accent-[var(--accent)]"
          />
          Zobrazit mezi prvními
        </label>
      </div>

      <Feedback state={state} />

      <div className="flex justify-end gap-2">
        <button type="button" onClick={onClose} className="btn btn-ghost btn-sm">
          Zrušit
        </button>
        <SubmitButton>{item ? "Uložit změny" : "Přidat do galerie"}</SubmitButton>
      </div>
    </form>
  );
}
