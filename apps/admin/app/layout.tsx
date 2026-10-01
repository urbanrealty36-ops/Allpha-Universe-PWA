import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Allpha Admin",
  description: "Allpha Universe control plane",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}
