import type { AppThemeId, PlayerState, ThemeEffectId } from "../types";

export type { ThemeEffectId } from "../types";

export type ThemeCategory = "system" | "anime" | "wallpaper";
export type ThemeEffectCategory = "ambient" | "hud";

export type ThemeDefinition = {
  id: AppThemeId;
  name: string;
  category: ThemeCategory;
  cost: number;
  accent: string;
  description: string;
  previewGradient: string;
  cssVars: Record<string, string>;
};

export type ThemeEffectDefinition = {
  id: ThemeEffectId;
  name: string;
  category: ThemeEffectCategory;
  cost: number;
  description: string;
  previewGradient: string;
};

export type ThemeWallpaperDefinition = {
  id: string;
  name: string;
  category: "system" | "gate" | "city" | "anime";
  cost: number;
  description: string;
  preview: string | null;
  asset: string | null;
  overlayStrength: number;
};

const APP_BG_SOLO_CITADEL = new URL("../assets/backgrounds/app/solo-purple-citadel.jpg", import.meta.url).href;
const APP_BG_SHADOW_CITADEL = new URL("../assets/backgrounds/app/01-shadow-citadel-purple.jpg", import.meta.url).href;
const APP_BG_FROST_TEMPLE = new URL("../assets/backgrounds/app/02-frost-temple-blue.jpg", import.meta.url).href;
const APP_BG_BLOOD_ECLIPSE = new URL("../assets/backgrounds/app/03-blood-eclipse-red.jpg", import.meta.url).href;
const APP_BG_RAIN_CITY = new URL("../assets/backgrounds/app/04-rain-city-night.jpg", import.meta.url).href;
const APP_BG_AZURE_GATE = new URL("../assets/backgrounds/app/05-azure-gate-ruins.jpg", import.meta.url).href;
const APP_BG_GOLD_WASTELAND = new URL("../assets/backgrounds/app/06-golden-wasteland.jpg", import.meta.url).href;
const APP_BG_VOID_ECLIPSE = new URL("../assets/backgrounds/app/07-void-eclipse-purple.jpg", import.meta.url).href;
const APP_BG_CYAN_RUINS = new URL("../assets/backgrounds/app/08-cyan-ruins-gate.jpg", import.meta.url).href;
const APP_BG_DISTANT_TOWER = new URL("../assets/backgrounds/app/09-distant-tower-night.jpg", import.meta.url).href;

export const REQUIRED_THEME_VARS = [
  "--theme-bg",
  "--theme-panel",
  "--theme-card",
  "--theme-text",
  "--theme-muted",
  "--theme-border",
  "--theme-accent",
  "--theme-accent-text",
  "--theme-accent-soft",
  "--theme-danger",
  "--theme-danger-text",
  "--theme-success",
  "--theme-success-text",
  "--theme-warning",
  "--theme-warning-text",
  "--theme-nav",
  "--theme-input",
  "--theme-modal",
  "--theme-overlay",
  "--theme-scrollbar",
  "--theme-focus",
  "--theme-game-hud",
  "--theme-game-hud-text",
  "--theme-button-primary",
  "--theme-button-primary-text",
  "--theme-button-secondary",
  "--theme-button-secondary-text",
  "--theme-shell-gradient",
  "--theme-panel-gradient",
  "--theme-card-gradient",
  "--theme-modal-gradient",
  "--theme-nav-gradient",
  "--theme-text-strong",
  "--theme-text-inverse",
  "--theme-disabled",
  "--theme-disabled-text",
  "--theme-progress-track",
  "--theme-progress-fill",
  "--theme-ring-bg",
  "--theme-tab-active",
  "--theme-tab-inactive",
  "--theme-badge",
  "--theme-icon",
  "--theme-shadow",
  "--theme-danger-soft",
  "--theme-success-soft",
  "--theme-warning-soft",
  "--theme-game-bg",
] as const;

