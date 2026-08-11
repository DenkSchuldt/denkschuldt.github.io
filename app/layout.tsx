import type { Metadata } from "next";

import "./globals.css";

const SITE_ORIGIN = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://denkschuldt.github.io").replace(
  /\/$/,
  "",
);

const SITE_TITLE = "Denny K. Schuldt";
const SITE_DESCRIPTION =
  "Denny K. Schuldt's portfolio, rendered as an interactive 3D room — software engineering and product work, poetry, and certificates to explore.";

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
    canonical: SITE_ORIGIN,
    types: {
      "application/atom+xml": `${SITE_ORIGIN}/poems/feed.xml`,
      "text/plain": `${SITE_ORIGIN}/llms.txt`,
    },
  },
  openGraph: {
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    url: SITE_ORIGIN,
    siteName: SITE_TITLE,
    type: "website",
    locale: "en_US",
    images: [
      {
        url: "/preview.png",
        width: 2664,
        height: 1310,
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
