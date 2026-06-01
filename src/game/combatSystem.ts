import { PlayerState } from "../types";
import { spriteEventDuration, spriteEventLock, spriteHitDelay } from "./actionAnimation";
import { AnimationEvent, createAnimationEvent } from "./animationSystem";
import { getCombatDodgeChance, getMissingCombatSkill, getSkillName, hasSkill } from "./skillSystem";
import type { SpriteActorAnimation, SpriteActorKind } from "./spriteAnimation";

export type CombatElement =
  | "goblin"
  | "wolf"
  | "mage"
  | "boss"
  | "assassin"
  | "golem"
  | "wraith"
  | "knight"
  | "spider"
  | "goblin_archer"
  | "goblin_assassin"
  | "young_spider"
  | "young_wolf"
  | "slime_cursed"
  | "skeleton_shield";
export type CombatIntent = "strike" | "rush" | "hex" | "crush";
export type CombatAction = "basic" | "shadow" | "guard" | "break" | "analyze" | "ruler";
export type CombatPhase = "playerSelect" | "windup" | "resolvePlayer" | "enemyTelegraph" | "resolveEnemy" | "rewards";

export type CombatMonster = {
  id: string;
  name: string;
  title: string;
  maxHp: number;
  hp: number;
  attack: number;
  defense: number;
  xpReward: number;
  goldReward: number;
  element: CombatElement;
};

export type CombatEncounterState = {
  phase: CombatPhase;
  monster: CombatMonster;
  playerHp: number;
  focus: number;
  shadowMark: number;
  armorBreak: number;
  turn: number;
  intent: CombatIntent;
};

export type CombatStats = PlayerState["stats"];

export type CombatResolution = {
  state: CombatEncounterState;
  logs: string[];
  events: AnimationEvent[];
  victory: boolean;
  defeat: boolean;
};

export function createCombatMonster(
  id: string,
  name: string,
  title: string,
  maxHp: number,
  attack: number,
  defense: number,
  xpReward: number,
  goldReward: number,
  element: CombatElement
): CombatMonster {
  return { id, name, title, maxHp, hp: maxHp, attack, defense, xpReward, goldReward, element };
}

export function pickCombatIntent(monster: CombatMonster, turn: number): CombatIntent {
  if ((monster.element === "boss" || monster.element === "golem" || monster.element === "knight" || monster.element === "spider" || monster.element === "young_spider" || monster.element === "skeleton_shield") && monster.hp / monster.maxHp < 0.48) return turn % 2 === 0 ? "crush" : "strike";
  if (monster.element === "mage" || monster.element === "wraith" || monster.element === "slime_cursed") return turn % 3 === 0 ? "hex" : "strike";
  if (monster.element === "wolf" || monster.element === "young_wolf" || monster.element === "assassin" || monster.element === "goblin_assassin") return turn % 2 === 0 ? "rush" : "strike";
  return turn % 4 === 0 ? "rush" : "strike";
}

export function getCombatIntentLabel(intent: CombatIntent) {
  return {
    strike: "Atak",
    rush: "Szarza",
    hex: "Klatwa",
    crush: "Miazdzenie",
  }[intent];
}

