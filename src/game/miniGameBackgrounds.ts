import type { MiniGameId } from "./miniGameProgress";
import type { MiniGameBackgroundGalleryItem, MiniGameBackgroundsState, PlayerState } from "../types";

export type MiniGameBackgroundDefinition = {
  id: string;
  name: string;
  source: "built-in" | "gallery";
  cost: number;
  compatibleGames: MiniGameId[];
  preview: string;
  asset: string;
  overlayStrength: number;
  animated?: boolean;
};

const ALL_GAMES: MiniGameId[] = ["gate-dodge", "shadow-strike", "mana-memory", "rune-lock", "shadow-extraction"];
const HUB_TRAINING_ARENA = new URL("../assets/hub/training-arena.png", import.meta.url).href;
const HUB_DUNGEON_GATE = new URL("../assets/hub/dungeon-gate.png", import.meta.url).href;
const HUB_SKILL_TOWER = new URL("../assets/hub/skill-tower.png", import.meta.url).href;
const HUB_DATA_VAULT = new URL("../assets/hub/data-vault.png", import.meta.url).href;
const SHADOW_WRAITH = new URL("../assets/models/monster-abyss-mage-wraith.png", import.meta.url).href;
const GAME_BG_SOLO_GATE = new URL("../assets/backgrounds/mini-games/01-solo-gate-purple.jpg", import.meta.url).href;
const GAME_BG_SIEGE_WALL = new URL("../assets/backgrounds/mini-games/02-siege-wall-sunset.jpg", import.meta.url).href;
const GAME_BG_SHINOBI_MOUNTAIN = new URL("../assets/backgrounds/mini-games/03-shinobi-mountain.jpg", import.meta.url).href;
const GAME_BG_BLUE_MOON_TOWER = new URL("../assets/backgrounds/mini-games/04-blue-moon-tower.jpg", import.meta.url).href;
const GAME_BG_DEMON_MOON_TOWN = new URL("../assets/backgrounds/mini-games/05-demon-moon-town.jpg", import.meta.url).href;
const GAME_BG_CURSED_RED_CITY = new URL("../assets/backgrounds/mini-games/06-cursed-red-city.jpg", import.meta.url).href;
const GAME_BG_SUNNY_PIRATE_ISLAND = new URL("../assets/backgrounds/mini-games/07-sunny-pirate-island.jpg", import.meta.url).href;
const GAME_BG_DRAGON_WASTELAND = new URL("../assets/backgrounds/mini-games/08-dragon-golden-wasteland.jpg", import.meta.url).href;
const GAME_BG_RED_RAIN_STREETS = new URL("../assets/backgrounds/mini-games/09-red-rain-streets.jpg", import.meta.url).href;
const GAME_BG_GREEN_STORM_CITY = new URL("../assets/backgrounds/mini-games/10-green-storm-city.jpg", import.meta.url).href;

