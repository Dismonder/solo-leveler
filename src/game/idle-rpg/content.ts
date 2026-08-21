import type {
  EncounterLocation,
  EnemyKind,
  RealmDefinition,
  SkillDefinition,
  StageDefinition,
  SummonDefinition,
} from "./types";

export const CAMPAIGN_STAGE_COUNT = 48 as const;
export const STAGES_PER_REALM = 12 as const;
export const ABYSS_WAVES_PER_DEPTH = 10 as const;

export const REALMS: readonly RealmDefinition[] = [
  {
    id: "ashen-bulwark",
    index: 0,
    name: "Popielne Przedmurze",
    stageFrom: 1,
    stageTo: 12,
    palette: ["#170f16", "#4b2020", "#b54d2e", "#f0ad5c"],
    normalEnemies: ["Skorupnik Żużlowy", "Popielny Pikinier", "Dymny Sęp"],
    elite: "Dozorca Kuźni",
    boss: "Raghor, Rogacz Pieca",
  },
  {
    id: "drowned-archive",
    index: 1,
    name: "Utopione Archiwum",
    stageFrom: 13,
    stageTo: 24,
    palette: ["#071720", "#123847", "#217a78", "#7ad4b7"],
    normalEnemies: ["Topielec z Latarnią", "Solny Krabiarz", "Atramentowa Wstęga"],
    elite: "Dzwonnik Głębin",
    boss: "Ossyra, Królowa Zatopu",
  },
  {
    id: "thorn-sky",
    index: 2,
    name: "Cierniowe Niebo",
    stageFrom: 25,
    stageTo: 36,
    palette: ["#11152c", "#303260", "#7b4ca1", "#e8a8ff"],
    normalEnemies: ["Cierniowy Skoczek", "Akolita Burzy", "Szklany Gryf"],
    elite: "Strażnik Iglicy",
    boss: "Veyra, Tkaczka Burz",
  },
  {
    id: "duskless-crown",
    index: 3,
    name: "Korona Bezświtu",
    stageFrom: 37,
    stageTo: 48,
    palette: ["#080914", "#21162c", "#5f2c63", "#d45a82"],
    normalEnemies: ["Lustrzany Ogar", "Mnich Bez Twarzy", "Żniwiarz Godzin"],
    elite: "Herold Zaćmienia",
    boss: "Aevor, Ostatnia Korona",
  },
] as const;

export const SKILLS: readonly SkillDefinition[] = [
  {
    id: "meridian-rend",
    name: "Rozszczep Południka",
    description: "Potężne cięcie runicznym ostrzem.",
    unlockStage: 1,
    manaCost: 16,
    cooldownMs: 4_000,
    multiplier: 2.2,
  },
  {
    id: "seam-step",
    name: "Skok przez Szew",
    description: "Atak i krótki unik przed kolejnym ciosem.",
    unlockStage: 4,
    manaCost: 12,
    cooldownMs: 6_000,
    multiplier: 1.35,
  },
  {
    id: "shard-rain",
    name: "Deszcz Odłamków",
    description: "Seria cięć trafiająca jednego przeciwnika.",
    unlockStage: 10,
    manaCost: 28,
    cooldownMs: 8_000,
    multiplier: 3.6,
  },
  {
    id: "echo-call",
    name: "Zew Ech",
    description: "Wszystkie aktywne echa natychmiast atakują.",
    unlockStage: 18,
    manaCost: 34,
    cooldownMs: 12_000,
    multiplier: 0.5,
  },
  {
    id: "last-meridian",
    name: "Ostatni Południk",
    description: "Finisher, który ogłusza ocalałego wroga.",
    unlockStage: 30,
    manaCost: 60,
    cooldownMs: 20_000,
    multiplier: 6.5,
    isUltimate: true,
  },
] as const;

export const SUMMONS: readonly SummonDefinition[] = [
  { id: "meridian-fang", name: "Kieł Południka", unlockStage: 1, baseAttack: 7, attackIntervalMs: 1_450 },
  { id: "ember-bastion", name: "Bastion Żaru", unlockStage: 12, baseAttack: 12, attackIntervalMs: 1_900 },
  { id: "ink-mora", name: "Mora Atramentu", unlockStage: 24, baseAttack: 17, attackIntervalMs: 1_600 },
  { id: "storm-spire", name: "Iglica Burzy", unlockStage: 36, baseAttack: 23, attackIntervalMs: 1_250 },
  { id: "dusk-aureole", name: "Aureol Bezświtu", unlockStage: 48, baseAttack: 31, attackIntervalMs: 1_750 },
] as const;

function asRealmIndex(value: number): 0 | 1 | 2 | 3 {
  return Math.max(0, Math.min(3, value)) as 0 | 1 | 2 | 3;
}

export function getRealmForStage(stage: number): RealmDefinition {
  const safeStage = Math.max(1, Math.min(CAMPAIGN_STAGE_COUNT, Math.floor(stage)));
  return REALMS[asRealmIndex(Math.floor((safeStage - 1) / STAGES_PER_REALM))];
}

export function getStageDefinition(stage: number): StageDefinition {
  const safeStage = Math.max(1, Math.min(CAMPAIGN_STAGE_COUNT, Math.floor(stage)));
  const realm = getRealmForStage(safeStage);
  const realmStage = ((safeStage - 1) % STAGES_PER_REALM) + 1;
  const kind: EnemyKind = realmStage === 12 ? "boss" : realmStage === 6 ? "elite" : "normal";
  const enemyName = kind === "boss"
    ? realm.boss
    : kind === "elite"
      ? realm.elite
      : realm.normalEnemies[(realmStage - 1) % realm.normalEnemies.length];
  return {
    stage: safeStage,
    realmIndex: realm.index,
    realmStage,
    enemyId: `${realm.id}-${kind}-${kind === "normal" ? (realmStage - 1) % 3 : realmStage}`,
    enemyName,
    kind,
    hasChest: realmStage === 3 || realmStage === 9,
  };
}

export function getCampaignStages(): readonly StageDefinition[] {
  return Array.from({ length: CAMPAIGN_STAGE_COUNT }, (_, index) => getStageDefinition(index + 1));
}

export function getAbyssEnemy(depth: number, wave: number): { id: string; name: string; kind: EnemyKind } {
  const safeDepth = Math.max(1, Math.floor(depth));
  const safeWave = Math.max(1, Math.min(ABYSS_WAVES_PER_DEPTH, Math.floor(wave)));
  if (safeWave === 10) return { id: `abyss-${safeDepth}-crown`, name: `Korona Głębi ${safeDepth}`, kind: "boss" };
  if (safeWave === 5) return { id: `abyss-${safeDepth}-warden`, name: `Strażnik Głębi ${safeDepth}`, kind: "elite" };
  const names = ["Echo Rozdarcia", "Ogar Pustki", "Wędrowny Odłamek"] as const;
  return { id: `abyss-${safeDepth}-echo-${(safeWave - 1) % 3}`, name: names[(safeWave - 1) % 3], kind: "normal" };
}

export function getLocationLabel(location: EncounterLocation): string {
  return location.kind === "campaign"
    ? `${getRealmForStage(location.stage).name} ${getStageDefinition(location.stage).realmStage}/12`
    : `Wieczna Otchłań ${location.depth}-${location.wave}`;
}