export function createCombatEncounter(monster: CombatMonster, playerHp: number): CombatEncounterState {
  const freshMonster = { ...monster, hp: monster.maxHp };
  return {
    phase: "playerSelect",
    monster: freshMonster,
    playerHp,
    focus: 18,
    shadowMark: 0,
    armorBreak: 0,
    turn: 1,
    intent: pickCombatIntent(freshMonster, 1),
  };
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function combatSpriteEvent(
  type: Parameters<typeof createAnimationEvent>[0],
  actor: Parameters<typeof createAnimationEvent>[1],
  startedAt: number,
  kind: SpriteActorKind,
  animation: SpriteActorAnimation,
  payload?: AnimationEvent["payload"]
) {
  return createAnimationEvent(type, actor, startedAt, {
    durationMs: spriteEventDuration(kind, animation),
    lockMs: spriteEventLock(kind, animation, type),
    payload,
  });
}

function getHunterActionAnimation(action: CombatAction, crit: boolean): SpriteActorAnimation {
  if (action === "ruler") return "cast";
  if (action === "shadow" || crit) return "attack_2";
  return "attack_1";
}

function getEnemyActionAnimation(intent: CombatIntent): SpriteActorAnimation {
  if (intent === "hex") return "cast";
  if (intent === "crush") return "attack_2";
  return "attack_1";
}

function enemyDamage(intent: CombatIntent, monster: CombatMonster, stats: CombatStats, guarded: boolean) {
  const intentMultiplier = intent === "crush" ? 1.65 : intent === "rush" ? 1.28 : intent === "hex" ? 0.78 : 1;
  const raw = Math.max(1, Math.floor(monster.attack * intentMultiplier) - Math.floor(stats.VITALITY * 0.65));
  const guardMultiplier = intent === "rush" ? 0.28 : 0.42;
  return guarded ? Math.max(1, Math.floor(raw * guardMultiplier)) : raw;
}

export function resolveCombatAction({
  state,
  action,
  stats,
  weaponBonus,
  now,
  random = Math.random,
  unlockedSkills,
  chargePercent = 0,
}: {
  state: CombatEncounterState;
  action: CombatAction;
  stats: CombatStats;
  weaponBonus: number;
  now: number;
  random?: () => number;
  unlockedSkills?: string[];
  chargePercent?: number;
}): CombatResolution {
  const logs: string[] = [];
  const events: AnimationEvent[] = [];
  let next: CombatEncounterState = { ...state, monster: { ...state.monster }, phase: "windup" };
  let guarded = false;
  let playerResolveAt = now + 520;
  const skills = unlockedSkills ?? [];
  const enforceSkillLocks = Array.isArray(unlockedSkills);
  const missingSkill = enforceSkillLocks ? getMissingCombatSkill(action, skills) : null;

  if (missingSkill) {
    return {
      state,
      logs: [`[SYSTEM] Nie odblokowano umiejetnosci: ${getSkillName(missingSkill)}.`],
      events: [],
      victory: false,
      defeat: false,
    };
  }

  if (action === "shadow" && next.focus < 30) {
    return {
      state,
      logs: ["Za malo focusu na Cios Cienia."],
      events: [],
      victory: false,
      defeat: false,
    };
  }

  if (action === "break" && next.focus < 55) {
    return {
      state,
      logs: ["Za malo focusu na Przelamanie."],
      events: [],
      victory: false,
      defeat: false,
    };
  }

  if (action === "ruler" && next.focus < 42) {
    return {
      state,
      logs: ["Za malo focusu na Reke Wladcy."],
      events: [],
      victory: false,
      defeat: false,
    };
  }

  if (action === "guard") {
    guarded = true;
    next.focus = clamp(next.focus + 18 + Math.floor(stats.VITALITY * 0.15), 0, 100);
    logs.push("Garda: redukujesz nastepny cios i odzyskujesz focus.");
    events.push(combatSpriteEvent("guard", "hunter", now, "hunter", "guard", { sprite: "guard" }));
    playerResolveAt = now + spriteEventDuration("hunter", "guard");
  } else if (action === "analyze") {
    guarded = true;
    const gainedFocus = 26 + Math.floor(stats.INTELLIGENCE * 0.18);
    next.focus = clamp(next.focus + gainedFocus, 0, 100);
    next.shadowMark = Math.max(next.shadowMark, 2);
    logs.push(`Analiza Systemu: +${gainedFocus} focusu, slaby punkt oznaczony.`);
    events.push(combatSpriteEvent("cast", "hunter", now, "hunter", "cast", { sprite: "cast" }));
    events.push(createAnimationEvent("phaseChange", "system", now + 120));
    playerResolveAt = now + spriteEventDuration("hunter", "cast");
  } else {
    const bleedDamage = next.armorBreak > 0 ? Math.max(4, Math.floor(stats.SENSE * 0.45 + next.armorBreak * 5)) : 0;
    if (bleedDamage > 0) {
      next.monster.hp = Math.max(0, next.monster.hp - bleedDamage);
      logs.push(`Rozpad pancerza: -${bleedDamage} HP.`);
    }

    const clampedCharge = action === "basic" ? clamp(chargePercent, 0, 100) : 0;
    const crit = random() * 100 < Math.min(35, 8 + stats.SENSE * 0.45 + (hasSkill(skills, "vital_strike") ? 4 : 0));
    const shadowBonus =
      action === "shadow"
        ? 1.72 + stats.INTELLIGENCE * 0.012
        : action === "break"
          ? 1.32 + (hasSkill(skills, "vital_strike") ? 0.22 : 0)
          : action === "ruler"
            ? 1.42 + stats.INTELLIGENCE * 0.016
            : 1;
    const markBonus = next.shadowMark > 0 ? 1.22 : 1;
    const chargedBonus = 1 + clampedCharge * 0.0065;
    const defense =
      action === "break"
        ? Math.floor(next.monster.defense * 0.28)
        : crit && hasSkill(skills, "bloodlust")
          ? Math.floor(next.monster.defense * 0.18)
          : next.monster.defense;
    const base = action === "ruler" ? stats.INTELLIGENCE * 2.15 + stats.SENSE * 0.7 : stats.STR * 1.9 + weaponBonus;
    const critBonus = crit ? (hasSkill(skills, "vital_strike") ? 1.95 : 1.65) : 1;
    const damage = Math.max(1, Math.floor(base * shadowBonus * markBonus * chargedBonus * critBonus - defense));

    next.monster.hp = Math.max(0, next.monster.hp - damage);
    const label = action === "shadow" ? "Cios Cienia" : action === "break" ? "Przelamanie" : action === "ruler" ? "Reka Wladcy" : clampedCharge >= 70 ? "Ladowany Atak" : "Atak";
    logs.push(`${label}${crit ? " [KRYTYK]" : ""}: -${damage} HP${next.shadowMark > 0 ? " (oznaczony)" : ""}${clampedCharge > 0 ? ` [charge ${Math.round(clampedCharge)}%]` : ""}.`);
    next.focus = clamp(next.focus + (action === "basic" ? 18 - Math.floor(clampedCharge * 0.08) : action === "break" ? -55 : action === "ruler" ? -42 : -30) + (crit ? 8 : 0), 0, 100);
    next.shadowMark = action === "shadow" ? 3 : Math.max(0, next.shadowMark - 1);
    next.armorBreak = action === "break" ? 3 : Math.max(0, next.armorBreak - 1);
    const hunterAnimation = getHunterActionAnimation(action, crit);
    const hunterEventType = action === "ruler" ? "cast" : crit ? "crit" : "attack";
    const windupDuration = clampedCharge >= 70 ? 300 : 210;
    const attackStart = now + windupDuration;
    const hitStart = attackStart + spriteHitDelay("hunter", hunterAnimation);
    const enemyKind = next.monster.element as SpriteActorKind;
    events.push(createAnimationEvent("windup", "hunter", now, { durationMs: windupDuration, lockMs: Math.min(220, windupDuration), payload: { action, charge: clampedCharge } }));
    events.push(combatSpriteEvent(hunterEventType, "hunter", attackStart, "hunter", hunterAnimation, { action, crit, charge: clampedCharge, sprite: hunterAnimation }));
    events.push(combatSpriteEvent(crit ? "crit" : "hit", "enemy", hitStart, enemyKind, "hurt", { action, damage, crit, charge: clampedCharge }));
    playerResolveAt = Math.max(playerResolveAt, attackStart + spriteEventDuration("hunter", hunterAnimation));
  }

  if (next.monster.hp <= 0) {
    next.phase = "rewards";
    logs.push(`[SYSTEM] Pokonano ${next.monster.name}. +${next.monster.xpReward} XP, +${next.monster.goldReward} Gold.`);
    const enemyKind = next.monster.element as SpriteActorKind;
    events.push(combatSpriteEvent("death", "enemy", playerResolveAt + 80, enemyKind, "death"));
    events.push(createAnimationEvent("reward", "system", playerResolveAt + 540));
    return { state: next, logs, events, victory: true, defeat: false };
  }

  next.phase = "enemyTelegraph";
  const enemyKind = next.monster.element as SpriteActorKind;
  const enemyWindupStart = Math.max(now + 520, playerResolveAt + 90);
  const enemyAttackAnimation = getEnemyActionAnimation(next.intent);
  const enemyAttackType = next.intent === "hex" ? "cast" : "attack";
  const enemyAttackStart = enemyWindupStart + 260;
  const hunterReactionStart = enemyAttackStart + spriteHitDelay(enemyKind, enemyAttackAnimation);
  events.push(createAnimationEvent("windup", "enemy", enemyWindupStart, { durationMs: 260, lockMs: 190, payload: { intent: next.intent } }));

  const dodged = random() * 100 < getCombatDodgeChance({ stats, unlockedSkills: skills, turn: next.turn, guarded, intent: next.intent });
  const damage = dodged ? 0 : enemyDamage(next.intent, next.monster, stats, guarded);
  next.playerHp = Math.max(0, next.playerHp - damage);
  if (dodged) {
    logs.push(`Unik: ${next.intent === "rush" ? "Zryw" : hasSkill(skills, "stealth") && next.turn === 1 ? "Ukrycie" : "reakcja"} omija [${getCombatIntentLabel(next.intent)}].`);
    events.push(combatSpriteEvent(enemyAttackType, "enemy", enemyAttackStart, enemyKind, enemyAttackAnimation, { intent: next.intent, sprite: enemyAttackAnimation }));
    events.push(combatSpriteEvent("dash", "hunter", hunterReactionStart, "hunter", "dash", { intent: next.intent, sprite: "dash" }));
  } else if (next.intent === "hex") {
    next.focus = clamp(next.focus - 18, 0, 100);
    logs.push(`${next.monster.name} rzuca [${getCombatIntentLabel(next.intent)}]: -${damage} HP i drenuje focus${guarded ? " (oslably efekt)" : ""}.`);
    events.push(combatSpriteEvent("cast", "enemy", enemyAttackStart, enemyKind, "cast", { intent: next.intent, sprite: "cast" }));
    events.push(combatSpriteEvent(guarded ? "guard" : "hit", "hunter", hunterReactionStart, "hunter", guarded ? "guard" : "hurt", { intent: next.intent, damage, sprite: guarded ? "guard" : "hurt" }));
  } else {
    logs.push(`${next.monster.name} uzywa [${getCombatIntentLabel(next.intent)}]: -${damage} HP${guarded ? " (garda)" : ""}.`);
    events.push(combatSpriteEvent("attack", "enemy", enemyAttackStart, enemyKind, enemyAttackAnimation, { intent: next.intent, sprite: enemyAttackAnimation }));
    events.push(combatSpriteEvent(guarded ? "guard" : "hit", "hunter", hunterReactionStart, "hunter", guarded ? "guard" : "hurt", { intent: next.intent, damage, sprite: guarded ? "guard" : "hurt" }));
  }

  next.turn += 1;
  next.intent = pickCombatIntent(next.monster, next.turn);
  next.phase = next.playerHp <= 0 ? "rewards" : "playerSelect";

  if (next.playerHp <= 0) {
    logs.push("[SYSTEM] Rajd przerwany. Wycofanie awaryjne.");
    events.push(combatSpriteEvent("death", "hunter", hunterReactionStart + 220, "hunter", "death"));
  }

  return { state: next, logs, events, victory: false, defeat: next.playerHp <= 0 };
}
