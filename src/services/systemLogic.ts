export type RankLetter = "E" | "D" | "C" | "B" | "A" | "S" | "SS";

export type AwakeningStats = {
  STR: number;
  VITALITY: number;
  AGILITY: number;
  INTELLIGENCE: number;
  SENSE: number;
};

export type AwakeningAssessment = {
  jobClass: string;
  rank: `${RankLetter}-Rank`;
  systemMessage: string;
};

export function getRankForLevel(level: number): RankLetter {
  if (level >= 70) return "SS";
  if (level >= 50) return "S";
  if (level >= 35) return "A";
  if (level >= 20) return "B";
  if (level >= 10) return "C";
  if (level >= 5) return "D";
  return "E";
}

const RANK_THRESHOLDS: Array<{ rank: RankLetter; minLevel: number }> = [
  { rank: "E", minLevel: 1 },
  { rank: "D", minLevel: 5 },
  { rank: "C", minLevel: 10 },
  { rank: "B", minLevel: 20 },
  { rank: "A", minLevel: 35 },
  { rank: "S", minLevel: 50 },
  { rank: "SS", minLevel: 70 },
];

export function getRankProgressForLevel(level: number) {
  const normalizedLevel = Math.max(1, Math.floor(level));
  const rank = getRankForLevel(normalizedLevel);
  const currentIndex = RANK_THRESHOLDS.findIndex((entry) => entry.rank === rank);
  const current = RANK_THRESHOLDS[currentIndex] ?? RANK_THRESHOLDS[0];
  const next = RANK_THRESHOLDS[currentIndex + 1] ?? null;

  if (!next) {
    return {
      rank,
      currentLevel: current.minLevel,
      nextLevel: null,
      progress: 100,
    };
  }

  const span = next.minLevel - current.minLevel;
  const progress = ((normalizedLevel - current.minLevel) / span) * 100;

  return {
    rank,
    currentLevel: current.minLevel,
    nextLevel: next.minLevel,
    progress: Math.max(0, Math.min(100, progress)),
  };
}

function normalizeName(name: string) {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

function levenshteinDistance(a: string, b: string) {
  const rows = a.length + 1;
  const cols = b.length + 1;
  const dp = Array.from({ length: rows }, () => Array<number>(cols).fill(0));

  for (let i = 0; i < rows; i += 1) dp[i][0] = i;
  for (let j = 0; j < cols; j += 1) dp[0][j] = j;

  for (let i = 1; i < rows; i += 1) {
    for (let j = 1; j < cols; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + cost
      );
    }
  }

  return dp[a.length][b.length];
}

export function isErykLikeName(name: string) {
  const normalized = normalizeName(name);
  if (!normalized) return false;

  const directMatches = ["eryk", "erykson", "eris", "erys", "erik", "erick", "eryx", "eric"];
  if (directMatches.some((candidate) => normalized.startsWith(candidate))) return true;

  return ["eryk", "eris", "erik", "erys"].some((candidate) => levenshteinDistance(normalized, candidate) <= 1);
}

export function getErykAvatarAssetKey(name: string, level: number) {
  if (!isErykLikeName(name)) return null;
  return `Ranga_${getRankForLevel(level)}_Eryk.png`;
}

function getDominantStat(stats: AwakeningStats) {
  return (Object.entries(stats) as Array<[keyof AwakeningStats, number]>).reduce(
    (best, current) => (current[1] > best[1] ? current : best),
    ["STR", stats.STR]
  )[0];
}

const classByPreference: Record<string, Partial<Record<keyof AwakeningStats, string>>> = {
  Wojownik: {
    STR: "Cienisty Wojownik",
    VITALITY: "Żelazny Strażnik Bram",
    SENSE: "Łowca Szczelin",
  },
  "Zabójca": {
    AGILITY: "Cienisty Zabójca",
    SENSE: "Widmowy Tropiciel",
    STR: "Egzekutor Cieni",
  },
  Mag: {
    INTELLIGENCE: "Cienisty Arkanista",
    SENSE: "Runiczny Mag Bram",
    VITALITY: "Strażnik Many",
  },
  Tank: {
    VITALITY: "Bastion Bram",
    STR: "Ciężki Łamacz",
    SENSE: "Wartownik Systemu",
  },
  "Łucznik": {
    SENSE: "Strzelec Szczelin",
    AGILITY: "Szybki Łowca",
    INTELLIGENCE: "Taktyk Bram",
  },
  Support: {
    INTELLIGENCE: "Operator Systemu",
    VITALITY: "Protektor Drużyny",
    SENSE: "Skaner Cieni",
  },
};

export function awakenPlayerLocally(playerName: string, jobClass: string, stats: AwakeningStats) {
  const dominantStat = getDominantStat(stats);
  const mappedClass = classByPreference[jobClass]?.[dominantStat] || `Cienisty ${jobClass || "Łowca"}`;
  const avatarKey = getErykAvatarAssetKey(playerName, 1);

  return {
    assessment: {
      jobClass: mappedClass,
      rank: "E-Rank" as const,
      systemMessage: `Przebudzenie zakończone. ${playerName || "Łowco"}, System zaakceptował twoje naczynie. Ranga początkowa: E.`,
    },
    avatarKey,
  };
}
