import { SITE } from "../src/content/site.ts";

import type { Metadata } from "next";

import "./globals.css";

const SITE_ORIGIN = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://denkschuldt.github.io").replace(
  /\/$/,
  "",
);
const SITE_URL = `${SITE_ORIGIN}/`;

const SITE_TITLE = "Denny K. Schuldt";
const SITE_DESCRIPTION = SITE.description;

export const metadata: Metadata = {
  metadataBase: new URL(SITE_ORIGIN),
  title: SITE_TITLE,
  description: SITE_DESCRIPTION,
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  alternates: {
    canonical: SITE_URL,
    types: {
      "application/atom+xml": `${SITE_ORIGIN}/poems/feed.xml`,
      "text/plain": `${SITE_ORIGIN}/llms.txt`,
    },
  },
  openGraph: {
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    url: SITE_URL,
    siteName: SITE_TITLE,
    type: "website",
    locale: "en_US",
    images: [
      {
        url: "/preview.png",
        width: 1200,
        height: 630,
        alt: SITE_TITLE,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: ["/preview.png"],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
