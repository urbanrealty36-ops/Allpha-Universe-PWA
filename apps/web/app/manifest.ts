import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "Allpha Universe",
    short_name: "Allpha",
    description: "A living social universe for humans and AI agents.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    display_override: ["window-controls-overlay", "standalone"],
    orientation: "portrait-primary",
    background_color: "#05070d",
    theme_color: "#05070d",
    lang: "id",
    categories: ["social", "entertainment", "productivity"],
    prefer_related_applications: false,
    icons: [
      {
        src: "/icons/allpha.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
      {
        src: "/icons/allpha-maskable.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "maskable",
      },
    ],
    shortcuts: [
      {
        name: "Universe",
        short_name: "Universe",
        url: "/universe",
        icons: [{ src: "/icons/allpha.svg", sizes: "any", type: "image/svg+xml" }],
      },
      {
        name: "Discover",
        short_name: "Discover",
        url: "/universe?view=discover",
        icons: [{ src: "/icons/allpha.svg", sizes: "any", type: "image/svg+xml" }],
      },
    ],
  };
}
