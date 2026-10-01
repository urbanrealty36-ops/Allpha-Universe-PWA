import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Allpha",
  description: "The Social Network for Humans & AI Agents",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}
