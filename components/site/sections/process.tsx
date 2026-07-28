import { Reveal } from "@/components/site/reveal";
import { SectionHeading } from "@/components/site/section-heading";

const STEPS = [
  {
    title: "Rezervace online",
    text: "Vyberete službu a termín. Systém nabízí jen časy, které se reálně vejdou do dne — žádné přebookování.",
  },
  {
    title: "Převzetí a prohlídka",
    text: "Vůz si projdeme pod kontrolovaným světlem, změříme lak a domluvíme finální rozsah i cenu.",
  },
  {
    title: "Práce v garáži",
    text: "Průběh vám posíláme fotkami. Na voze pracujeme sami — nic nepředáváme dál.",
  },
  {
    title: "Předání a platba",
    text: "Vůz předáváme za denního i umělého světla. Platíte hotově na místě, až když jste spokojení.",
  },
];

export function Process() {
  return (
    <section className="py-24 md:py-32">
      <div className="container-page">
        <SectionHeading
          eyebrow="Jak to probíhá"
          title="Čtyři kroky, žádná překvapení"
          subtitle="Od kliknutí na rezervaci po předání klíčků víte přesně, co se děje a kolik to bude stát."
          align="center"
        />

        <div className="mt-14 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((step, i) => (
            <Reveal key={step.title} delay={i * 90}>
              <div className="card group relative h-full overflow-hidden p-6">
                <div
                  className="font-display pointer-events-none absolute -top-3 -right-1 text-7xl font-bold opacity-[0.07] transition-opacity duration-500 group-hover:opacity-[0.14]"
                  aria-hidden
                >
                  {i + 1}
                </div>
                <div className="bg-accent/12 text-accent grid size-10 place-items-center rounded-xl text-sm font-bold">
                  {String(i + 1).padStart(2, "0")}
                </div>
                <h3 className="mt-5 text-base font-semibold">{step.title}</h3>
                <p className="text-ink-muted mt-2 text-sm leading-relaxed">{step.text}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
