export type Allpha3DThemeProfile = {
  key: string;
  family: string;
  geometry: string;
  material: string;
  atmosphere: string;
  landmark: string;
  district: string;
  character: string;
  portal: string;
  accent: readonly [string, string, string];
};

export const ALLPHA_3D_MASTER_LANGUAGE = {
  visual: {
    depth: "cinematic-cosmic",
    surface: "luminous-glass-holographic",
    form: ["sphere", "ring", "arc", "capsule", "platform", "gateway", "floating-island", "landmark"],
    progression: ["2d", "2.5d", "spatial", "3d"],
  },
  semantic: {
    system: "#42DCFF",
    navigation: "#75B9FF",
    intelligence: "#A77CFF",
    socialLive: "#EE7CFF",
    organic: "#63E6BE",
    warning: "#FCC419",
    danger: "#FF6B6B",
  },
  materials: {
    deepSpace: { roughness: 0.82, metalness: 0.08, opacity: 1 },
    luminousCore: { roughness: 0.28, metalness: 0.25, opacity: 1 },
    holographicGlass: { roughness: 0.18, metalness: 0.18, opacity: 0.58 },
    architecturalMetal: { roughness: 0.3, metalness: 0.78, opacity: 1 },
    worldOrganic: { roughness: 0.76, metalness: 0.04, opacity: 1 },
    signalFx: { roughness: 0.1, metalness: 0.05, opacity: 0.72 },
  },
  lighting: {
    key: "readable-silhouette",
    fill: "environment-separation",
    accent: "semantic-state",
    defaultSpectralFamily: ["cyan", "blue", "violet", "magenta", "aurora"],
  },
  motion: {
    vocabulary: ["float", "orbit", "pulse", "drift", "glow", "reveal", "assemble", "speak", "listen", "think", "greet", "portal-enter", "portal-exit", "live-entrance", "live-exit"],
    reducedMotion: "remove-continuous-decoration-preserve-state",
  },
  mobile: {
    priority: ["silhouette", "depth", "lighting", "composition", "micro-detail"],
    lowPower: true,
    mandatory2dFallback: true,
  },
} as const;

