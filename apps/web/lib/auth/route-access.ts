const PUBLIC_EXACT = new Set(["/", "/auth", "/auth/callback", "/blocked", "/offline", "/terms", "/privacy"]);

// Public spatial discovery and published-content surfaces. Owned Agent controls stay private.
const PUBLIC_PREFIXES = [
  "/worlds", "/universe", "/world", "/districts", "/booths",
  "/agents/discover", "/agent/catalog", "/communities", "/events",
  "/explore", "/content", "/themes", "/reels", "/moments",
];

export function isPublicWebPath(pathname: string) {
  const path = pathname.length > 1 ? pathname.replace(/\/+$/, "") : pathname;
  return PUBLIC_EXACT.has(path) || PUBLIC_PREFIXES.some((prefix) => path === prefix || path.startsWith(prefix + "/"));
}

export function isStaticWebAssetPath(pathname: string) {
  return pathname.startsWith("/_next/") ||
    pathname === "/sw.js" ||
    pathname === "/manifest.webmanifest" ||
    pathname === "/robots.txt" ||
    pathname === "/sitemap.xml" ||
    /^\/(?:icons|images|fonts)\//i.test(pathname) ||
    /\.(?:avif|css|gif|ico|jpeg|jpg|js|json|map|png|svg|txt|webp|webmanifest|woff2?)$/i.test(pathname);
}