export const MINI_GAME_BACKGROUNDS: MiniGameBackgroundDefinition[] = [
  {
    id: "system-grid",
    name: "System Grid",
    source: "built-in",
    cost: 0,
    compatibleGames: ALL_GAMES,
    preview: HUB_TRAINING_ARENA,
    asset: HUB_TRAINING_ARENA,
    overlayStrength: 0.62,
  },
  {
    id: "dungeon-gate",
    name: "Brama Lochu",
    source: "built-in",
    cost: 180,
    compatibleGames: ["gate-dodge", "shadow-strike", "shadow-extraction"],
    preview: HUB_DUNGEON_GATE,
    asset: HUB_DUNGEON_GATE,
    overlayStrength: 0.56,
  },
  {
    id: "rune-tower",
    name: "Wieża Run",
    source: "built-in",
    cost: 220,
    compatibleGames: ["rune-lock", "mana-memory", "shadow-extraction"],
    preview: HUB_SKILL_TOWER,
    asset: HUB_SKILL_TOWER,
    overlayStrength: 0.58,
    animated: true,
  },
  {
    id: "data-vault",
    name: "Krypta Danych",
    source: "built-in",
    cost: 260,
    compatibleGames: ["mana-memory", "rune-lock"],
    preview: HUB_DATA_VAULT,
    asset: HUB_DATA_VAULT,
    overlayStrength: 0.54,
  },
  {
    id: "shadow-arena",
    name: "Arena Cienia",
    source: "built-in",
    cost: 320,
    compatibleGames: ["shadow-extraction", "shadow-strike"],
    preview: SHADOW_WRAITH,
    asset: HUB_SKILL_TOWER,
    overlayStrength: 0.68,
    animated: true,
  },
  {
    id: "training-light",
    name: "Jasny Trening",
    source: "built-in",
    cost: 160,
    compatibleGames: ALL_GAMES,
    preview: HUB_TRAINING_ARENA,
    asset: HUB_TRAINING_ARENA,
    overlayStrength: 0.42,
  },
  {
    id: "solo-gate-purple",
    name: "Solo Gate",
    source: "built-in",
    cost: 260,
    compatibleGames: ALL_GAMES,
    preview: GAME_BG_SOLO_GATE,
    asset: GAME_BG_SOLO_GATE,
    overlayStrength: 0.62,
    animated: true,
  },
  {
    id: "siege-wall-sunset",
    name: "Mur Oblężenia",
    source: "built-in",
    cost: 240,
    compatibleGames: ["gate-dodge", "shadow-strike", "rune-lock"],
    preview: GAME_BG_SIEGE_WALL,
    asset: GAME_BG_SIEGE_WALL,
    overlayStrength: 0.52,
  },
  {
    id: "shinobi-mountain",
    name: "Dolina Shinobi",
    source: "built-in",
    cost: 280,
    compatibleGames: ["shadow-strike", "gate-dodge", "mana-memory"],
    preview: GAME_BG_SHINOBI_MOUNTAIN,
    asset: GAME_BG_SHINOBI_MOUNTAIN,
    overlayStrength: 0.5,
  },
  {
    id: "blue-moon-tower",
    name: "Wieża Błękitnego Księżyca",
    source: "built-in",
    cost: 320,
    compatibleGames: ["shadow-extraction", "rune-lock", "mana-memory"],
    preview: GAME_BG_BLUE_MOON_TOWER,
    asset: GAME_BG_BLUE_MOON_TOWER,
    overlayStrength: 0.58,
    animated: true,
  },
  {
    id: "demon-moon-town",
    name: "Miasto Krwawego Księżyca",
    source: "built-in",
    cost: 340,
    compatibleGames: ["shadow-extraction", "shadow-strike", "gate-dodge"],
    preview: GAME_BG_DEMON_MOON_TOWN,
    asset: GAME_BG_DEMON_MOON_TOWN,
    overlayStrength: 0.6,
  },
  {
    id: "cursed-red-city",
    name: "Przeklęta Metropolia",
    source: "built-in",
    cost: 360,
    compatibleGames: ["gate-dodge", "shadow-extraction", "rune-lock"],
    preview: GAME_BG_CURSED_RED_CITY,
    asset: GAME_BG_CURSED_RED_CITY,
    overlayStrength: 0.62,
  },
  {
    id: "sunny-pirate-island",
    name: "Wyspa Błękitnego Nieba",
    source: "built-in",
    cost: 220,
    compatibleGames: ALL_GAMES,
    preview: GAME_BG_SUNNY_PIRATE_ISLAND,
    asset: GAME_BG_SUNNY_PIRATE_ISLAND,
    overlayStrength: 0.44,
  },
  {
    id: "dragon-golden-wasteland",
    name: "Smocze Pustkowie",
    source: "built-in",
    cost: 300,
    compatibleGames: ["gate-dodge", "shadow-strike", "mana-memory"],
    preview: GAME_BG_DRAGON_WASTELAND,
    asset: GAME_BG_DRAGON_WASTELAND,
    overlayStrength: 0.5,
  },
  {
    id: "red-rain-streets",
    name: "Ulice Czerwonego Deszczu",
    source: "built-in",
    cost: 320,
    compatibleGames: ["shadow-extraction", "shadow-strike", "gate-dodge"],
    preview: GAME_BG_RED_RAIN_STREETS,
    asset: GAME_BG_RED_RAIN_STREETS,
    overlayStrength: 0.6,
  },
  {
    id: "green-storm-city",
    name: "Zielona Burza",
    source: "built-in",
    cost: 320,
    compatibleGames: ["mana-memory", "rune-lock", "gate-dodge"],
    preview: GAME_BG_GREEN_STORM_CITY,
    asset: GAME_BG_GREEN_STORM_CITY,
    overlayStrength: 0.56,
  },
];

