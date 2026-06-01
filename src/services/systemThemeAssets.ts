import manifestUrl from "../assets/sololv/manifest.json?url";
import {
  DEFAULT_MUSIC_BY_CONTEXT,
  LOCAL_MUSIC_TRACKS,
  getLocalMusicTrack,
  isLocalMusicTrackId,
  normalizeMusicTrackSelection,
  type LocalMusicTrackId,
} from "../assets/music/solo-leveling-local/manifest";
import { normalizeMusicContext, pickMusicUrl, type ThemeMusicContext, type ThemeMusicId } from "./musicTheme";

export type SystemThemeAssetKind = "audio" | "music" | "effect" | "ui" | "unknown";

export type SystemThemeManifestAsset = {
  id: string;
  kind: SystemThemeAssetKind;
  fileName: string;
  sourcePath?: string;
  sizeBytes?: number;
  status: "imported" | "candidate" | "skipped" | "missing";
};

export type SystemThemeManifest = {
  version: number;
  generatedAt: string | null;
  sourceRoot: string;
  importer: string;
  assets: SystemThemeManifestAsset[];
  candidates: SystemThemeManifestAsset[];
  warnings: string[];
};

export type ThemeSoundId =
  | "system-click"
  | "system-key"
  | "system-alert"
  | "reward-open"
  | "gate-open"
  | "training-start"
  | "game-fail";

export type { ThemeMusicContext, ThemeMusicId };

const DEFAULT_MANIFEST: SystemThemeManifest = {
  version: 1,
  generatedAt: null,
  sourceRoot: "",
  importer: "fallback",
  assets: [],
  candidates: [],
  warnings: [],
};

const audioModules = typeof import.meta.glob === "function"
  ? import.meta.glob("../assets/sololv/audio/*.{mp3,ogg,wav,m4a}", {
      eager: true,
      import: "default",
      query: "?url",
    }) as Record<string, string>
  : {};

const SOUND_FILE_CANDIDATES: Record<ThemeSoundId, string[]> = {
  "system-click": ["system-click", "ui-click", "button-click", "click"],
  "system-key": ["system-key", "ui-key", "keyboard", "typing"],
  "system-alert": ["system-alert", "warning", "alert", "system-warning"],
  "reward-open": ["reward-open", "reward", "loot", "result"],
  "gate-open": ["gate-open", "portal", "gate", "system-open"],
  "training-start": ["training-start", "start-training", "quest-start"],
  "game-fail": ["game-fail", "fail", "damage", "miss"],
};

let manifestCache: SystemThemeManifest | null = null;

export function normalizeSystemThemeManifest(input: Partial<SystemThemeManifest> | null | undefined): SystemThemeManifest {
  return {
    ...DEFAULT_MANIFEST,
    ...(input || {}),
    version: Number(input?.version || DEFAULT_MANIFEST.version),
    assets: Array.isArray(input?.assets) ? input.assets.map(normalizeManifestAsset) : [],
    candidates: Array.isArray(input?.candidates) ? input.candidates.map(normalizeManifestAsset) : [],
    warnings: Array.isArray(input?.warnings) ? input.warnings.filter(Boolean) : [],
  };
}

export async function loadSystemThemeManifest(): Promise<SystemThemeManifest> {
  if (manifestCache) return manifestCache;

  try {
    const response = await fetch(manifestUrl, { cache: "no-cache" });
    if (!response.ok) throw new Error(`Manifest HTTP ${response.status}`);
    manifestCache = normalizeSystemThemeManifest(await response.json());
  } catch {
    manifestCache = {
      ...DEFAULT_MANIFEST,
      warnings: ["Nie udało się wczytać manifestu motywu. Aplikacja używa fallbacku."],
    };
  }

  return manifestCache;
}

export function getThemeAudioUrl(soundId: ThemeSoundId): string | null {
  const candidates = SOUND_FILE_CANDIDATES[soundId];
  const entries = Object.entries(audioModules);

  for (const candidate of candidates) {
    const match = entries.find(([path]) => getBaseName(path) === candidate);
    if (match) return match[1];
  }

  return null;
}

