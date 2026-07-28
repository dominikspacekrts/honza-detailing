"use client";

import { useActionState } from "react";
import { LogoMark } from "@/components/logo";
import { signIn, signUp, type AuthState } from "@/app/actions/auth";

const initial: AuthState = { status: "idle" };

export function AuthCard({
  eyebrow,
  title,
  subtitle,
  children,
  footer,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
  children: React.ReactNode;
  footer: React.ReactNode;
}) {
  return (
    <div className="container-page flex min-h-[76vh] items-center justify-center py-20">
      <div className="w-full max-w-md">
        <div className="reveal card sheen p-8 sm:p-10">
          <LogoMark size={46} className="text-ink" />
          <div className="eyebrow mt-7 mb-3">{eyebrow}</div>
          <h1 className="font-display text-3xl font-bold tracking-tight">{title}</h1>
          <p className="text-ink-muted mt-2.5 text-sm leading-relaxed">{subtitle}</p>
          <div className="mt-8">{children}</div>
        </div>
        <p className="text-ink-muted mt-6 text-center text-sm">{footer}</p>
      </div>
    </div>
  );
}

export function AuthForm({
  mode,
  next,
}: {
  mode: "signin" | "signup";
  next?: string;
}) {
  const [state, action, pending] = useActionState(
    mode === "signin" ? signIn : signUp,
    initial,
  );

  return (
    <form action={action} className="flex flex-col gap-5">
      <input type="hidden" name="next" value={next ?? ""} />

      {mode === "signup" && (
        <>
          <Field
            label="Jméno a příjmení"
            name="fullName"
            autoComplete="name"
            placeholder="Jan Novák"
            required
          />
          <Field
            label="Telefon"
            name="phone"
            type="tel"
            autoComplete="tel"
            placeholder="+420 777 123 456"
            required
          />
        </>
      )}

      <Field
        label="E-mail"
        name="email"
        type="email"
        autoComplete="email"
        placeholder="jan@email.cz"
        required
      />
      <Field
        label="Heslo"
        name="password"
        type="password"
        autoComplete={mode === "signin" ? "current-password" : "new-password"}
        placeholder={mode === "signup" ? "alespoň 8 znaků" : "••••••••"}
        minLength={mode === "signup" ? 8 : undefined}
        required
      />

      {state.status === "error" && (
        <p className="rounded-xl border border-red-500/25 bg-red-500/8 px-4 py-3 text-sm text-red-300">
          {state.message}
        </p>
      )}
      {state.status === "info" && (
        <p className="border-accent/25 bg-accent/8 text-accent rounded-xl border px-4 py-3 text-sm">
          {state.message}
        </p>
      )}

      <button type="submit" className="btn btn-primary mt-1 w-full" disabled={pending}>
        {pending
          ? "Pracuji…"
          : mode === "signin"
            ? "Přihlásit se"
            : "Vytvořit účet"}
      </button>

      {mode === "signup" && (
        <p className="text-ink-faint text-center text-xs leading-relaxed">
          Registrací souhlasíte se zpracováním osobních údajů pro účely rezervace.
          Údaje používáme jen ke komunikaci o vaší zakázce.
        </p>
      )}
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
      <label className="label" htmlFor={`auth-${name}`}>
        {label}
      </label>
      <input id={`auth-${name}`} name={name} className="field" {...props} />
    </div>
  );
}
