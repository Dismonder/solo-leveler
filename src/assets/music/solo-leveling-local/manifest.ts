import type { ThemeMusicId } from "../../../services/musicTheme";
import type { MiniGameId } from "../../../game/miniGameProgress";

const adkinsjuneSoloLevelingUrl = new URL("./adkinsjune-solo-leveling.mp3", import.meta.url).href;
const rapDeSoloLevelingUrl = new URL("./rap-de-solo-leveling.mp3", import.meta.url).href;
const darkAriaUrl = new URL("./dark-aria.mp3", import.meta.url).href;
const symphonicSuiteLv1Url = new URL("./symphonic-suite-lv1.mp3", import.meta.url).href;
const symphonicSuiteLv8Url = new URL("./symphonic-suite-lv8.mp3", import.meta.url).href;
const shadowbornUrl = new URL("./shadowborn.mp3", import.meta.url).href;
const sungJinwooAriseUrl = new URL("./sung-jinwoo-arise.mp3", import.meta.url).href;
const reawekerUrl = new URL("./reaweker.mp3", import.meta.url).href;
const hunterOfHuntersUrl = new URL("./hunter-of-hunters.mp3", import.meta.url).href;
const praiseOfGodUrl = new URL("./praise-of-god.mp3", import.meta.url).href;

export type LocalMusicTrackId =
  | "adkinsjune-solo-leveling"
  | "rap-de-solo-leveling"
  | "dark-aria"
  | "symphonic-suite-lv1"
  | "symphonic-suite-lv8"
  | "shadowborn"
  | "sung-jinwoo-arise"
  | "reaweker"
  | "hunter-of-hunters"
  | "praise-of-god";

export type MusicTrackSelection = "auto" | LocalMusicTrackId;

export type LocalMusicTrack = {
  id: LocalMusicTrackId;
  title: string;
  artist: string;
  fileName: string;
  url: string;
  contexts: ThemeMusicId[];
  mood: string;
};

export const LOCAL_MUSIC_TRACKS: LocalMusicTrack[] = [
  {
    id: "symphonic-suite-lv1",
    title: "Symphonic Suite Lv.1",
    artist: "Hiroyuki SAWANO",
    fileName: "symphonic-suite-lv1.mp3",
    url: symphonicSuiteLv1Url,
    contexts: ["status"],
    mood: "system",
  },
  {
    id: "reaweker",
    title: "Reaweker",
    artist: "Solo Leveling OP",
    fileName: "reaweker.mp3",
    url: reawekerUrl,
    contexts: ["training", "workout-session"],
    mood: "training",
  },
  {
    id: "hunter-of-hunters",
    title: "Hunter of Hunters",
    artist: "Solo Leveling OST",
    fileName: "hunter-of-hunters.mp3",
    url: hunterOfHuntersUrl,
    contexts: ["gate-dodge"],
    mood: "reflex",
  },
  {
    id: "shadowborn",
    title: "SHADOWBORN",
    artist: "Hiroyuki SAWANO / Benjamin / mpi",
    fileName: "shadowborn.mp3",
    url: shadowbornUrl,
    contexts: ["shadow-extraction"],
    mood: "shadow",
  },
  {
    id: "symphonic-suite-lv8",
    title: "Symphonic Suite Lv.8",
    artist: "Hiroyuki SAWANO / Hannah Grace",
    fileName: "symphonic-suite-lv8.mp3",
    url: symphonicSuiteLv8Url,
    contexts: ["shadow-strike"],
    mood: "combat",
  },
  {
    id: "dark-aria",
    title: "Dark Aria",
    artist: "Diego Mitre",
    fileName: "dark-aria.mp3",
    url: darkAriaUrl,
    contexts: ["mana-memory", "rune-lock"],
    mood: "arcane",
  },
  {
    id: "praise-of-god",
    title: "Praise of God",
    artist: "Epic Orchestral Cover",
    fileName: "praise-of-god.mp3",
    url: praiseOfGodUrl,
    contexts: ["reward"],
    mood: "reward",
  },
  {
    id: "sung-jinwoo-arise",
    title: "Sung Jin-Woo Song: Arise",
    artist: "Oricadia",
    fileName: "sung-jinwoo-arise.mp3",
    url: sungJinwooAriseUrl,
    contexts: ["penalty"],
    mood: "penalty",
  },
  {
    id: "adkinsjune-solo-leveling",
    title: "Solo Leveling",
    artist: "AdkinsJune",
    fileName: "adkinsjune-solo-leveling.mp3",
    url: adkinsjuneSoloLevelingUrl,
    contexts: ["status", "training"],
    mood: "alternate",
  },
  {
    id: "rap-de-solo-leveling",
    title: "Rap de Solo Leveling",
    artist: "Ashler Mc feat. Neoxer Nahue R",
    fileName: "rap-de-solo-leveling.mp3",
    url: rapDeSoloLevelingUrl,
    contexts: ["status", "training"],
    mood: "alternate",
  },
];

export const DEFAULT_MUSIC_BY_CONTEXT: Record<ThemeMusicId, LocalMusicTrackId> = {
  status: "symphonic-suite-lv1",
  training: "reaweker",
  "workout-session": "reaweker",
  "gate-dodge": "hunter-of-hunters",
  "shadow-strike": "symphonic-suite-lv8",
  "mana-memory": "dark-aria",
  "rune-lock": "dark-aria",
  "shadow-extraction": "shadowborn",
  reward: "praise-of-god",
  penalty: "sung-jinwoo-arise",
};

export const DEFAULT_MINI_GAME_MUSIC: Record<MiniGameId, LocalMusicTrackId> = {
  "gate-dodge": "hunter-of-hunters",
  "shadow-strike": "symphonic-suite-lv8",
  "mana-memory": "dark-aria",
  "rune-lock": "dark-aria",
  "shadow-extraction": "shadowborn",
};

export function isLocalMusicTrackId(value: unknown): value is LocalMusicTrackId {
  return typeof value === "string" && LOCAL_MUSIC_TRACKS.some((track) => track.id === value);
}

export function normalizeMusicTrackSelection(value: unknown): MusicTrackSelection {
  return value === "auto" || isLocalMusicTrackId(value) ? value : "auto";
}

export function getLocalMusicTrack(trackId: LocalMusicTrackId) {
  return LOCAL_MUSIC_TRACKS.find((track) => track.id === trackId) ?? LOCAL_MUSIC_TRACKS[0];
}
