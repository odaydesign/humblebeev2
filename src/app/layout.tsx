import type { Metadata } from "next";
import { siteMeta } from "@/lib/content";
import "./globals.css";
import "./legacy.css";
import "./menu.css";
import "./hero.css";
import "./gallery.css";
import "./custom.css";

export const metadata: Metadata = {
  title: siteMeta.title,
  description: siteMeta.description,
  icons: { icon: "/assets/images/favicon.png" },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
