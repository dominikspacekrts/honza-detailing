"use client";

import { useFormStatus } from "react-dom";

export function AdminHeader({
  eyebrow,
  title,
  subtitle,
  action,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        {eyebrow && <div className="eyebrow mb-2.5">{eyebrow}</div>}
        <h1 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">
          {title}
        </h1>
        {subtitle && <p className="text-ink-muted mt-2 text-sm">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function Feedback({
  state,
}: {
  state: { status: "idle" | "ok" | "error"; message?: string };
}) {
  if (state.status === "idle" || !state.message) return null;

  return (
    <p
      className={`rounded-xl border px-4 py-3 text-sm ${
        state.status === "error"
          ? "border-red-500/25 bg-red-500/8 text-red-300"
          : "border-[color-mix(in_oklab,var(--accent)_25%,transparent)] bg-[color-mix(in_oklab,var(--accent)_8%,transparent)] text-[var(--accent)]"
      }`}
    >
      {state.message}
    </p>
  );
}

export function SubmitButton({
  children,
  pendingLabel = "Ukládám…",
  className = "btn btn-primary btn-sm",
}: {
  children: React.ReactNode;
  pendingLabel?: string;
  className?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className={className} disabled={pending}>
      {pending ? pendingLabel : children}
    </button>
  );
}

export function Panel({
  title,
  description,
  children,
  footer,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <section className="card">
      <div className="border-b border-[var(--line)] px-6 py-5">
        <h2 className="font-display text-lg font-bold tracking-tight">{title}</h2>
        {description && <p className="text-ink-muted mt-1 text-sm">{description}</p>}
      </div>
      <div className="p-6">{children}</div>
      {footer && (
        <div className="border-t border-[var(--line)] px-6 py-4">{footer}</div>
      )}
    </section>
  );
}

export function Stat({
  label,
  value,
  hint,
}: {
  label: string;
  value: string | number;
  hint?: string;
}) {
  return (
    <div className="card p-5">
      <div className="text-ink-faint text-xs font-medium tracking-wider uppercase">
        {label}
      </div>
      <div className="font-display mt-2.5 text-3xl font-bold tracking-tight">
        {value}
      </div>
      {hint && <div className="text-ink-faint mt-1 text-xs">{hint}</div>}
    </div>
  );
}
