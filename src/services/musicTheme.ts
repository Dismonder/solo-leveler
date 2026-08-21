export type ThemeMusicId =
  | "status"
  | "training"
  | "workout-session"
  | "gate-dodge"
  | "shadow-strike"
  | "mana-memory"
  | "rune-lock"
  | "shadow-extraction"
  | "idle-rpg"
  | "reward"
  | "penalty";

export type ThemeMusicContext = ThemeMusicId | "bonus";

export const MUSIC_FILE_CANDIDATES: Record<ThemeMusicId, string[]> = {
  status: ["status", "dark-ambient", "ambient", "lobby", "main", "system-lobby", "hunter-lobby", "bgm-lobby"],
  training: ["training", "status-dark-ambient", "dark-ambient", "ambient", "daily", "quest", "system-training", "bgm-training"],
  "workout-session": ["workout-session", "status-dark-ambient", "dark-ambient", "ambient", "workout", "training-loop", "quest-battle", "bgm-training"],
  "gate-dodge": ["gate-dodge", "heavy-battle", "battle", "gate", "portal", "dungeon-gate", "bgm-gate"],
  "shadow-strike": ["shadow-strike", "heavy-battle", "battle", "boss", "dungeon-battle", "bgm-battle"],
  "mana-memory": ["mana-memory", "status-dark-ambient", "dark-ambient", "ambient", "rune", "system", "mystery", "bgm-system"],
  "rune-lock": ["rune-lock", "heavy-battle", "battle", "lock", "rune", "puzzle", "bgm-system"],
  "shadow-extraction": ["shadow-extraction", "heavy-battle", "battle", "shadow", "assassin", "extraction", "bgm-shadow"],
  "idle-rpg": ["shadowborn", "idle-rpg", "heavy-battle", "battle", "abyss", "bgm-shadow"],
  reward: ["reward", "status-dark-ambient", "dark-ambient", "ambient", "result", "clear", "victory", "bgm-result"],
  penalty: ["penalty", "shadow-extraction", "heavy-battle", "battle", "danger", "warning", "redgate", "bgm-danger"],
};

export function normalizeMusicContext(context: ThemeMusicContext): ThemeMusicId {
  return context === "bonus" ? "gate-dodge" : context;
}

export function getMusicCandidatesForContext(context: ThemeMusicContext) {
  return MUSIC_FILE_CANDIDATES[normalizeMusicContext(context)];
}

export function pickMusicUrl(
  entries: Array<[string, string]>,
  context: ThemeMusicContext,
  shuffle = false,
  random: () => number = Math.random
) {
  const candidates = getMusicCandidatesForContext(context);

  for (const candidate of candidates) {
    const matches = entries.filter(([path]) => getBaseName(path).includes(candidate));
    if (matches.length === 0) continue;
    if (!shuffle || matches.length === 1) return matches[0][1];
    return matches[Math.floor(random() * matches.length)]?.[1] ?? matches[0][1];
  }

  return null;
}

function getBaseName(path: string) {
  const file = path.split(/[\\/]/).pop() || path;
  return file.replace(/\.(mp3|ogg|wav|m4a|aac)$/i, "").toLowerCase();
}