export const THEME_DEFINITIONS: ThemeDefinition[] = [
  {
    id: "system-dark",
    name: "System Dark",
    category: "system",
    cost: 0,
    accent: "cyan",
    description: "Domyślny ciemny motyw Systemu.",
    previewGradient: "linear-gradient(135deg, #020617 0%, #082f49 55%, #111827 100%)",
    cssVars: {
      "--theme-bg": "#020617",
      "--theme-panel": "rgba(2, 6, 23, 0.88)",
      "--theme-accent": "#22d3ee",
      "--theme-accent-soft": "rgba(34, 211, 238, 0.16)",
      "--theme-danger": "#fb7185",
    },
  },
  {
    id: "system-light",
    name: "System Light",
    category: "system",
    cost: 250,
    accent: "sky",
    description: "Jaśniejszy wariant z wysoką czytelnością.",
    previewGradient: "linear-gradient(135deg, #dbeafe 0%, #f8fafc 55%, #bae6fd 100%)",
    cssVars: {
      "--theme-bg": "#dbeafe",
      "--theme-panel": "rgba(248, 250, 252, 0.9)",
      "--theme-accent": "#0284c7",
      "--theme-accent-soft": "rgba(2, 132, 199, 0.16)",
      "--theme-danger": "#dc2626",
    },
  },
  {
    id: "system-blue",
    name: "Blue Gate",
    category: "system",
    cost: 450,
    accent: "blue",
    description: "Chłodny motyw bramy z mocnym niebieskim światłem.",
    previewGradient: "linear-gradient(135deg, #020617 0%, #1d4ed8 52%, #06b6d4 100%)",
    cssVars: {
      "--theme-bg": "#020617",
      "--theme-panel": "rgba(15, 23, 42, 0.9)",
      "--theme-accent": "#38bdf8",
      "--theme-accent-soft": "rgba(56, 189, 248, 0.18)",
      "--theme-danger": "#f43f5e",
    },
  },
  {
    id: "system-red",
    name: "Red Raid",
    category: "system",
    cost: 450,
    accent: "red",
    description: "Agresywny motyw rajdu i ostrzeżeń.",
    previewGradient: "linear-gradient(135deg, #09090b 0%, #7f1d1d 58%, #fb7185 100%)",
    cssVars: {
      "--theme-bg": "#09090b",
      "--theme-panel": "rgba(12, 10, 9, 0.9)",
      "--theme-accent": "#fb7185",
      "--theme-accent-soft": "rgba(251, 113, 133, 0.16)",
      "--theme-danger": "#f97316",
    },
  },
  {
    id: "system-pink",
    name: "Pink Aura",
    category: "anime",
    cost: 650,
    accent: "pink",
    description: "Neonowy, lżejszy motyw z różowym akcentem.",
    previewGradient: "linear-gradient(135deg, #12051a 0%, #be185d 52%, #f9a8d4 100%)",
    cssVars: {
      "--theme-bg": "#12051a",
      "--theme-panel": "rgba(24, 5, 36, 0.9)",
      "--theme-accent": "#f472b6",
      "--theme-accent-soft": "rgba(244, 114, 182, 0.18)",
      "--theme-danger": "#fb7185",
    },
  },
  {
    id: "anime",
    name: "Anime Core",
    category: "anime",
    cost: 900,
    accent: "violet",
    description: "Mocniejszy fiolet i bardziej widowiskowe podświetlenia.",
    previewGradient: "linear-gradient(135deg, #0f0524 0%, #6d28d9 56%, #22d3ee 100%)",
    cssVars: {
      "--theme-bg": "#0f0524",
      "--theme-panel": "rgba(17, 24, 39, 0.9)",
      "--theme-accent": "#a78bfa",
      "--theme-accent-soft": "rgba(167, 139, 250, 0.18)",
      "--theme-danger": "#fb7185",
    },
  },
  {
    id: "isekai",
    name: "Isekai Gate",
    category: "anime",
    cost: 1100,
    accent: "emerald",
    description: "Magiczna zieleń, runy i jaśniejsza energia.",
    previewGradient: "linear-gradient(135deg, #031712 0%, #047857 55%, #67e8f9 100%)",
    cssVars: {
      "--theme-bg": "#031712",
      "--theme-panel": "rgba(6, 78, 59, 0.86)",
      "--theme-accent": "#34d399",
      "--theme-accent-soft": "rgba(52, 211, 153, 0.17)",
      "--theme-danger": "#fb7185",
    },
  },
  {
    id: "kawaii",
    name: "Kawaii Anime",
    category: "anime",
    cost: 1400,
    accent: "rose",
    description: "Miększe tła i pastelowy akcent bez ciężkich assetów.",
    previewGradient: "linear-gradient(135deg, #241126 0%, #fb7185 55%, #fef3c7 100%)",
    cssVars: {
      "--theme-bg": "#241126",
      "--theme-panel": "rgba(49, 18, 54, 0.88)",
      "--theme-accent": "#f9a8d4",
      "--theme-accent-soft": "rgba(249, 168, 212, 0.18)",
      "--theme-danger": "#f43f5e",
    },
  },
];

