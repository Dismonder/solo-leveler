import type { PlayerState } from "../types";

export type SkillId =
  | "sprint"
  | "vital_strike"
  | "stealth"
  | "bloodlust"
  | "shadow_strike"
  | "ruler_hand";

export type SkillDefinition = {
  id: SkillId;
  name: string;
  description: string;
  requiredLevel: number;
  reqStat: keyof PlayerState["stats"];
  reqAmount: number;
  active: boolean;
};

export const AVAILABLE_SKILLS: SkillDefinition[] = [
  { id: "sprint", name: "Zryw", description: "Zwiększa szansę na unik i wzmacnia dash w mini-grach.", requiredLevel: 2, reqStat: "AGILITY", reqAmount: 15, active: true },
  { id: "vital_strike", name: "Zabójczy Cios", description: "Odblokowuje Przełamanie i wzmacnia trafienia krytyczne.", requiredLevel: 5, reqStat: "STR", reqAmount: 20, active: true },
  { id: "stealth", name: "Ukrycie", description: "Gwarantuje unik w pierwszej turze i daje startową osłonę w symulacjach.", requiredLevel: 10, reqStat: "SENSE", reqAmount: 25, active: true },
  { id: "bloodlust", name: "Żądza Krwi", description: "Krytyczne ciosy ignorują większość pancerza wroga.", requiredLevel: 15, reqStat: "STR", reqAmount: 35, active: true },
  { id: "shadow_strike", name: "Shadow Strike", description: "Odblokowuje Cios Cienia i finisher cienia.", requiredLevel: 5, reqStat: "STR", reqAmount: 15, active: true },
  { id: "ruler_hand", name: "Ręka Władcy", description: "Odblokowuje telekinetyczny atak skalowany inteligencją.", requiredLevel: 20, reqStat: "INTELLIGENCE", reqAmount: 30, active: true },
];

export const COMBAT_ACTION_SKILL_REQUIREMENTS: Partial<Record<string, SkillId>> = {
  shadow: "shadow_strike",
  break: "vital_strike",
  ruler: "ruler_hand",
};

export function hasSkill(skills: readonly string[] | undefined, skillId: SkillId) {
  return Boolean(skills?.includes(skillId));
}

export function getSkillName(skillId: SkillId) {
  return AVAILABLE_SKILLS.find((skill) => skill.id === skillId)?.name ?? skillId;
}

export function getMissingCombatSkill(action: string, skills: readonly string[] | undefined) {
  const required = COMBAT_ACTION_SKILL_REQUIREMENTS[action];
  if (!required || hasSkill(skills, required)) return null;
  return required;
}

export function getCombatDodgeChance({
  stats,
  unlockedSkills,
  turn,
  guarded,
  intent,
}: {
  stats: PlayerState["stats"];
  unlockedSkills: readonly string[];
  turn: number;
  guarded: boolean;
  intent: "strike" | "rush" | "hex" | "crush";
}) {
  if (turn === 1 && hasSkill(unlockedSkills, "stealth")) return 100;
  const sprintBonus = hasSkill(unlockedSkills, "sprint") ? 14 : 0;
  const guardedBonus = guarded ? 8 : 0;
  const intentPenalty = intent === "crush" ? 9 : intent === "rush" ? 5 : intent === "hex" ? 2 : 0;
  return Math.max(0, Math.min(42, 5 + stats.AGILITY * 0.42 + stats.SENSE * 0.16 + sprintBonus + guardedBonus - intentPenalty));
}

export function getMiniGameSkillModifiers(skills: readonly string[] | undefined) {
  return {
    hasSprint: hasSkill(skills, "sprint"),
    hasStealth: hasSkill(skills, "stealth"),
    hasShadowStrike: hasSkill(skills, "shadow_strike"),
    hasVitalStrike: hasSkill(skills, "vital_strike"),
    hasBloodlust: hasSkill(skills, "bloodlust"),
    hasRulerHand: hasSkill(skills, "ruler_hand"),
  };
}
