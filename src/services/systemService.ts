import rankA from "../assets/avatars/Ranga_A_Eryk.webp";
import rankB from "../assets/avatars/Ranga_B_Eryk.webp";
import rankC from "../assets/avatars/Ranga_C_Eryk.webp";
import rankD from "../assets/avatars/Ranga_D_Eryk.webp";
import rankE from "../assets/avatars/Ranga_E_Eryk.webp";
import rankS from "../assets/avatars/Ranga_S_Eryk.webp";
import rankSS from "../assets/avatars/Ranga_SS_Eryk.webp";
import {
  AwakeningStats,
  awakenPlayerLocally,
  getErykAvatarAssetKey,
  getRankForLevel,
  isErykLikeName,
  RankLetter,
} from "./systemLogic";

const ERYK_AVATARS: Record<string, string> = {
  "Ranga_E_Eryk.png": rankE,
  "Ranga_D_Eryk.png": rankD,
  "Ranga_C_Eryk.png": rankC,
  "Ranga_B_Eryk.png": rankB,
  "Ranga_A_Eryk.png": rankA,
  "Ranga_S_Eryk.png": rankS,
  "Ranga_SS_Eryk.png": rankSS,
};

function escapeSvgText(value: string) {
  return value.replace(/[&<>"']/g, (char) => {
    const entities: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      "\"": "&quot;",
      "'": "&apos;",
    };
    return entities[char] || char;
  });
}

function createLocalAvatar(name: string, jobClass: string, rank: RankLetter, seed = "system") {
  const initials = escapeSvgText(
    (name || "Hunter")
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() || "")
      .join("") || "?"
  );
  const hash = Math.abs(`${name}-${jobClass}-${rank}-${seed}`.split("").reduce((acc, char) => ((acc << 5) - acc + char.charCodeAt(0)) | 0, 0));
  const hue = 190 + (hash % 55);
  const accent = `hsl(${hue} 95% 62%)`;
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256">
      <defs>
        <radialGradient id="core" cx="50%" cy="42%" r="70%">
          <stop offset="0%" stop-color="${accent}" stop-opacity="0.42"/>
          <stop offset="58%" stop-color="#101827"/>
          <stop offset="100%" stop-color="#020617"/>
        </radialGradient>
        <filter id="glow"><feGaussianBlur stdDeviation="4" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
      </defs>
      <rect width="256" height="256" fill="#020617"/>
      <circle cx="128" cy="128" r="118" fill="url(#core)" stroke="${accent}" stroke-opacity="0.4" stroke-width="2"/>
      <path d="M48 174 L128 32 L208 174 L176 174 L128 84 L80 174 Z" fill="none" stroke="${accent}" stroke-width="5" stroke-linejoin="round" filter="url(#glow)" opacity="0.75"/>
      <circle cx="128" cy="134" r="48" fill="#020617" stroke="#e0f2fe" stroke-opacity="0.45" stroke-width="2"/>
      <text x="128" y="148" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="38" font-weight="900" fill="#f8fafc" letter-spacing="3">${initials}</text>
      <text x="128" y="214" text-anchor="middle" font-family="monospace" font-size="18" font-weight="800" fill="${accent}">${rank}-RANK</text>
    </svg>`;

  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

export function getAvatarForPlayer(
  name: string,
  level: number,
  jobClass = "Hunter",
  stats?: AwakeningStats
) {
  const eyrkAssetKey = getErykAvatarAssetKey(name, level);
  if (eyrkAssetKey) return ERYK_AVATARS[eyrkAssetKey] || rankE;

  const statSeed = stats ? `${stats.STR}-${stats.VITALITY}-${stats.AGILITY}-${stats.INTELLIGENCE}-${stats.SENSE}` : "base";
  return createLocalAvatar(name, jobClass, getRankForLevel(level), statSeed);
}

export async function awakenPlayerAnswers(playerName: string, jobClass: string, statsPreference: AwakeningStats) {
  const result = awakenPlayerLocally(playerName, jobClass, statsPreference);
  return {
    assessment: result.assessment,
    avatarUrl: getAvatarForPlayer(playerName, 1, result.assessment.jobClass, statsPreference),
  };
}

export { getRankForLevel, isErykLikeName };