export const THEME_EFFECT_DEFINITIONS: ThemeEffectDefinition[] = [
  {
    id: "none",
    name: "Bez dodatku",
    category: "ambient",
    cost: 0,
    description: "Czysty motyw bez dodatkowej animacji w tle.",
    previewGradient: "linear-gradient(135deg, rgba(15,23,42,0.9), rgba(2,6,23,0.9))",
  },
  {
    id: "monarch-code",
    name: "Kod Monarchii",
    category: "ambient",
    cost: 850,
    description: "Ruchome runy i pionowy deszcz kodu w stylu Systemu. Działa jako dodatek do każdego motywu.",
    previewGradient: "linear-gradient(135deg, #020617 0%, #0f766e 45%, #7c3aed 100%)",
  },
];

export const THEME_WALLPAPER_DEFINITIONS: ThemeWallpaperDefinition[] = [
  {
    id: "none",
    name: "Bez tapety",
    category: "system",
    cost: 0,
    description: "Czysty gradient aktywnego motywu.",
    preview: null,
    asset: null,
    overlayStrength: 0,
  },
  {
    id: "solo-purple-citadel",
    name: "Fioletowa Cytadela",
    category: "gate",
    cost: 0,
    description: "Pełnoekranowa tapeta startowa z nowego folderu tła.",
    preview: APP_BG_SOLO_CITADEL,
    asset: APP_BG_SOLO_CITADEL,
    overlayStrength: 0.7,
  },
  {
    id: "shadow-citadel-purple",
    name: "Brama Monarchii",
    category: "gate",
    cost: 180,
    description: "Panorama fioletowej bramy pod ciemne i anime motywy.",
    preview: APP_BG_SHADOW_CITADEL,
    asset: APP_BG_SHADOW_CITADEL,
    overlayStrength: 0.64,
  },
  {
    id: "frost-temple-blue",
    name: "Lodowa Świątynia",
    category: "gate",
    cost: 220,
    description: "Chłodny błękit z mocną czytelnością paneli.",
    preview: APP_BG_FROST_TEMPLE,
    asset: APP_BG_FROST_TEMPLE,
    overlayStrength: 0.62,
  },
  {
    id: "blood-eclipse-red",
    name: "Czerwone Zaćmienie",
    category: "gate",
    cost: 260,
    description: "Agresywne czerwone tło do rajdowego klimatu.",
    preview: APP_BG_BLOOD_ECLIPSE,
    asset: APP_BG_BLOOD_ECLIPSE,
    overlayStrength: 0.66,
  },
  {
    id: "rain-city-night",
    name: "Nocne Miasto",
    category: "city",
    cost: 220,
    description: "Miejski, stalowy klimat pod lżejsze panele.",
    preview: APP_BG_RAIN_CITY,
    asset: APP_BG_RAIN_CITY,
    overlayStrength: 0.58,
  },
  {
    id: "azure-gate-ruins",
    name: "Błękitna Brama",
    category: "gate",
    cost: 280,
    description: "Niebieska energia, dobra dla motywów System Blue.",
    preview: APP_BG_AZURE_GATE,
    asset: APP_BG_AZURE_GATE,
    overlayStrength: 0.62,
  },
  {
    id: "golden-wasteland",
    name: "Złote Pustkowie",
    category: "anime",
    cost: 300,
    description: "Ciepły wariant do light, isekai i treningu.",
    preview: APP_BG_GOLD_WASTELAND,
    asset: APP_BG_GOLD_WASTELAND,
    overlayStrength: 0.56,
  },
  {
    id: "void-eclipse-purple",
    name: "Pustka Zaćmienia",
    category: "gate",
    cost: 320,
    description: "Mocny fiolet pod anime i Kawaii Anime.",
    preview: APP_BG_VOID_ECLIPSE,
    asset: APP_BG_VOID_ECLIPSE,
    overlayStrength: 0.64,
  },
  {
    id: "cyan-ruins-gate",
    name: "Turkusowe Ruiny",
    category: "gate",
    cost: 340,
    description: "Runiczna poświata i ciemne ruiny pod System.",
    preview: APP_BG_CYAN_RUINS,
    asset: APP_BG_CYAN_RUINS,
    overlayStrength: 0.62,
  },
  {
    id: "distant-tower-night",
    name: "Daleka Wieża",
    category: "city",
    cost: 260,
    description: "Minimalniejsze tło do spokojnego UI.",
    preview: APP_BG_DISTANT_TOWER,
    asset: APP_BG_DISTANT_TOWER,
    overlayStrength: 0.58,
  },
];

