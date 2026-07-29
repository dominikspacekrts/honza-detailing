"use client";

import { useActionState, useEffect, useState } from "react";
import { submitReview, type ReviewFormState } from "@/app/actions/reviews";
import { createClient } from "@/lib/supabase/client";

const initial: ReviewFormState = { status: "idle" };

export function ReviewForm() {
  const [state, action, pending] = useActionState(submitReview, initial);
  const [rating, setRating] = useState(5);
  const [hover, setHover] = useState(0);
  const [name, setName] = useState("");

  /**
   * Přihlášenému předvyplníme jméno z profilu. Když se to nepovede (nebo
   * u nás nemá účet), pole prostě vyplní sám — formulář na tom nestojí.
   */
  useEffect(() => {
    const supabase = createClient();
    let active = true;

    async function prefill() {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (!session || !active) return;

        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name")
          .eq("id", session.user.id)
          .maybeSingle();

        const full = profile?.full_name?.trim();
        if (active && full) setName((current) => current || full);
      } catch {
        // Nevadí — jméno zadá ručně.
      }
    }

    void prefill();
    return () => {
      active = false;
    };
  }, []);

  if (state.status === "success") {
    return (
      <div className="card glow-accent flex items-center gap-4 p-6">
        <div className="bg-accent/15 text-accent grid size-10 shrink-0 place-items-center rounded-full">
          <svg
            viewBox="0 0 24 24"
            className="size-5"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M20 6L9 17l-5-5" />
          </svg>
        </div>
        <p className="text-sm">{state.message}</p>
      </div>
    );
  }

  return (
    <form action={action} className="card sheen relative flex flex-col gap-5 p-6">
      <div>
        <div className="font-display text-lg font-bold">Napište nám recenzi</div>
        <p className="text-ink-muted mt-1.5 text-sm">
          Účet k tomu nepotřebujete — stačí vyplnit jméno.
        </p>
      </div>

      {/* Past na roboty — pro člověka neviditelná. */}
      <input
        type="text"
        name="website"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden
        className="pointer-events-none absolute size-0 opacity-0"
      />

      <div>
        <label className="label" htmlFor="review-name">
          Vaše jméno
        </label>
        <input
          id="review-name"
          name="authorName"
          className="field"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="např. Martin K."
          maxLength={80}
          autoComplete="name"
          required
        />
        <p className="text-ink-faint mt-1.5 text-xs">
          Zobrazí se u recenze. Klidně jen křestní jméno a příjmení zkratkou.
        </p>
      </div>

      <div>
        <span className="label">Hodnocení</span>
        <input type="hidden" name="rating" value={rating} />
        <div className="flex gap-1.5" onMouseLeave={() => setHover(0)}>
          {[1, 2, 3, 4, 5].map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setRating(value)}
              onMouseEnter={() => setHover(value)}
              aria-label={`${value} z 5 hvězdiček`}
              className="transition-transform hover:scale-115"
            >
              <svg
                viewBox="0 0 24 24"
                className={`size-7 transition-colors ${
                  value <= (hover || rating) ? "text-accent" : "text-ink-faint"
                }`}
                fill="currentColor"
              >
                <path d="M12 2.5l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.4 6.1 20.5l1.2-6.5-4.8-4.6 6.6-.9z" />
              </svg>
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="label" htmlFor="review-car">
          Vozidlo (nepovinné)
        </label>
        <input
          id="review-car"
          name="car"
          className="field"
          placeholder="např. Škoda Octavia IV"
          maxLength={80}
        />
      </div>

      <div>
        <label className="label" htmlFor="review-body">
          Vaše zkušenost
        </label>
        <textarea
          id="review-body"
          name="body"
          className="field"
          rows={4}
          required
          minLength={20}
          maxLength={1500}
          placeholder="Co jsme dělali a jak jste byli spokojení?"
        />
      </div>

      {state.status === "error" && (
        <p className="text-sm text-red-400">{state.message}</p>
      )}

      <div className="flex items-center justify-between gap-4">
        <p className="text-ink-faint text-xs">
          Recenzi zveřejníme po kontrole, obvykle do 24 hodin.
        </p>
        <button type="submit" className="btn btn-primary btn-sm" disabled={pending}>
          {pending ? "Odesílám…" : "Odeslat"}
        </button>
      </div>
    </form>
  );
}
