"use client";

import { useId } from "react";

type LogoMarkProps = {
  size?: number;
  className?: string;
  /** Vypne animovaný přejezd odlesku (např. v patičce nebo v adminu). */
  static?: boolean;
};

/**
 * Monogram HD ve štítu — „D" sdílí svislici s pravou nohou „H".
 * Přes lak přejíždí odlesk, jako když se auto otočí ke světlu.
 */
export function LogoMark({
  size = 40,
  className = "",
  static: isStatic = false,
}: LogoMarkProps) {
  const uid = useId().replace(/:/g, "");
  const stroke = `s-${uid}`;
  const fill = `f-${uid}`;
  const gloss = `g-${uid}`;
  const clip = `c-${uid}`;

  const shield =
    "M32 4 L57 15.5 V35 C57 48.5 46.2 56.5 32 60.5 C17.8 56.5 7 48.5 7 35 V15.5 Z";

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label="Honza Detailing"
    >
      <defs>
        <linearGradient id={stroke} x1="8" y1="4" x2="56" y2="60">
          <stop offset="0%" stopColor="var(--accent)" />
          <stop offset="100%" stopColor="var(--accent-2)" />
        </linearGradient>
        <linearGradient id={fill} x1="10" y1="8" x2="54" y2="58">
          <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.16" />
          <stop offset="100%" stopColor="var(--accent-2)" stopOpacity="0.04" />
        </linearGradient>
        <linearGradient id={gloss} x1="0" y1="0" x2="1" y2="0.35">
          <stop offset="0%" stopColor="#fff" stopOpacity="0" />
          <stop offset="45%" stopColor="#fff" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
        <clipPath id={clip}>
          <path d={shield} />
        </clipPath>
      </defs>

      {/* Štít */}
      <path d={shield} fill={`url(#${fill})`} />
      <path
        d={shield}
        stroke={`url(#${stroke})`}
        strokeWidth="2.5"
        strokeLinejoin="round"
      />

      {/* Monogram HD */}
      <g fill="currentColor" transform="translate(-0.5 0)">
        <rect x="17" y="20" width="5.5" height="24" rx="1.6" />
        <rect x="22.5" y="29.5" width="6.5" height="5" />
        <rect x="28.5" y="20" width="5.5" height="24" rx="1.6" />
        <path d="M34 20 H38.5 C44.6 20 48 25 48 32 C48 39 44.6 44 38.5 44 H34 V37.6 H37.6 C40.9 37.6 42.1 35.4 42.1 32 C42.1 28.6 40.9 26.4 37.6 26.4 H34 Z" />
      </g>

      {/* Přejezd odlesku */}
      {!isStatic && (
        <g clipPath={`url(#${clip})`}>
          <rect
            x="-40"
            y="-10"
            width="26"
            height="90"
            fill={`url(#${gloss})`}
            transform="rotate(18 32 32)"
          >
            <animate
              attributeName="x"
              values="-40;80;80"
              keyTimes="0;0.35;1"
              dur="5.5s"
              repeatCount="indefinite"
            />
          </rect>
        </g>
      )}
    </svg>
  );
}

type LogoProps = LogoMarkProps & {
  name?: string;
  tagline?: string;
  /** Vlastní logo nahrané v adminu má přednost před monogramem. */
  imageUrl?: string;
};

export function Logo({
  name = "Honza Detailing",
  tagline,
  imageUrl,
  size = 40,
  className = "",
  static: isStatic,
}: LogoProps) {
  const [first, ...rest] = name.split(" ");

  return (
    <span className={`flex items-center gap-3 ${className}`}>
      {imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={imageUrl}
          alt={name}
          height={size}
          style={{ height: size, width: "auto" }}
          className="object-contain"
        />
      ) : (
        <LogoMark size={size} static={isStatic} className="text-ink shrink-0" />
      )}

      <span className="flex min-w-0 flex-col leading-none">
        <span className="font-display text-[0.95rem] font-bold tracking-[0.16em] uppercase">
          {first}
          {rest.length > 0 && (
            <span className="text-gradient"> {rest.join(" ")}</span>
          )}
        </span>
        {tagline && (
          <span className="text-ink-faint mt-1.5 text-[0.6rem] font-medium tracking-[0.2em] uppercase">
            {tagline}
          </span>
        )}
      </span>
    </span>
  );
}
