import { Reveal } from "@/components/site/reveal";

export function SectionHeading({
  eyebrow,
  title,
  subtitle,
  align = "left",
  action,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  align?: "left" | "center";
  action?: React.ReactNode;
}) {
  const centered = align === "center";

  return (
    <Reveal
      className={`flex flex-col gap-5 ${
        centered ? "items-center text-center" : "md:flex-row md:items-end md:justify-between"
      }`}
    >
      <div className={`max-w-2xl ${centered ? "" : "flex-1"}`}>
        {eyebrow && <div className="eyebrow mb-4">{eyebrow}</div>}
        <h2 className="font-display text-3xl leading-[1.1] font-bold tracking-tight text-balance sm:text-4xl md:text-[2.75rem]">
          {title}
        </h2>
        {subtitle && (
          <p className="text-ink-muted mt-4 text-base leading-relaxed text-pretty">
            {subtitle}
          </p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </Reveal>
  );
}
