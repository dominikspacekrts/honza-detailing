import type { Metadata } from "next";
import { Archivo, Instrument_Sans, JetBrains_Mono } from "next/font/google";
import { ThemeStyle } from "@/components/site/theme-style";
import { getSettings } from "@/lib/data";
import "./globals.css";

const sans = Instrument_Sans({
  variable: "--font-sans-custom",
  subsets: ["latin", "latin-ext"],
});

/** Nadpisy — rozšířený grotesk s nádechem motorsportového typaření. */
const display = Archivo({
  variable: "--font-display-custom",
  subsets: ["latin", "latin-ext"],
  axes: ["wdth"],
});

const mono = JetBrains_Mono({
  variable: "--font-mono-custom",
  subsets: ["latin", "latin-ext"],
});

export async function generateMetadata(): Promise<Metadata> {
  const { seo, brand } = await getSettings();
  return {
    title: { default: seo.title, template: `%s — ${brand.name}` },
    description: seo.description,
    openGraph: {
      title: seo.title,
      description: seo.description,
      locale: "cs_CZ",
      type: "website",
    },
    robots: { index: true, follow: true },
  };
}

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const settings = await getSettings();

  return (
    <html
      lang="cs"
      className={`${sans.variable} ${mono.variable} ${display.variable} h-full antialiased`}
    >
      <head>
        <ThemeStyle theme={settings.theme} />
        <meta name="theme-color" content={settings.theme.background} />
      </head>
      <body
        className={`flex min-h-full flex-col ${settings.theme.grain ? "grain" : ""}`}
      >
        <div className="aurora" aria-hidden>
          <span />
          <span />
          <span />
        </div>
        <div className="grid-veil" aria-hidden />
        {children}
      </body>
    </html>
  );
}
