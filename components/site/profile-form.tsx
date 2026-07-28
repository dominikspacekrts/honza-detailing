"use client";

import { useActionState } from "react";
import { updateProfile, type AuthState } from "@/app/actions/auth";
import type { Profile } from "@/lib/database.types";

const initial: AuthState = { status: "idle" };

export function ProfileForm({
  profile,
  email,
}: {
  profile: Profile | null;
  email: string;
}) {
  const [state, action, pending] = useActionState(updateProfile, initial);

  return (
    <form action={action} className="card sheen flex flex-col gap-5 p-6 sm:p-8">
      <div>
        <h2 className="font-display text-xl font-bold tracking-tight">Vaše údaje</h2>
        <p className="text-ink-muted mt-1.5 text-sm">
          Tyto údaje předvyplníme pokaždé, když si u nás rezervujete termín.
        </p>
      </div>

      <div>
        <span className="label">E-mail</span>
        <input className="field" value={email} disabled readOnly />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field
          label="Jméno a příjmení"
          name="full_name"
          defaultValue={profile?.full_name ?? ""}
          autoComplete="name"
          required
        />
        <Field
          label="Telefon"
          name="phone"
          type="tel"
          defaultValue={profile?.phone ?? ""}
          autoComplete="tel"
          required
        />
      </div>

      <div className="border-t border-[var(--line)] pt-5">
        <span className="eyebrow">Vozidlo</span>
        <div className="mt-4 grid gap-5 sm:grid-cols-3">
          <Field
            label="Značka"
            name="car_make"
            defaultValue={profile?.car_make ?? ""}
            placeholder="Škoda"
          />
          <Field
            label="Model"
            name="car_model"
            defaultValue={profile?.car_model ?? ""}
            placeholder="Octavia IV"
          />
          <Field
            label="SPZ"
            name="car_plate"
            defaultValue={profile?.car_plate ?? ""}
            placeholder="1AB 2345"
          />
        </div>
      </div>

      {state.message && (
        <p
          className={`rounded-xl border px-4 py-3 text-sm ${
            state.status === "error"
              ? "border-red-500/25 bg-red-500/8 text-red-300"
              : "border-[color-mix(in_oklab,var(--accent)_25%,transparent)] bg-[color-mix(in_oklab,var(--accent)_8%,transparent)] text-[var(--accent)]"
          }`}
        >
          {state.message}
        </p>
      )}

      <div className="flex justify-end">
        <button type="submit" className="btn btn-primary btn-sm" disabled={pending}>
          {pending ? "Ukládám…" : "Uložit údaje"}
        </button>
      </div>
    </form>
  );
}

function Field({
  label,
  name,
  ...props
}: { label: string; name: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div>
      <label className="label" htmlFor={`profile-${name}`}>
        {label}
      </label>
      <input id={`profile-${name}`} name={name} className="field" {...props} />
    </div>
  );
}
