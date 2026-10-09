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
      <body className="allpha-ui-foundation-v1" data-allpha-ui="UI-UX-01">
        <PwaRuntime />
        {children}
      </body>
    </html>
  );
}
