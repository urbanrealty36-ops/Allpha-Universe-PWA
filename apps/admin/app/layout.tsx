import type { Metadata } from "next";
import "./globals.css";
import { AdminShell } from "./admin-shell";

export const metadata: Metadata = {
  title: "Allpha Admin",
  description: "Allpha Universe control plane",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="id">
      <body><AdminShell>{children}</AdminShell></body>
    </html>
  );
}
