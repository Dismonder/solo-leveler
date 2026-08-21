import dungeonGate from "../assets/hub/dungeon-gate.png";
import skillTower from "../assets/hub/skill-tower.png";
import trainingArena from "../assets/hub/training-arena.png";
import dataVault from "../assets/hub/data-vault.png";
import gameGateDodgeThumb from "../assets/hub/thumbs/game-gate-dodge.jpg";
import gameManaMemoryThumb from "../assets/hub/thumbs/game-mana-memory.jpg";
import gameRuneLockThumb from "../assets/hub/thumbs/game-rune-lock.jpg";
import gameShadowExtractionThumb from "../assets/hub/thumbs/game-shadow-extraction.jpg";
import gameShadowStrikeThumb from "../assets/hub/thumbs/game-shadow-strike.jpg";
import gameSystemThumb from "../assets/hub/thumbs/game-system.jpg";
import hunterAttack from "../assets/models/gifs/hunter-attack.gif";
import shadowWraith from "../assets/models/monster-abyss-mage-wraith.png";
import shadowWolf from "../assets/models/monster-shadow-spike-wolf.png";
import armorPreview from "../assets/models/equipment/armors/armor-04.png";
import relicPreview from "../assets/models/equipment/relics/relic-04.png";
import weaponPreview from "../assets/models/equipment/weapons/weapon-14.png";
import monarchRelic from "../assets/models/relic-monarch-heart.png";
import portalEffect from "../assets/sprites/effects/portal.svg";
import slashEffect from "../assets/sprites/effects/slash.svg";
import idleRpgBattle from "../assets/idle-rpg/backgrounds/ash-realm-map.webp";

export const MOBILE_THEME_ASSETS = {
  hub: {
    dungeonGate,
    skillTower,
    trainingArena,
    dataVault,
  },
  hubCards: {
    gateDodge: gameGateDodgeThumb,
    manaMemory: gameManaMemoryThumb,
    runeLock: gameRuneLockThumb,
    shadowExtraction: gameShadowExtractionThumb,
    shadowStrike: gameShadowStrikeThumb,
    idleRpg: idleRpgBattle,
    system: gameSystemThumb,
  },
  hunter: {
    attack: hunterAttack,
  },
  miniGames: {
    gate: dungeonGate,
    shadowTrue: shadowWraith,
    shadowDecoy: shadowWolf,
    portal: portalEffect,
    slash: slashEffect,
  },
  equipment: {
    armor: armorPreview,
    relic: relicPreview,
    weapon: weaponPreview,
    monarchRelic,
  },
} as const;

export function getMiniGameThemeAsset(gameId: string) {
  switch (gameId) {
    case "gate-dodge":
      return { image: MOBILE_THEME_ASSETS.hubCards.gateDodge, label: "Brama" };
    case "mana-memory":
      return { image: MOBILE_THEME_ASSETS.hubCards.manaMemory, label: "Runy" };
    case "shadow-strike":
      return { image: MOBILE_THEME_ASSETS.hubCards.shadowStrike, label: "Cios" };
    case "rune-lock":
      return { image: MOBILE_THEME_ASSETS.hubCards.runeLock, label: "Wieża" };
    case "shadow-extraction":
      return { image: MOBILE_THEME_ASSETS.hubCards.shadowExtraction, label: "Cień" };
    case "idle-rpg":
      return { image: MOBILE_THEME_ASSETS.hubCards.idleRpg, label: "Pęknięty Południk" };
    default:
      return { image: MOBILE_THEME_ASSETS.hubCards.system, label: "System" };
  }
}