export const ALLPHA_3D_THEME_PROFILES: readonly Allpha3DThemeProfile[] = [
  { key: "aurora-kingdom", family: "luminous-fantasy", geometry: "crystalline-castle-and-floating-arches", material: "frosted-crystal-metal", atmosphere: "aurora-mist", landmark: "aurora-citadel", district: "terraced-royal-gardens", character: "royal-tech-wardrobe", portal: "aurora-arch", accent: ["#63E6BE", "#75B9FF", "#A77CFF"] },
  { key: "celestial-samurai", family: "mythic-japanese", geometry: "pagoda-spires-and-sky-bridges", material: "lacquer-metal-and-paper-glass", atmosphere: "moonlit-clouds", landmark: "celestial-dojo-tower", district: "lantern-courtyards", character: "samurai-tech-accents", portal: "torii-energy-gate", accent: ["#EE7CFF", "#42DCFF", "#F7F9FF"] },
  { key: "chronos-realm", family: "temporal-arcane", geometry: "clockwork-rings-and-floating-plates", material: "brushed-bronze-and-time-glass", atmosphere: "temporal-particles", landmark: "chronos-spire", district: "radial-clock-districts", character: "chrono-mage-tech", portal: "clock-ring-gateway", accent: ["#FCC419", "#A77CFF", "#75B9FF"] },
  { key: "coral-metropolis", family: "oceanic-urban", geometry: "coral-towers-and-wave-forms", material: "wet-glass-and-organic-ceramic", atmosphere: "underwater-haze", landmark: "coral-arcology", district: "reef-neighborhoods", character: "aquatic-citywear", portal: "tidal-arch", accent: ["#63E6BE", "#42DCFF", "#EE7CFF"] },
  { key: "crystal-ai-city", family: "premium-ai-tech", geometry: "faceted-towers-and-data-bridges", material: "crystal-metal-and-holographic-glass", atmosphere: "neural-particles", landmark: "crystal-ai-core", district: "layered-data-plazas", character: "ai-couture", portal: "neural-gateway", accent: ["#42DCFF", "#A77CFF", "#75B9FF"] },
  { key: "desert-starfall", family: "desert-cosmic", geometry: "dunes-and-obelisks", material: "sandstone-metal-and-star-glass", atmosphere: "dust-and-stars", landmark: "starfall-obelisk", district: "oasis-courtyards", character: "desert-navigator", portal: "starfall-arc", accent: ["#FCC419", "#EE7CFF", "#75B9FF"] },
  { key: "dragon-dominion", family: "mythic-draconic", geometry: "cliffs-fortresses-and-dragon-rings", material: "stone-metal-and-ember-crystal", atmosphere: "ember-mist", landmark: "dragon-throne", district: "cliff-kingdoms", character: "dragon-guardian", portal: "dragon-eye-gate", accent: ["#FF6B6B", "#FCC419", "#A77CFF"] },
  { key: "dream-carnival", family: "surreal-playful", geometry: "floating-tents-and-ribbon-arches", material: "soft-metal-and-luminous-fabric", atmosphere: "sparkle-clouds", landmark: "dream-carousel", district: "festival-islands", character: "dream-performer", portal: "ribbon-portal", accent: ["#EE7CFF", "#63E6BE", "#42DCFF"] },
  { key: "emerald-rainforest", family: "living-organic", geometry: "canopy-platforms-and-vines", material: "wood-stone-and-bioglass", atmosphere: "humid-green-mist", landmark: "emerald-tree-core", district: "canopy-villages", character: "forest-explorer", portal: "vine-gateway", accent: ["#63E6BE", "#42DCFF", "#FCC419"] },
  { key: "floating-garden", family: "organic-fantasy", geometry: "floating-islands-and-garden-arches", material: "stone-glass-and-living-fabric", atmosphere: "soft-cloud-haze", landmark: "sky-garden-core", district: "suspended-gardens", character: "garden-architect", portal: "petal-gateway", accent: ["#63E6BE", "#A77CFF", "#F7F9FF"] },
  { key: "galactic-frontier", family: "space-exploration", geometry: "modular-stations-and-orbital-rings", material: "space-metal-and-reactor-glass", atmosphere: "deep-space-dust", landmark: "frontier-command", district: "orbital-outposts", character: "space-pilot", portal: "jump-gate", accent: ["#75B9FF", "#42DCFF", "#A77CFF"] },
  { key: "heroic-nexus", family: "heroic-futurism", geometry: "monumental-platforms-and-energy-spires", material: "hero-metal-and-energy-glass", atmosphere: "heroic-light-rays", landmark: "nexus-monument", district: "hero-plazas", character: "heroic-techwear", portal: "nexus-gate", accent: ["#42DCFF", "#FCC419", "#EE7CFF"] },
  { key: "kingdom-of-aether", family: "ethereal-fantasy", geometry: "aether-rings-and-floating-palaces", material: "pearl-metal-and-cloud-glass", atmosphere: "aether-fog", landmark: "aether-palace", district: "floating-courts", character: "aether-royal", portal: "aether-ring", accent: ["#A77CFF", "#F7F9FF", "#63E6BE"] },
  { key: "lunar-frontier", family: "lunar-scifi", geometry: "moon-bases-and-crater-rings", material: "lunar-metal-and-frost-glass", atmosphere: "cold-lunar-haze", landmark: "lunar-dome", district: "crater-settlements", character: "lunar-explorer", portal: "lunar-gateway", accent: ["#F7F9FF", "#75B9FF", "#A77CFF"] },
  { key: "mars-frontier", family: "martian-scifi", geometry: "red-rock-colonies-and-dome-bridges", material: "oxidized-metal-and-reactor-glass", atmosphere: "martian-dust", landmark: "mars-colony-core", district: "dome-settlements", character: "mars-pioneer", portal: "mars-teleport-gate", accent: ["#FF6B6B", "#FCC419", "#42DCFF"] },
  { key: "mystic-academy", family: "arcane-academia", geometry: "towers-libraries-and-orbital-runes", material: "stone-metal-and-rune-glass", atmosphere: "ink-and-magic-particles", landmark: "academy-observatory", district: "collegiate-courts", character: "arcane-scholar", portal: "rune-gateway", accent: ["#A77CFF", "#EE7CFF", "#75B9FF"] },
  { key: "neo-jakarta-2099", family: "tropical-megacity", geometry: "vertical-megastructures-and-transit-rings", material: "glass-metal-and-neon-concrete", atmosphere: "humid-neon-night", landmark: "jakarta-skyline-core", district: "vertical-kampung-and-mega-blocks", character: "future-nusantara-techwear", portal: "transit-ring", accent: ["#42DCFF", "#EE7CFF", "#63E6BE"] },
  { key: "neon-tokyo", family: "neon-metropolis", geometry: "dense-signage-towers-and-rail-arches", material: "dark-metal-and-neon-glass", atmosphere: "rain-and-neon-haze", landmark: "neon-crossroads", district: "stacked-night-markets", character: "neo-streetwear", portal: "neon-gate", accent: ["#EE7CFF", "#42DCFF", "#75B9FF"] },
  { key: "nusantara-raya", family: "indigenous-futurism", geometry: "archipelago-islands-and-traditional-futurism", material: "wood-metal-and-bio-glass", atmosphere: "tropical-dawn", landmark: "nusantara-gateway", district: "archipelago-villages", character: "nusantara-futurewear", portal: "archipelago-gate", accent: ["#63E6BE", "#FCC419", "#42DCFF"] },
  { key: "oceanic-atlantis", family: "submerged-fantasy", geometry: "underwater-domes-and-column-cities", material: "pearl-metal-and-aqua-glass", atmosphere: "deep-ocean-rays", landmark: "atlantis-core", district: "reef-domes", character: "atlantis-courtwear", portal: "tidal-gateway", accent: ["#42DCFF", "#75B9FF", "#63E6BE"] },
  { key: "pharaoh-eternal", family: "ancient-cosmic", geometry: "pyramids-obelisks-and-solar-rings", material: "sandstone-gold-and-star-glass", atmosphere: "golden-dust", landmark: "solar-pyramid", district: "temple-plazas", character: "solar-pharaoh-tech", portal: "solar-arch", accent: ["#FCC419", "#A77CFF", "#42DCFF"] },
  { key: "quantum-city", family: "quantum-tech", geometry: "impossible-frames-and-layered-grids", material: "dark-metal-and-quantum-glass", atmosphere: "data-fog-and-particles", landmark: "quantum-core", district: "phase-shifted-blocks", character: "quantum-engineer", portal: "phase-gate", accent: ["#42DCFF", "#A77CFF", "#EE7CFF"] },
  { key: "savanna-spirit", family: "living-earth", geometry: "rock-formations-and-canopy-platforms", material: "earth-stone-and-warm-metal", atmosphere: "golden-savanna-haze", landmark: "spirit-tree", district: "savanna-circles", character: "spirit-guardian", portal: "spirit-arch", accent: ["#63E6BE", "#FCC419", "#FF6B6B"] },
  { key: "skyforge-empire", family: "industrial-fantasy", geometry: "sky-forges-and-steel-bridges", material: "forged-metal-and-energy-crystal", atmosphere: "forge-smoke-and-sparks", landmark: "skyforge-core", district: "forge-platforms", character: "skyforge-engineer", portal: "forge-gate", accent: ["#FCC419", "#42DCFF", "#FF6B6B"] },
  { key: "viking-fjord", family: "nordic-frontier", geometry: "fjord-cliffs-and-longhouse-platforms", material: "stone-timber-and-ice-metal", atmosphere: "cold-sea-mist", landmark: "fjord-hall", district: "cliff-harbors", character: "nordic-explorer", portal: "fjord-arch", accent: ["#75B9FF", "#F7F9FF", "#63E6BE"] },
] as const;
