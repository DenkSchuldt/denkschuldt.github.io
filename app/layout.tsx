import type { Metadata } from "next";
import "./globals.css";

const SITE_ORIGIN=(process.env.NEXT_PUBLIC_SITE_URL??"https://denkschuldt.github.io").replace(/\/$/,"");
const BASE_PATH=(process.env.NEXT_PUBLIC_BASE_PATH??"").replace(/\/$/,"");

export const metadata: Metadata = {
  title: "Denny K. Schuldt",
  description: "A quiet, cinematic creative studio built as an interactive WebGL experience.",
  robots:{index:true,follow:true,googleBot:{index:true,follow:true,"max-image-preview":"large","max-snippet":-1,"max-video-preview":-1}},
  alternates:{types:{"application/atom+xml":`${SITE_ORIGIN}${BASE_PATH}/poems/feed.xml`,"text/plain":`${SITE_ORIGIN}${BASE_PATH}/llms.txt`}},
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
