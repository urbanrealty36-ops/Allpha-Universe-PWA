import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "../lib/supabase/server";
import "./globals.css";

export const metadata: Metadata = {
  title: "Allpha Admin",
  description: "Allpha Universe control plane",
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const supabase = await createSupabaseServerClient();
  const { data: claimsData } = await supabase.auth.getClaims();

  if (!claimsData?.claims) {
    redirect("/auth");
  }

  const { data: sessionData } = await supabase.auth.getSession();
  const accessToken = sessionData.session?.access_token;
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;

  if (!accessToken || !apiUrl) {
    redirect("/auth");
  }

  const permissionResponse = await fetch(
    `${apiUrl.replace(/\/$/, "")}/api/v1/auth/permissions`,
    {
      cache: "no-store",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/json",
      },
    },
  ).catch(() => null);

  if (!permissionResponse?.ok) {
    redirect("/auth");
  }

  const permissions = (await permissionResponse.json()) as { roles?: string[] };
  const roles = permissions.roles ?? [];
  if (!roles.includes("platform_admin") && !roles.includes("super_admin")) {
    redirect("/auth");
  }

  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}