export function getThemeMusicUrl(context: ThemeMusicContext, shuffle = false): string | null {
  return getThemeMusicUrlWithSelection(context, shuffle, "auto");
}

export function getThemeMusicUrlWithSelection(
  context: ThemeMusicContext,
  shuffle = false,
  selectedTrackId: "auto" | string = "auto"
): string | null {
  const normalizedContext = normalizeMusicContext(context);
  const selection = normalizeMusicTrackSelection(selectedTrackId);

  if (selection !== "auto") {
    const explicitUrl = getLocalTrackUrl(selection);
    if (explicitUrl) return explicitUrl;
  }

  if (shuffle) {
    const contextualTracks = LOCAL_MUSIC_TRACKS.filter((track) => track.contexts.includes(normalizedContext));
    if (contextualTracks.length > 1) {
      const picked = contextualTracks[Math.floor(Math.random() * contextualTracks.length)];
      const pickedUrl = getLocalTrackUrl(picked.id);
      if (pickedUrl) return pickedUrl;
    }
  }

  const defaultUrl = getLocalTrackUrl(DEFAULT_MUSIC_BY_CONTEXT[normalizedContext]);
  return defaultUrl ?? pickMusicUrl(LOCAL_MUSIC_TRACKS.map((track) => [track.fileName, track.url]), context, shuffle);
}

export function getBundledThemeAudioCount() {
  return Object.keys(audioModules).length;
}

export function getBundledThemeMusicCount() {
  return LOCAL_MUSIC_TRACKS.filter((track) => Boolean(track.url)).length;
}

export function getLocalMusicTracks() {
  return LOCAL_MUSIC_TRACKS;
}

export function summarizeThemeManifest(manifest: SystemThemeManifest) {
  const imported = manifest.assets.filter((asset) => asset.status === "imported");
  const candidates = manifest.candidates.filter((asset) => asset.status === "candidate");
  return {
    imported: imported.length,
    audio: imported.filter((asset) => asset.kind === "audio").length,
    music: imported.filter((asset) => asset.kind === "music").length,
    effects: imported.filter((asset) => asset.kind === "effect").length,
    ui: imported.filter((asset) => asset.kind === "ui").length,
    candidates: candidates.length,
    candidateAudio: candidates.filter((asset) => asset.kind === "audio").length,
    candidateMusic: candidates.filter((asset) => asset.kind === "music").length,
    candidateEffects: candidates.filter((asset) => asset.kind === "effect").length,
    candidateUi: candidates.filter((asset) => asset.kind === "ui").length,
    warnings: manifest.warnings.length,
  };
}

function normalizeManifestAsset(asset: Partial<SystemThemeManifestAsset>): SystemThemeManifestAsset {
  return {
    id: String(asset.id || asset.fileName || "unknown"),
    kind: normalizeAssetKind(asset.kind),
    fileName: String(asset.fileName || ""),
    sourcePath: asset.sourcePath ? String(asset.sourcePath) : undefined,
    sizeBytes: Number.isFinite(Number(asset.sizeBytes)) ? Number(asset.sizeBytes) : undefined,
    status: normalizeAssetStatus(asset.status),
  };
}

function normalizeAssetKind(kind: unknown): SystemThemeAssetKind {
  return kind === "audio" || kind === "music" || kind === "effect" || kind === "ui" ? kind : "unknown";
}

function normalizeAssetStatus(status: unknown): SystemThemeManifestAsset["status"] {
  return status === "imported" || status === "candidate" || status === "skipped" || status === "missing"
    ? status
    : "missing";
}

function getBaseName(path: string) {
  const file = path.split(/[\\/]/).pop() || path;
  return file.replace(/\.(mp3|ogg|wav|m4a|aac)$/i, "").toLowerCase();
}

function getLocalTrackUrl(trackId: LocalMusicTrackId) {
  if (!isLocalMusicTrackId(trackId)) return null;
  const track = getLocalMusicTrack(trackId);
  return track.url || null;
}
