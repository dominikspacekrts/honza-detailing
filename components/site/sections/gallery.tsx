"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Reveal } from "@/components/site/reveal";
import type { GalleryItem } from "@/lib/database.types";

export function GalleryGrid({ items }: { items: GalleryItem[] }) {
  const [lightbox, setLightbox] = useState<GalleryItem | null>(null);

  useEffect(() => {
    if (!lightbox) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setLightbox(null);
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [lightbox]);

  return (
    <>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item, i) => (
          <Reveal key={item.id} delay={(i % 3) * 90}>
            {item.before_url ? (
              <CompareCard item={item} />
            ) : (
              <SimpleCard item={item} onOpen={() => setLightbox(item)} />
            )}
          </Reveal>
        ))}
      </div>

      {lightbox && (
        <div
          className="fixed inset-0 z-100 grid place-items-center bg-[color-mix(in_oklab,var(--bg)_92%,transparent)] p-5 backdrop-blur-xl"
          onClick={() => setLightbox(null)}
          role="dialog"
          aria-modal="true"
        >
          <figure
            className="card sheen max-h-[88vh] w-full max-w-4xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={lightbox.image_url}
              alt={lightbox.title}
              className="max-h-[70vh] w-full object-contain"
            />
            <figcaption className="border-t border-[var(--line)] p-5">
              <div className="font-display text-lg font-bold">{lightbox.title}</div>
              {lightbox.car && (
                <div className="text-accent mt-1 text-sm">{lightbox.car}</div>
              )}
              {lightbox.description && (
                <p className="text-ink-muted mt-2 text-sm leading-relaxed">
                  {lightbox.description}
                </p>
              )}
            </figcaption>
          </figure>
          <button
            type="button"
            className="btn btn-ghost btn-sm mt-5"
            onClick={() => setLightbox(null)}
          >
            Zavřít
          </button>
        </div>
      )}
    </>
  );
}

function SimpleCard({
  item,
  onOpen,
}: {
  item: GalleryItem;
  onOpen: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="card sheen group relative block aspect-4/3 w-full cursor-zoom-in overflow-hidden text-left"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={item.image_url}
        alt={item.title}
        loading="lazy"
        className="size-full object-cover transition-transform duration-700 group-hover:scale-105"
      />
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[color-mix(in_oklab,var(--bg)_95%,transparent)] to-transparent p-5 pt-14">
        <div className="font-display text-base font-bold">{item.title}</div>
        {item.car && <div className="text-accent mt-0.5 text-xs">{item.car}</div>}
      </div>
    </button>
  );
}

/** Porovnání před / po — táhnutím nebo šipkami. */
function CompareCard({ item }: { item: GalleryItem }) {
  const [position, setPosition] = useState(52);
  const ref = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

  const moveTo = useCallback((clientX: number) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const pct = ((clientX - rect.left) / rect.width) * 100;
    setPosition(Math.min(100, Math.max(0, pct)));
  }, []);

  useEffect(() => {
    const onMove = (e: PointerEvent) => dragging.current && moveTo(e.clientX);
    const onUp = () => (dragging.current = false);
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
  }, [moveTo]);

  return (
    <div className="card sheen overflow-hidden">
      <div
        ref={ref}
        className="relative aspect-4/3 cursor-ew-resize touch-none select-none"
        onPointerDown={(e) => {
          dragging.current = true;
          moveTo(e.clientX);
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={item.image_url}
          alt={`${item.title} — po`}
          loading="lazy"
          className="absolute inset-0 size-full object-cover"
          draggable={false}
        />
        <div
          className="absolute inset-0 overflow-hidden"
          style={{ clipPath: `inset(0 ${100 - position}% 0 0)` }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={item.before_url!}
            alt={`${item.title} — před`}
            loading="lazy"
            className="size-full object-cover"
            draggable={false}
          />
        </div>

        {/* Táhlo */}
        <div
          className="pointer-events-none absolute inset-y-0 w-0.5 bg-white/85 shadow-[0_0_18px_rgba(255,255,255,.5)]"
          style={{ left: `${position}%` }}
        >
          <div className="absolute top-1/2 left-1/2 grid size-9 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border border-white/70 bg-[color-mix(in_oklab,var(--bg)_65%,transparent)] backdrop-blur-md">
            <svg viewBox="0 0 24 24" className="size-4 text-white" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M8 7l-4 5 4 5M16 7l4 5-4 5" />
            </svg>
          </div>
        </div>

        <span className="pointer-events-none absolute top-3 left-3 rounded-full bg-black/55 px-2.5 py-1 text-[0.65rem] font-bold tracking-wider text-white uppercase backdrop-blur-sm">
          Před
        </span>
        <span className="pointer-events-none absolute top-3 right-3 rounded-full bg-[color-mix(in_oklab,var(--accent)_85%,black)] px-2.5 py-1 text-[0.65rem] font-bold tracking-wider text-[var(--bg)] uppercase">
          Po
        </span>

        <input
          type="range"
          min={0}
          max={100}
          value={position}
          onChange={(e) => setPosition(Number(e.target.value))}
          aria-label={`Porovnání před a po — ${item.title}`}
          className="absolute inset-x-0 bottom-0 h-8 w-full cursor-ew-resize opacity-0"
        />
      </div>

      <div className="p-5">
        <div className="font-display text-base font-bold">{item.title}</div>
        {item.car && <div className="text-accent mt-0.5 text-xs">{item.car}</div>}
        {item.description && (
          <p className="text-ink-muted mt-2 text-sm leading-relaxed">
            {item.description}
          </p>
        )}
      </div>
    </div>
  );
}