export function normalizeOwnedThemes(owned: unknown): AppThemeId[] {
  const known = new Set(THEME_DEFINITIONS.map((theme) => theme.id));
  const parsed = Array.isArray(owned)
    ? owned.filter((id): id is AppThemeId => typeof id === "string" && known.has(id as AppThemeId))
    : [];
  return parsed.includes("system-dark") ? parsed : ["system-dark", ...parsed];
}

export function normalizeOwnedThemeWallpapers(owned: unknown): string[] {
  const known = new Set(THEME_WALLPAPER_DEFINITIONS.map((wallpaper) => wallpaper.id));
  const freeIds = THEME_WALLPAPER_DEFINITIONS.filter((wallpaper) => wallpaper.cost === 0).map((wallpaper) => wallpaper.id);
  const parsed = Array.isArray(owned)
    ? owned.filter((id): id is string => typeof id === "string" && known.has(id))
    : [];
  return Array.from(new Set([...freeIds, ...parsed]));
}

export function normalizeOwnedThemeEffects(owned: unknown): ThemeEffectId[] {
  const known = new Set(THEME_EFFECT_DEFINITIONS.map((effect) => effect.id));
  const parsed = Array.isArray(owned)
    ? owned.filter((id): id is ThemeEffectId => typeof id === "string" && known.has(id as ThemeEffectId))
    : [];
  return parsed.includes("none") ? parsed : ["none", ...parsed];
}

export function getThemeDefinition(id: AppThemeId | string | null | undefined): ThemeDefinition {
  return THEME_DEFINITIONS.find((theme) => theme.id === id) ?? THEME_DEFINITIONS[0];
}

export function getThemeEffectDefinition(id: ThemeEffectId | string | null | undefined): ThemeEffectDefinition {
  return THEME_EFFECT_DEFINITIONS.find((effect) => effect.id === id) ?? THEME_EFFECT_DEFINITIONS[0];
}

export function getThemeWallpaperDefinition(id: string | null | undefined): ThemeWallpaperDefinition {
  return THEME_WALLPAPER_DEFINITIONS.find((wallpaper) => wallpaper.id === id) ?? THEME_WALLPAPER_DEFINITIONS[0];
}

export function canBuyTheme(player: PlayerState, themeId: AppThemeId): boolean {
  const theme = getThemeDefinition(themeId);
  return !player.settings.ownedThemeIds.includes(themeId) && player.gold >= theme.cost;
}

export function canBuyThemeWallpaper(player: PlayerState, wallpaperId: string): boolean {
  const wallpaper = getThemeWallpaperDefinition(wallpaperId);
  const owned = normalizeOwnedThemeWallpapers(player.settings.ownedThemeWallpaperIds);
  return wallpaper.id !== "none" && !owned.includes(wallpaper.id) && player.gold >= wallpaper.cost;
}

export function canBuyThemeEffect(player: PlayerState, effectId: ThemeEffectId): boolean {
  const effect = getThemeEffectDefinition(effectId);
  return effect.id !== "none" && !player.settings.ownedThemeEffectIds.includes(effectId) && player.gold >= effect.cost;
}

