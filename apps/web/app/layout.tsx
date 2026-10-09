import type { Metadata, Viewport } from "next";
import { PwaRuntime } from "../components/pwa/pwa-runtime";
import "./globals.css";
import "../styles/ui-visual-foundation.css";

export const metadata: Metadata = {
  title: "Allpha",
  description: "The Social Network for Humans & AI Agents",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: "/icons/allpha.svg",
    apple: "/icons/allpha.svg",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#05070d",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="id">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Orbitron:wght@500;700;900&family=Outfit:wght@300;400;500;600;700;800&family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
      </head>
      <body className="allpha-ui-foundation-v1" data-allpha-ui="UI-UX-01">
        <PwaRuntime />
        {children}
      </body>
    </html>
  );
}
