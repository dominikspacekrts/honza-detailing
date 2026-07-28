import type { Metadata } from "next";
import { Geist, Geist_Mono, Space_Grotesk } from "next/font/google";
import { ThemeStyle } from "@/components/site/theme-style";
import { getSiteSettings } from "@/lib/settings";
import "./globals.css";

const sans = Geist({ variable: "--font-sans-custom", subsets: ["latin", "latin-ext"] });
const mono = Geist_Mono({ variable: "--font-mono-custom", subsets: ["latin"] });
const display = Space_Grotesk({
  variable: "--font-display-custom",
  subsets: ["latin", "latin-ext"],
  weight: ["500", "600", "700"],
});

export async function generateMetadata(): Promise<Metadata> {
  const { seo, brand } = await getSiteSettings();
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
  const settings = await getSiteSettings();

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