export function applyThemeToDocument(themeId: AppThemeId | string | null | undefined): void {
  if (typeof document === "undefined") return;
  const theme = getThemeDefinition(themeId);
  const rootStyle = document.documentElement.style;
  for (let index = rootStyle.length - 1; index >= 0; index -= 1) {
    const propertyName = rootStyle.item(index);
    if (propertyName.startsWith("--theme-")) {
      rootStyle.removeProperty(propertyName);
    }
  }
  document.documentElement.dataset.theme = theme.id;
  Object.entries(getCompleteThemeVars(theme)).forEach(([key, value]) => {
    rootStyle.setProperty(key, value);
  });
}

export function applyThemeEffectToDocument(effectId: ThemeEffectId | string | null | undefined): void {
  if (typeof document === "undefined") return;
  document.documentElement.dataset.themeEffect = getThemeEffectDefinition(effectId).id;
}

export function getCompleteThemeVars(theme: ThemeDefinition): Record<(typeof REQUIRED_THEME_VARS)[number], string> & Record<string, string> {
  const isLight = theme.id === "system-light";
  const base = {
    "--theme-bg": isLight ? "#e8f6ff" : "#020617",
    "--theme-panel": isLight ? "#f8fbff" : "rgba(2, 6, 23, 0.88)",
    "--theme-card": isLight ? "#ffffff" : "rgba(15,23,42,0.78)",
    "--theme-text": isLight ? "#0f172a" : "#f8fafc",
    "--theme-muted": isLight ? "#475569" : "#94a3b8",
    "--theme-border": isLight ? "rgba(2, 132, 199, 0.28)" : "rgba(125,211,252,0.22)",
    "--theme-accent": "#22d3ee",
    "--theme-accent-text": isLight ? "#075985" : "#cffafe",
    "--theme-accent-soft": isLight ? "rgba(2, 132, 199, 0.13)" : "rgba(34, 211, 238, 0.16)",
    "--theme-danger": "#fb7185",
    "--theme-danger-text": isLight ? "#991b1b" : "#ffe4e6",
    "--theme-success": isLight ? "#0f9f6e" : "#34d399",
    "--theme-success-text": isLight ? "#065f46" : "#d1fae5",
    "--theme-warning": isLight ? "#b45309" : "#facc15",
    "--theme-warning-text": isLight ? "#92400e" : "#fef3c7",
    "--theme-nav": isLight ? "#f8fbff" : "rgba(2,6,23,0.94)",
    "--theme-input": isLight ? "#ffffff" : "rgba(2,6,23,0.72)",
    "--theme-modal": isLight ? "#f8fbff" : "rgba(2,6,23,0.96)",
    "--theme-overlay": isLight ? "rgba(15,23,42,0.28)" : "rgba(0,0,0,0.72)",
    "--theme-scrollbar": isLight ? "#38bdf8" : "#52525b",
    "--theme-focus": "color-mix(in srgb, var(--theme-accent) 70%, white)",
    "--theme-game-hud": isLight ? "rgba(255,255,255,0.74)" : "rgba(2,6,23,0.62)",
    "--theme-button-primary": isLight
      ? "linear-gradient(135deg, color-mix(in srgb, var(--theme-accent) 34%, white), color-mix(in srgb, var(--theme-accent) 18%, white))"
      : "color-mix(in srgb, var(--theme-accent) 28%, transparent)",
    "--theme-button-primary-text": isLight ? "#082f49" : "#f8fafc",
    "--theme-button-secondary": isLight ? "#ffffff" : "rgba(15,23,42,0.74)",
    "--theme-button-secondary-text": isLight ? "#0f172a" : "#f8fafc",
    "--theme-game-bg": "linear-gradient(180deg, color-mix(in srgb, var(--theme-bg) 82%, #0f172a), var(--theme-bg))",
  };
  const semantic = {
    ...base,
    ...theme.cssVars,
  };

  const derived = {
    "--theme-game-hud-text": "var(--theme-text)",
    "--theme-shell-gradient": isLight
      ? "linear-gradient(180deg, color-mix(in srgb, var(--theme-panel) 88%, white), color-mix(in srgb, var(--theme-bg) 42%, white))"
      : "linear-gradient(180deg, color-mix(in srgb, var(--theme-panel) 82%, transparent), color-mix(in srgb, var(--theme-bg) 78%, black))",
    "--theme-panel-gradient": isLight
      ? "radial-gradient(circle at 50% 0%, var(--theme-accent-soft), transparent 58%), linear-gradient(135deg, color-mix(in srgb, var(--theme-panel) 92%, white), color-mix(in srgb, var(--theme-bg) 42%, white))"
      : "radial-gradient(circle at 50% 0%, color-mix(in srgb, var(--theme-accent) 14%, transparent), transparent 58%), linear-gradient(135deg, var(--theme-panel), color-mix(in srgb, var(--theme-bg) 72%, black))",
    "--theme-card-gradient": isLight
      ? "radial-gradient(circle at 50% 0%, var(--theme-accent-soft), transparent 58%), linear-gradient(135deg, color-mix(in srgb, var(--theme-card) 94%, white), color-mix(in srgb, var(--theme-bg) 50%, white))"
      : "radial-gradient(circle at 50% 0%, color-mix(in srgb, var(--theme-accent) 10%, transparent), transparent 58%), linear-gradient(135deg, var(--theme-card), color-mix(in srgb, var(--theme-bg) 72%, black))",
    "--theme-modal-gradient": isLight
      ? "radial-gradient(circle at 50% 0%, var(--theme-accent-soft), transparent 58%), linear-gradient(135deg, color-mix(in srgb, var(--theme-modal) 95%, white), color-mix(in srgb, var(--theme-bg) 45%, white))"
      : "radial-gradient(circle at 50% 0%, color-mix(in srgb, var(--theme-accent) 12%, transparent), transparent 58%), linear-gradient(135deg, var(--theme-modal), color-mix(in srgb, var(--theme-bg) 76%, black))",
    "--theme-nav-gradient": isLight
      ? "radial-gradient(circle at 50% 0%, var(--theme-accent-soft), transparent 58%), linear-gradient(180deg, color-mix(in srgb, var(--theme-nav) 94%, white), color-mix(in srgb, var(--theme-bg) 36%, white))"
      : "radial-gradient(circle at 50% 0%, color-mix(in srgb, var(--theme-accent) 12%, transparent), transparent 58%), linear-gradient(180deg, var(--theme-nav), color-mix(in srgb, var(--theme-bg) 78%, black))",
    "--theme-text-strong": isLight ? "#020617" : "#ffffff",
    "--theme-text-inverse": isLight ? "#f8fafc" : "#020617",
    "--theme-disabled": isLight ? "rgba(148, 163, 184, 0.28)" : "rgba(51, 65, 85, 0.72)",
    "--theme-disabled-text": isLight ? "#64748b" : "#64748b",
    "--theme-progress-track": isLight ? "rgba(100, 116, 139, 0.28)" : "rgba(0, 0, 0, 0.72)",
    "--theme-progress-fill": "var(--theme-accent)",
    "--theme-ring-bg": isLight ? "rgba(255, 255, 255, 0.88)" : "rgba(2, 6, 23, 0.92)",
    "--theme-tab-active": "color-mix(in srgb, var(--theme-accent) 26%, var(--theme-input))",
    "--theme-tab-inactive": isLight ? "rgba(255,255,255,0.68)" : "rgba(15,23,42,0.58)",
    "--theme-badge": "color-mix(in srgb, var(--theme-accent) 18%, var(--theme-input))",
    "--theme-icon": "color-mix(in srgb, var(--theme-accent) 80%, var(--theme-text))",
    "--theme-shadow": isLight ? "rgba(15, 23, 42, 0.12)" : "rgba(0, 0, 0, 0.36)",
    "--theme-danger-soft": "color-mix(in srgb, var(--theme-danger) 14%, transparent)",
    "--theme-success-soft": "color-mix(in srgb, var(--theme-success) 14%, transparent)",
    "--theme-warning-soft": "color-mix(in srgb, var(--theme-warning) 14%, transparent)",
  };

  return { ...semantic, ...derived };
}