export function normalizeMiniGameBackgrounds(input?: Partial<MiniGameBackgroundsState>): MiniGameBackgroundsState {
  const knownIds = new Set(MINI_GAME_BACKGROUNDS.map((background) => background.id));
  const gallery = Array.isArray(input?.galleryBackgrounds)
    ? input.galleryBackgrounds.filter(isGalleryBackground)
    : [];
  const galleryIds = new Set(gallery.map((background) => background.id));
  const ownedIds = Array.isArray(input?.ownedIds)
    ? input.ownedIds.filter((id): id is string => typeof id === "string" && (knownIds.has(id) || galleryIds.has(id)))
    : [];
  const selectedByGame: Partial<Record<MiniGameId, string>> = {};

  Object.entries(input?.selectedByGame || {}).forEach(([gameId, backgroundId]) => {
    if (!isMiniGameId(gameId) || typeof backgroundId !== "string") return;
    if (canUseBackgroundForGame(backgroundId, gameId, gallery)) selectedByGame[gameId] = backgroundId;
  });

  return {
    ownedIds: Array.from(new Set(["system-grid", ...ownedIds, ...gallery.map((item) => item.id)])),
    selectedByGame,
    galleryBackgrounds: gallery,
  };
}

export function getAvailableBackgroundsForGame(
  gameId: MiniGameId,
  state?: MiniGameBackgroundsState
): MiniGameBackgroundDefinition[] {
  const gallery = state?.galleryBackgrounds || [];
  return [
    ...MINI_GAME_BACKGROUNDS.filter((background) => background.compatibleGames.includes(gameId)),
    ...gallery.map(toGalleryDefinition),
  ];
}

export function getSelectedBackgroundForGame(
  gameId: MiniGameId,
  state?: MiniGameBackgroundsState
): MiniGameBackgroundDefinition {
  const normalized = normalizeMiniGameBackgrounds(state);
  const selectedId = normalized.selectedByGame[gameId];
  const available = getAvailableBackgroundsForGame(gameId, normalized);
  return available.find((background) => background.id === selectedId) || available[0] || MINI_GAME_BACKGROUNDS[0];
}

export function canBuyMiniGameBackground(player: PlayerState, backgroundId: string): boolean {
  const state = normalizeMiniGameBackgrounds(player.miniGameBackgrounds);
  const definition = MINI_GAME_BACKGROUNDS.find((background) => background.id === backgroundId);
  return Boolean(definition && !state.ownedIds.includes(backgroundId) && player.gold >= definition.cost);
}

export function isMiniGameBackgroundOwned(state: MiniGameBackgroundsState | undefined, backgroundId: string): boolean {
  return normalizeMiniGameBackgrounds(state).ownedIds.includes(backgroundId);
}

export function createGalleryMiniGameBackground(fileName: string, previewDataUrl: string): MiniGameBackgroundGalleryItem {
  return {
    id: `gallery-bg-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name: fileName.replace(/\.[^.]+$/, "").slice(0, 28) || "Tło gracza",
    createdAt: new Date().toISOString(),
    previewDataUrl,
  };
}

function toGalleryDefinition(item: MiniGameBackgroundGalleryItem): MiniGameBackgroundDefinition {
  return {
    id: item.id,
    name: item.name,
    source: "gallery",
    cost: 0,
    compatibleGames: ALL_GAMES,
    preview: item.previewDataUrl,
    asset: item.previewDataUrl,
    overlayStrength: 0.6,
  };
}

function canUseBackgroundForGame(backgroundId: string, gameId: MiniGameId, gallery: MiniGameBackgroundGalleryItem[]) {
  if (gallery.some((item) => item.id === backgroundId)) return true;
  return MINI_GAME_BACKGROUNDS.some((background) => background.id === backgroundId && background.compatibleGames.includes(gameId));
}

function isGalleryBackground(value: unknown): value is MiniGameBackgroundGalleryItem {
  if (!value || typeof value !== "object") return false;
  const item = value as MiniGameBackgroundGalleryItem;
  return typeof item.id === "string" && typeof item.name === "string" && typeof item.previewDataUrl === "string";
}

function isMiniGameId(value: string): value is MiniGameId {
  return ALL_GAMES.includes(value as MiniGameId);
}
