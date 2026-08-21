import { useEffect, useRef, useState } from "react";
import type Phaser from "phaser";

import ashBattleAtlasUrl from "../../assets/idle-rpg/actors/ashen-bulwark-atlas.webp";
import ashSummonStripUrl from "../../assets/idle-rpg/actors/ashen-bulwark-atlas-summon-strip.webp";
import coreBattleAtlasUrl from "../../assets/idle-rpg/actors/core-battle-atlas.webp";
import drownedBattleAtlasUrl from "../../assets/idle-rpg/actors/drowned-archive-atlas.webp";
import drownedSummonStripUrl from "../../assets/idle-rpg/actors/drowned-archive-atlas-summon-strip.webp";
import dusklessBattleAtlasUrl from "../../assets/idle-rpg/actors/duskless-crown-atlas.webp";
import dusklessSummonStripUrl from "../../assets/idle-rpg/actors/duskless-crown-atlas-summon-strip.webp";
import thornBattleAtlasUrl from "../../assets/idle-rpg/actors/thorn-sky-atlas.webp";
import thornSummonStripUrl from "../../assets/idle-rpg/actors/thorn-sky-atlas-summon-strip.webp";
import idleRpgAssetManifest from "../../assets/idle-rpg/asset-manifest.json";
import ashBossOverlayUrl from "../../assets/idle-rpg/environment/ashen-bulwark/boss-overlay.webp";
import ashFarUrl from "../../assets/idle-rpg/environment/ashen-bulwark/far.webp";
import ashForegroundUrl from "../../assets/idle-rpg/environment/ashen-bulwark/foreground.webp";
import ashGroundUrl from "../../assets/idle-rpg/environment/ashen-bulwark/ground.webp";
import ashMidUrl from "../../assets/idle-rpg/environment/ashen-bulwark/mid.webp";
import ashSkyUrl from "../../assets/idle-rpg/environment/ashen-bulwark/sky.webp";
import drownedBossOverlayUrl from "../../assets/idle-rpg/environment/drowned-archive/boss-overlay.webp";
import drownedFarUrl from "../../assets/idle-rpg/environment/drowned-archive/far.webp";
import drownedForegroundUrl from "../../assets/idle-rpg/environment/drowned-archive/foreground.webp";
import drownedGroundUrl from "../../assets/idle-rpg/environment/drowned-archive/ground.webp";
import drownedMidUrl from "../../assets/idle-rpg/environment/drowned-archive/mid.webp";
import drownedSkyUrl from "../../assets/idle-rpg/environment/drowned-archive/sky.webp";
import duskBossOverlayUrl from "../../assets/idle-rpg/environment/duskless-crown/boss-overlay.webp";
import duskFarUrl from "../../assets/idle-rpg/environment/duskless-crown/far.webp";
import duskForegroundUrl from "../../assets/idle-rpg/environment/duskless-crown/foreground.webp";
import duskGroundUrl from "../../assets/idle-rpg/environment/duskless-crown/ground.webp";
import duskMidUrl from "../../assets/idle-rpg/environment/duskless-crown/mid.webp";
import duskSkyUrl from "../../assets/idle-rpg/environment/duskless-crown/sky.webp";
import thornBossOverlayUrl from "../../assets/idle-rpg/environment/thorn-sky/boss-overlay.webp";
import thornFarUrl from "../../assets/idle-rpg/environment/thorn-sky/far.webp";
import thornForegroundUrl from "../../assets/idle-rpg/environment/thorn-sky/foreground.webp";
import thornGroundUrl from "../../assets/idle-rpg/environment/thorn-sky/ground.webp";
import thornMidUrl from "../../assets/idle-rpg/environment/thorn-sky/mid.webp";
import thornSkyUrl from "../../assets/idle-rpg/environment/thorn-sky/sky.webp";
import {
  ENEMY_DEATH_MS,
  ENEMY_ENTER_MS,
  HERO_DEATH_MS,
  MARCH_MS,
  getActorAnimationMarkerDelayMs,
  getActorAnimationPhaseTimeScale,
  resolveActorAnimation,
  type IdleRpgAnimationState,
  type IdleRpgEvent,
  type IdleRpgSummonId,
} from "../../game/idle-rpg";
import {
  playIdleAttackSfx,
  playIdleEnemyDeathSfx,
  playIdleHitSfx,
  playSkillEchoSfx,
  playSkillRendSfx,
  playSkillShardSfx,
  playSkillStepSfx,
  playSkillUltimateSfx,
} from "../../utils/idleRpgAudio";
import type { PlayerState } from "../../types";

export type IdleBattleTier = "normal" | "elite" | "boss";

export interface IdleBattleStageModel {
  phase: string;
  encounterSerial: number;
  enemyTier: IdleBattleTier;
  enemyVariant: 0 | 1 | 2;
  enemyHp: number;
  enemyMaxHp: number;
  heroHp: number;
  heroMaxHp: number;
  realmIndex: 0 | 1 | 2 | 3;
  activeSummons: ReadonlyArray<IdleRpgSummonId>;
  graphicsQuality: PlayerState["settings"]["graphicsQuality"];
  reducedMotion: boolean;
}

interface IdleBattleStageProps {
  model: IdleBattleStageModel;
  subscribeEvents?: (listener: (event: IdleRpgEvent) => void) => () => void;
  className?: string;
}

type IdleRpgHitEvent = Extract<IdleRpgEvent, { type: "hit" }>;
type IdleRpgEnvironmentConfig = (typeof idleRpgAssetManifest.environment.realms)[keyof typeof idleRpgAssetManifest.environment.realms];

interface AmbientMote {
  object: Phaser.GameObjects.Rectangle;
  velocityX: number;
  velocityY: number;
  remainingMs: number;
}

const STAGE_WIDTH = 720;
const STAGE_HEIGHT = 720;
const ATLAS_FRAME_WIDTH = 192;
const ATLAS_FRAME_HEIGHT = 256;
const DAMAGE_LABEL_POOL_SIZE = 8;
const SHARD_RAIN_HIT_SPACING_MS = 90;
const HIT_FLASH_COOLDOWN_MS = 340;
const MARCH_YOYO_LEG_MS = 120;
const MARCH_YOYO_REPEAT_COUNT = MARCH_MS / (MARCH_YOYO_LEG_MS * 2) - 1;
const REALM_ENVIRONMENT_KEYS = ["ashen-bulwark", "drowned-archive", "thorn-sky", "duskless-crown"] as const;
const REALM_ENVIRONMENT_ASSETS = [
  { layerUrls: [ashSkyUrl, ashFarUrl, ashMidUrl, ashGroundUrl, ashForegroundUrl], bossOverlayUrl: ashBossOverlayUrl },
  { layerUrls: [drownedSkyUrl, drownedFarUrl, drownedMidUrl, drownedGroundUrl, drownedForegroundUrl], bossOverlayUrl: drownedBossOverlayUrl },
  { layerUrls: [thornSkyUrl, thornFarUrl, thornMidUrl, thornGroundUrl, thornForegroundUrl], bossOverlayUrl: thornBossOverlayUrl },
  { layerUrls: [duskSkyUrl, duskFarUrl, duskMidUrl, duskGroundUrl, duskForegroundUrl], bossOverlayUrl: duskBossOverlayUrl },
] as const;
const REALM_ATLASES = [ashBattleAtlasUrl, drownedBattleAtlasUrl, thornBattleAtlasUrl, dusklessBattleAtlasUrl] as const;
const REALM_SUMMON_STRIPS = [ashSummonStripUrl, drownedSummonStripUrl, thornSummonStripUrl, dusklessSummonStripUrl] as const;
const REALM_ACTOR_PREFIXES = ["ashen-bulwark", "drowned-archive", "thorn-sky", "duskless-crown"] as const;
const HERO_ACTOR_ID = "meridian-wanderer" as const;
const RUNTIME_ANIMATION_STATES: readonly IdleRpgAnimationState[] = [
  "idle", "march", "enter", "intro", "attack", "skill", "hit", "death", "ultimate",
];
const SUMMON_RENDER_DEFINITIONS: Record<IdleRpgSummonId, {
  atlasUrl: string;
  stripUrl: string | null;
  realmIndex: 0 | 1 | 2 | 3 | null;
  frameStart: number;
}> = {
  "meridian-fang": { atlasUrl: coreBattleAtlasUrl, stripUrl: null, realmIndex: null, frameStart: 16 },
  "ember-bastion": { atlasUrl: ashBattleAtlasUrl, stripUrl: ashSummonStripUrl, realmIndex: 0, frameStart: 40 },
  "ink-mora": { atlasUrl: drownedBattleAtlasUrl, stripUrl: drownedSummonStripUrl, realmIndex: 1, frameStart: 40 },
  "storm-spire": { atlasUrl: thornBattleAtlasUrl, stripUrl: thornSummonStripUrl, realmIndex: 2, frameStart: 40 },
  "dusk-aureole": { atlasUrl: dusklessBattleAtlasUrl, stripUrl: dusklessSummonStripUrl, realmIndex: 3, frameStart: 40 },
};

function getEnemyActorId(model: IdleBattleStageModel): string {
  const prefix = REALM_ACTOR_PREFIXES[model.realmIndex];
  if (model.enemyTier === "normal") return `${prefix}-normal-${model.enemyVariant}`;
  return `${prefix}-${model.enemyTier}-${model.enemyTier === "elite" ? 6 : 12}`;
}

function isMarchPhase(phase: string): boolean {
  return phase === "marching" || phase === "realm-clear" || phase === "abyss-depth-clear";
}

/**
 * Render-only battle surface. Every gameplay value enters through `model` and
 * Phaser is deliberately unable to mutate the domain runtime.
 */
export function IdleBattleStage({ model, subscribeEvents, className = "" }: IdleBattleStageProps) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const modelRef = useRef(model);
  const [rendererFailed, setRendererFailed] = useState(false);
  const environmentKey = REALM_ENVIRONMENT_KEYS[model.realmIndex];
  const environmentConfig = idleRpgAssetManifest.environment.realms[environmentKey] as IdleRpgEnvironmentConfig;
  const environmentAssets = REALM_ENVIRONMENT_ASSETS[model.realmIndex];
  const fallbackBackdropUrl = environmentAssets.layerUrls[0];
  const realmAtlasUrl = REALM_ATLASES[model.realmIndex];
  const activeSummonKey = model.activeSummons.slice(0, 3).join("|");

  modelRef.current = model;

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    setRendererFailed(false);

    let disposed = false;
    let game: Phaser.Game | null = null;
    let unsubscribeEvents: (() => void) | null = null;
    let renderScene: { renderEvent(event: IdleRpgEvent): void } | null = null;

    void import("phaser")
      .then((phaserModule) => {
        if (disposed) return;
        const PhaserLib = phaserModule.default;

        class IdleRpgBattleScene extends PhaserLib.Scene {
          private backdrops: Phaser.GameObjects.TileSprite[] = [];
          private parallaxLayers = environmentConfig.layers;
          private bossOverlay?: Phaser.GameObjects.Image;
          private ambientMotes: AmbientMote[] = [];
          private ambientSpawnBudget = 0;
          private ambientCursor = 0;
          private ambientRandomState = 0x6d2b79f5 ^ modelRef.current.encounterSerial;
          private hero?: Phaser.GameObjects.Sprite;
          private heroShadow?: Phaser.GameObjects.Ellipse;
          private summons: Phaser.GameObjects.Sprite[] = [];
          private summonShadows: Phaser.GameObjects.Ellipse[] = [];
          private enemy?: Phaser.GameObjects.Sprite;
          private enemyShadow?: Phaser.GameObjects.Ellipse;
          private damageLabels: Phaser.GameObjects.Text[] = [];
          private damageLabelCursor = 0;
          private actionHitCounts = new Map<IdleRpgHitEvent["source"], number>();
          private pendingHitReactions = new Set<Phaser.Time.TimerEvent>();
          private lastFlashAt = new Map<Phaser.GameObjects.Sprite, number>();
          private activeTier: IdleBattleTier = "normal";
          private activePhase = "";
          private activeEncounter = -1;
          private enemyDeathVisualEncounter = -1;
          private heroDeathVisualEncounter = -1;
          private marchVisualEncounter = -1;
          private marchVisualActive = false;
          private lastEnemyHp = Number.POSITIVE_INFINITY;
          private lastWidth = STAGE_WIDTH;
          private lastHeight = STAGE_HEIGHT;

          constructor() {
            super({ key: "idle-rpg-battle-renderer" });
          }

          preload() {
            // Assets are loaded only when this specialized scene is mounted.
            environmentAssets.layerUrls.forEach((url, index) => {
              this.load.image(`irpg-environment-layer-${index}`, url);
            });
            this.load.image("irpg-boss-overlay", environmentAssets.bossOverlayUrl);
            this.load.spritesheet("irpg-core-atlas", coreBattleAtlasUrl, {
              frameWidth: ATLAS_FRAME_WIDTH,
              frameHeight: ATLAS_FRAME_HEIGHT,
            });
            this.load.spritesheet("irpg-realm-atlas", realmAtlasUrl, {
              frameWidth: ATLAS_FRAME_WIDTH,
              frameHeight: ATLAS_FRAME_HEIGHT,
            });
            const summonRealmIndexes = new Set<0 | 1 | 2 | 3>(
              modelRef.current.activeSummons
                .slice(0, 3)
                .map((summonId) => SUMMON_RENDER_DEFINITIONS[summonId].realmIndex)
                .filter((realmIndex): realmIndex is 0 | 1 | 2 | 3 => realmIndex !== null && realmIndex !== modelRef.current.realmIndex),
            );
            for (const summonRealmIndex of summonRealmIndexes) {
              this.load.spritesheet(`irpg-summon-atlas-${summonRealmIndex}`, REALM_SUMMON_STRIPS[summonRealmIndex], {
                frameWidth: ATLAS_FRAME_WIDTH,
                frameHeight: ATLAS_FRAME_HEIGHT,
              });
            }
            this.load.on("loaderror", () => {
              if (!disposed) setRendererFailed(true);
            });
          }

          create() {
            renderScene = this;
            this.cameras.main.setRoundPixels(true);
            this.backdrops = this.parallaxLayers.map((layer, index) => this.add
              .tileSprite(0, 0, STAGE_WIDTH, layer.height, `irpg-environment-layer-${index}`)
              .setOrigin(0)
              .setDepth(index));
            this.bossOverlay = this.add
              .image(STAGE_WIDTH / 2, STAGE_HEIGHT / 2, "irpg-boss-overlay")
              .setDepth(7)
              .setVisible(false)
              .setAlpha(0);
            this.createAmbientMotePool();

            this.createAtlasAnimations();
            this.heroShadow = this.add.ellipse(0, 0, 56, 18, 0x0f172a, 0.55).setDepth(9);
            this.hero = this.add.sprite(202, 565, "irpg-core-atlas", 0).setDepth(12);
            this.summonShadows = modelRef.current.activeSummons.slice(0, 3).map((_, index) => {
              const ring = this.add
                .ellipse(0, 0, 44, 15, 0x1e3a8a, 0.6)
                .setStrokeStyle(1.5, 0x38bdf8, 0.85)
                .setDepth(9 - index);
              this.tweens.add({
                targets: ring,
                scaleX: 1.12,
                scaleY: 1.12,
                alpha: 0.85,
                duration: 750 + index * 120,
                yoyo: true,
                repeat: -1,
                ease: "Sine.easeInOut",
              });
              return ring;
            });
            this.summons = modelRef.current.activeSummons.slice(0, 3).map((summonId, index) => {
              const summon = this.add
                .sprite(300 + index * 52, 595, this.getSummonTextureKey(summonId), 0)
                .setDepth(11 - index);
              this.configureActorSprite(summon, summonId, "right", this.getSummonFrameOffset(summonId));
              this.playActorAnimation(summon, summonId, "idle");
              return summon;
            });
            this.enemyShadow = this.add.ellipse(0, 0, 72, 22, 0x450a0a, 0.6).setStrokeStyle(1.5, 0xf43f5e, 0.75).setDepth(9);
            this.enemy = this.add.sprite(535, 522, "irpg-realm-atlas", 0).setDepth(12);
            this.configureActorSprite(this.hero, HERO_ACTOR_ID, "right");
            this.configureActorSprite(this.enemy, getEnemyActorId(modelRef.current), "left");
            this.playActorAnimation(this.hero, HERO_ACTOR_ID, "idle");
            this.hero.setScale(1.45);
            this.summons.forEach((summon) => summon.setScale(this.summons.length > 1 ? 0.62 : 0.82));
            this.enemy.setScale(1.35);
            this.createDamageLabelPool();

            this.scale.on("resize", this.layout, this);
            this.layout({ width: this.scale.width, height: this.scale.height });
            this.syncModel(true);
          }

          update(_time: number, delta: number) {
            this.syncModel(false);
            this.updateAmbientMotes(delta);
            if (this.marchVisualActive && !modelRef.current.reducedMotion) {
              const baseScroll = delta * 0.075 * 0.45;
              this.backdrops.forEach((backdrop) => {
                backdrop.tilePositionX += baseScroll;
              });
            }
          }

          private createAtlasAnimations() {
            this.createActorAnimations(HERO_ACTOR_ID, "irpg-core-atlas");
            this.createActorAnimations(getEnemyActorId(modelRef.current), "irpg-realm-atlas");
            for (const summonId of modelRef.current.activeSummons.slice(0, 3)) {
              this.createActorAnimations(
                summonId,
                this.getSummonTextureKey(summonId),
                this.getSummonFrameOffset(summonId),
              );
            }
          }

          private createDamageLabelPool() {
            this.damageLabels = Array.from({ length: DAMAGE_LABEL_POOL_SIZE }, () => this.add
              .text(0, 0, "", {
                fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Inter, system-ui, sans-serif',
                fontSize: "18px",
                fontStyle: "bold",
                color: "#ffffff",
                stroke: "#000000",
                strokeThickness: 5,
                align: "center",
                shadow: { offsetX: 0, offsetY: 2, color: "#000000", blur: 4, stroke: true, fill: true },
              })
              .setOrigin(0.5)
              .setDepth(30)
              .setVisible(false));
          }

          private createAmbientMotePool() {
            const qualityMultiplier = modelRef.current.graphicsQuality === "performance"
              ? 0.35
              : modelRef.current.graphicsQuality === "balanced"
                ? 0.65
                : 1;
            const poolSize = Math.max(4, Math.ceil(environmentConfig.ambientParticles.maxParticles * qualityMultiplier));
            this.ambientMotes = Array.from({ length: poolSize }, () => ({
              object: this.add
                .rectangle(0, 0, 2, 2, 0xffffff)
                .setDepth(9)
                .setVisible(false),
              velocityX: 0,
              velocityY: 0,
              remainingMs: 0,
            }));
          }

          private nextAmbientRandom() {
            let state = this.ambientRandomState | 0;
            state ^= state << 13;
            state ^= state >>> 17;
            state ^= state << 5;
            this.ambientRandomState = state | 0;
            return (state >>> 0) / 0x1_0000_0000;
          }

          private spawnAmbientMote() {
            if (this.ambientMotes.length === 0) return;
            const mote = this.ambientMotes[this.ambientCursor % this.ambientMotes.length];
            this.ambientCursor += 1;
            const config = environmentConfig.ambientParticles;
            const randomBetween = (range: readonly number[]) => range[0] + (range[1] - range[0]) * this.nextAmbientRandom();
            const velocityY = randomBetween(config.velocityY);
            const size = Math.max(1, Math.round(randomBetween(config.sizePx)));
            const color = Number.parseInt(config.colors[Math.floor(this.nextAmbientRandom() * config.colors.length)].slice(1), 16);
            mote.velocityX = randomBetween(config.velocityX);
            mote.velocityY = velocityY;
            mote.remainingMs = randomBetween(config.lifespanMs);
            mote.object
              .setPosition(this.nextAmbientRandom() * this.lastWidth, velocityY >= 0 ? -size : this.lastHeight + size)
              .setDisplaySize(size, size)
              .setFillStyle(color)
              .setAlpha(randomBetween(config.alpha))
              .setVisible(true);
          }

          private updateAmbientMotes(delta: number) {
            const reducedMotionMultiplier = modelRef.current.reducedMotion
              ? environmentConfig.ambientParticles.reducedMotionRateMultiplier
              : 1;
            const qualityMultiplier = modelRef.current.graphicsQuality === "performance"
              ? 0.35
              : modelRef.current.graphicsQuality === "balanced"
                ? 0.65
                : 1;
            const canSpawn = modelRef.current.phase !== "paused" && modelRef.current.phase !== "loading";
            if (canSpawn) {
              this.ambientSpawnBudget = Math.min(
                this.ambientMotes.length,
                this.ambientSpawnBudget
                  + delta * environmentConfig.ambientParticles.ratePerSecond * qualityMultiplier * reducedMotionMultiplier / 1_000,
              );
              while (this.ambientSpawnBudget >= 1) {
                this.ambientSpawnBudget -= 1;
                this.spawnAmbientMote();
              }
            }

            const motionMultiplier = modelRef.current.reducedMotion ? 0.35 : 1;
            for (const mote of this.ambientMotes) {
              if (!mote.object.visible) continue;
              mote.remainingMs -= delta;
              mote.object.x += mote.velocityX * motionMultiplier * delta / 1_000;
              mote.object.y += mote.velocityY * motionMultiplier * delta / 1_000;
              if (
                mote.remainingMs <= 0
                || mote.object.x < -12
                || mote.object.x > this.lastWidth + 12
                || mote.object.y < -12
                || mote.object.y > this.lastHeight + 12
              ) {
                mote.object.setVisible(false);
              }
            }
          }

          private createActorAnimations(actorId: string, textureKey: string, frameOffset = 0) {
            for (const state of RUNTIME_ANIMATION_STATES) {
              const resolved = resolveActorAnimation(actorId, state);
              if (!resolved) continue;
              const key = this.getAnimationKey(actorId, state);
              if (this.anims.exists(key)) continue;
              this.anims.create({
                key,
                frames: resolved.frames.map((frame) => ({ key: textureKey, frame: frame - frameOffset })),
                frameRate: resolved.fps,
                repeat: resolved.loop ? -1 : 0,
                skipMissedFrames: false,
              });
            }
          }

          private getAnimationKey(actorId: string, state: IdleRpgAnimationState) {
            return `irpg-${actorId}-${state}`;
          }

          private configureActorSprite(
            sprite: Phaser.GameObjects.Sprite,
            actorId: string,
            desiredFacing: "left" | "right",
            frameOffset = 0,
          ) {
            const idle = resolveActorAnimation(actorId, "idle");
            if (!idle) return;
            sprite
              .setOrigin(idle.actor.pivot.x, idle.actor.pivot.y)
              .setFlipX(idle.actor.facing !== desiredFacing)
              .setFrame(idle.frames[0] - frameOffset);
          }

          private playActorAnimation(
            sprite: Phaser.GameObjects.Sprite | undefined,
            actorId: string,
            state: IdleRpgAnimationState,
            returnToIdle = true,
            phaseDurationMs?: number,
            forceRestart = false,
          ) {
            if (!sprite) return;
            const resolved = resolveActorAnimation(actorId, state) ?? resolveActorAnimation(actorId, "idle");
            if (!resolved) return;
            const key = this.getAnimationKey(actorId, resolved.state);
            if (!this.anims.exists(key)) return;
            sprite.play(key, !forceRestart);
            sprite.anims.timeScale = phaseDurationMs
              ? getActorAnimationPhaseTimeScale(actorId, resolved.state, phaseDurationMs)
              : 1;
            sprite.off("animationcomplete");
            if (!resolved.loop && returnToIdle) {
              sprite.once("animationcomplete", () => {
                if (modelRef.current.phase === "fighting") {
                  this.playActorAnimation(sprite, actorId, "idle", false);
                }
              });
            }
          }

          private getSummonTextureKey(summonId: IdleRpgSummonId) {
            const definition = SUMMON_RENDER_DEFINITIONS[summonId];
            if (definition.realmIndex === null) return "irpg-core-atlas";
            if (definition.realmIndex === modelRef.current.realmIndex) return "irpg-realm-atlas";
            return `irpg-summon-atlas-${definition.realmIndex}`;
          }

          private getSummonFrameOffset(summonId: IdleRpgSummonId) {
            const definition = SUMMON_RENDER_DEFINITIONS[summonId];
            return definition.realmIndex !== null && definition.realmIndex !== modelRef.current.realmIndex
              ? definition.frameStart
              : 0;
          }

          private layout(gameSize: { width: number; height: number }) {
            const width = Math.max(1, gameSize.width);
            const height = Math.max(1, gameSize.height);
            this.lastWidth = width;
            this.lastHeight = height;
            const tileScale = Math.max(
              width / idleRpgAssetManifest.environment.canvasWidth,
              height / idleRpgAssetManifest.environment.canvasHeight,
            );
            const compositionY = (height - idleRpgAssetManifest.environment.canvasHeight * tileScale) / 2;
            this.backdrops.forEach((backdrop, index) => {
              const layer = this.parallaxLayers[index];
              const sourceImage = this.textures.get(`irpg-environment-layer-${index}`).getSourceImage() as HTMLImageElement;
              const centeredTileX = Math.max(0, (sourceImage.width - width / tileScale) / 2);
              backdrop
                .setPosition(0, compositionY + layer.y * tileScale)
                .setSize(width, Math.ceil(layer.height * tileScale) + 1)
                .setTileScale(tileScale);
              backdrop.tilePositionX = centeredTileX;
              backdrop.tilePositionY = 0;
            });

            if (this.bossOverlay) {
              const overlayImage = this.textures.get("irpg-boss-overlay").getSourceImage() as HTMLImageElement;
              const overlayScale = Math.max(width / overlayImage.width, height / overlayImage.height);
              this.bossOverlay.setPosition(width / 2, height / 2).setScale(overlayScale);
            }

            const heroX = width * 0.22;
            const heroY = height * 0.79;
            this.hero?.setPosition(heroX, heroY).setDepth(10);
            this.heroShadow?.setPosition(heroX, heroY + 4).setDepth(9);

            const summonPositions = this.getSummonLayoutPositions(width, height);
            this.summons.forEach((summon, index) => {
              const pos = summonPositions[index];
              if (pos) {
                summon.setPosition(pos.x, pos.y).setDepth(12 + index);
                this.summonShadows[index]?.setPosition(pos.x, pos.y + 2).setDepth(11);
              }
            });

            const enemyX = width * 0.80;
            const enemyY = height * 0.79;
            this.enemy?.setPosition(enemyX, enemyY).setDepth(20);
            this.enemyShadow?.setPosition(enemyX, enemyY + 4).setDepth(19);
          }

          private getSummonLayoutPositions(width: number, height: number) {
            const count = this.summons.length;
            if (count === 1) return [{ x: width * 0.46, y: height * 0.80 }];
            if (count === 2) return [
              { x: width * 0.40, y: height * 0.80 },
              { x: width * 0.53, y: height * 0.785 },
            ];
            return [
              { x: width * 0.36, y: height * 0.80 },
              { x: width * 0.48, y: height * 0.785 },
              { x: width * 0.58, y: height * 0.805 },
            ];
          }

          private syncModel(force: boolean) {
            const next = modelRef.current;
            if (force || next.enemyTier !== this.activeTier || next.encounterSerial !== this.activeEncounter) {
              this.clearPendingHitReactions();
              this.activeTier = next.enemyTier;
              this.activeEncounter = next.encounterSerial;
              this.enemyDeathVisualEncounter = -1;
              this.heroDeathVisualEncounter = -1;
              this.marchVisualEncounter = -1;
              this.marchVisualActive = false;
              this.lastEnemyHp = next.enemyHp;
              this.syncEnemyTexture(next.enemyTier);
              this.syncBossOverlay(next.enemyTier, next.reducedMotion);
              this.tweens.killTweensOf(this.enemy);
              if (this.enemyShadow) this.tweens.killTweensOf(this.enemyShadow);
              const enemyTargetX = this.lastWidth * 0.80;
              const enemyStartX = next.reducedMotion ? enemyTargetX : this.lastWidth * 0.92;
              this.enemy
                ?.setVisible(true)
                .setAlpha(0)
                .setPosition(enemyStartX, this.lastHeight * 0.79);
              this.enemyShadow
                ?.setVisible(true)
                .setAlpha(0)
                .setPosition(enemyStartX, this.lastHeight * 0.79 + 4);
              this.tweens.add({
                targets: [this.enemy, this.enemyShadow].filter(Boolean),
                alpha: 1,
                x: enemyTargetX,
                duration: next.reducedMotion ? 300 : ENEMY_ENTER_MS,
                ease: "Stepped",
              });
            } else if (!subscribeEvents && next.phase === "fighting" && next.enemyHp < this.lastEnemyHp) {
              this.playHeroAction();
              this.flashSprite(this.enemy);
            }

            this.lastEnemyHp = next.enemyHp;

            if (force || next.phase !== this.activePhase) {
              this.activePhase = next.phase;
              this.syncPhase(next.phase, next.reducedMotion);
            }
          }

          private syncEnemyTexture(tier: IdleBattleTier) {
            if (this.enemy) {
              const actorId = getEnemyActorId(modelRef.current);
              this.createActorAnimations(actorId, "irpg-realm-atlas");
              this.configureActorSprite(this.enemy, actorId, "left");
              this.enemy.setScale(tier === "boss" ? 1.9 : tier === "elite" ? 1.6 : 1.35);
            }
          }

          private playEnemyAnimation(
            state: IdleRpgAnimationState = "idle",
            returnToIdle = true,
            phaseDurationMs?: number,
            forceRestart = false,
          ) {
            if (!this.enemy) return;
            this.playActorAnimation(
              this.enemy,
              getEnemyActorId(modelRef.current),
              state,
              returnToIdle,
              phaseDurationMs,
              forceRestart,
            );
          }

          private syncBossOverlay(tier: IdleBattleTier, reducedMotion: boolean) {
            if (!this.bossOverlay) return;
            this.tweens.killTweensOf(this.bossOverlay);
            if (tier !== "boss") {
              this.bossOverlay.setAlpha(0).setVisible(false);
              return;
            }
            this.bossOverlay.setVisible(true).setAlpha(0);
            this.tweens.add({
              targets: this.bossOverlay,
              alpha: environmentConfig.bossOverlay.maxOpacity,
              duration: reducedMotion ? 300 : ENEMY_ENTER_MS,
              ease: "Linear",
            });
          }

          private syncPhase(phase: string, reducedMotion: boolean) {
            if (phase === "enemy-dying") {
              this.startEnemyDeathVisual(reducedMotion);
              return;
            }
            if (phase === "hero-dying") {
              this.startHeroDeathVisual(reducedMotion);
              return;
            }
            if (phase === "respawning") {
              this.marchVisualActive = false;
              this.stopFriendlyMovement();
              this.hero?.setAlpha(0);
              if (this.heroShadow) this.heroShadow.setAlpha(0);
              this.summons.forEach((summon) => summon.setAlpha(0));
              this.summonShadows.forEach((shadow) => shadow.setAlpha(0));
              this.enemy?.setVisible(true).setAlpha(1);
              if (this.enemyShadow) this.enemyShadow.setVisible(true).setAlpha(1);
              this.playEnemyAnimation("idle", false);
              return;
            }
            if (isMarchPhase(phase)) {
              this.startMarchVisual(reducedMotion);
              return;
            }
            if (phase === "paused") {
              this.marchVisualActive = false;
              this.marchVisualEncounter = -1;
              this.clearPendingHitReactions();
              this.stopFriendlyMovement();
              this.tweens.killTweensOf(this.cameras.main);
              this.cameras.main.setAlpha(1);
              return;
            }

            this.marchVisualActive = false;
            this.stopFriendlyMovement();
            this.cameras.main.setAlpha(1);
            this.hero?.setAlpha(1);
            if (this.heroShadow) this.heroShadow.setAlpha(1);
            this.summons.forEach((summon) => summon.setAlpha(1));
            this.summonShadows.forEach((shadow) => shadow.setAlpha(1));
            this.playFriendlyAnimation("idle");

            if (phase === "campaign-complete") {
              this.enemy?.setVisible(false);
              if (this.enemyShadow) this.enemyShadow.setVisible(false);
              this.bossOverlay?.setVisible(false);
              return;
            }

            this.enemy?.setVisible(true);
            if (this.enemyShadow) this.enemyShadow.setVisible(true);
            if (phase === "enemy-entering") {
              this.playEnemyAnimation(this.activeTier === "boss" ? "intro" : "enter", false, ENEMY_ENTER_MS, true);
            } else {
              this.playEnemyAnimation("idle", false);
            }
          }

          private playFriendlyAnimation(state: "idle" | "march") {
            this.playActorAnimation(this.hero, HERO_ACTOR_ID, state, false);
            this.summons.forEach((summon, index) => {
              const summonId = modelRef.current.activeSummons[index];
              if (summonId) this.playActorAnimation(summon, summonId, state, false);
            });
          }

          private resetFriendlyPositions() {
            const heroX = this.lastWidth * 0.22;
            const heroY = this.lastHeight * 0.79;
            this.hero?.setPosition(heroX, heroY);
            this.heroShadow?.setPosition(heroX, heroY + 4);
            const summonPositions = this.getSummonLayoutPositions(this.lastWidth, this.lastHeight);
            this.summons.forEach((summon, index) => {
              const pos = summonPositions[index];
              if (pos) {
                summon.setPosition(pos.x, pos.y);
                this.summonShadows[index]?.setPosition(pos.x, pos.y + 2);
              }
            });
          }

          private stopFriendlyMovement() {
            if (this.hero) this.tweens.killTweensOf(this.hero);
            if (this.heroShadow) this.tweens.killTweensOf(this.heroShadow);
            this.summons.forEach((summon) => this.tweens.killTweensOf(summon));
            this.summonShadows.forEach((shadow) => this.tweens.killTweensOf(shadow));
            this.resetFriendlyPositions();
          }

          private startEnemyDeathVisual(reducedMotion: boolean) {
            if (this.enemyDeathVisualEncounter === this.activeEncounter) return;
            this.enemyDeathVisualEncounter = this.activeEncounter;
            if (this.enemy) this.tweens.killTweensOf(this.enemy);
            if (this.enemyShadow) this.tweens.killTweensOf(this.enemyShadow);
            this.enemy?.setVisible(true).setAlpha(1);
            if (this.enemyShadow) this.enemyShadow.setVisible(true).setAlpha(1);
            this.playEnemyAnimation("death", false, ENEMY_DEATH_MS, true);
            this.tweens.add({
              targets: [this.enemy, this.enemyShadow].filter(Boolean),
              alpha: 0,
              duration: ENEMY_DEATH_MS,
              ease: reducedMotion ? "Linear" : "Stepped",
            });
            if (this.activeTier === "boss" && this.enemy) {
              this.triggerBossDeathExplosion(this.enemy.x, this.enemy.y);
            }
            if (this.activeTier === "boss" && this.bossOverlay) {
              this.tweens.killTweensOf(this.bossOverlay);
              this.tweens.add({
                targets: this.bossOverlay,
                alpha: 0,
                duration: ENEMY_DEATH_MS,
                ease: "Linear",
              });
            }
          }

          private emitHitSparks(x: number, y: number, critical = false, color = 0x38bdf8) {
            if (modelRef.current.reducedMotion) return;
            const count = critical ? 14 : 7;
            for (let i = 0; i < count; i++) {
              const spark = this.add.graphics();
              spark.setDepth(32);
              spark.setPosition(x, y);

              const sparkColor = critical ? (i % 2 === 0 ? 0xffd700 : 0xff3b5c) : (i % 2 === 0 ? color : 0xffffff);
              spark.fillStyle(sparkColor, 1);
              const size = critical ? 3 + Math.floor(Math.random() * 3) : 2 + Math.floor(Math.random() * 2);
              spark.fillCircle(0, 0, size);

              const angle = -Math.PI + Math.random() * (Math.PI + 0.2);
              const speed = critical ? 80 + Math.random() * 100 : 45 + Math.random() * 65;
              const vx = Math.cos(angle) * speed;
              const vy = Math.sin(angle) * speed;

              this.tweens.add({
                targets: spark,
                x: x + vx * 0.22,
                y: y + vy * 0.22 + 20,
                alpha: 0,
                scaleX: 0.2,
                scaleY: 0.2,
                duration: 180 + Math.floor(Math.random() * 100),
                ease: "Quad.easeOut",
                onComplete: () => spark.destroy(),
              });
            }
          }

          private triggerBossDeathExplosion(x: number, y: number) {
            if (modelRef.current.reducedMotion) return;
            for (let i = 0; i < 3; i++) {
              this.time.delayedCall(i * 130, () => {
                const ring = this.add.graphics();
                ring.setDepth(33);
                ring.setPosition(x, y);
                const ringColor = i === 0 ? 0x9333ea : i === 1 ? 0x38bdf8 : 0xffd700;
                ring.lineStyle(4, ringColor, 0.95);
                ring.strokeCircle(0, 0, 15);

                this.tweens.add({
                  targets: ring,
                  scaleX: 4.5,
                  scaleY: 4.5,
                  alpha: 0,
                  duration: 420,
                  ease: "Cubic.easeOut",
                  onComplete: () => ring.destroy(),
                });
              });
            }

            for (let i = 0; i < 18; i++) {
              const ember = this.add.graphics();
              ember.setDepth(34);
              const spawnX = x + (-35 + Math.random() * 70);
              const spawnY = y + (-25 + Math.random() * 50);
              ember.setPosition(spawnX, spawnY);
              ember.fillStyle(i % 2 === 0 ? 0xa855f7 : 0x38bdf8, 0.9);
              ember.fillCircle(0, 0, 2 + Math.floor(Math.random() * 4));

              this.tweens.add({
                targets: ember,
                y: spawnY - (50 + Math.random() * 70),
                x: spawnX + (-25 + Math.random() * 50),
                alpha: 0,
                duration: 380 + Math.floor(Math.random() * 320),
                ease: "Quad.easeOut",
                onComplete: () => ember.destroy(),
              });
            }
          }

          private startHeroDeathVisual(reducedMotion: boolean) {
            if (this.heroDeathVisualEncounter === this.activeEncounter) return;
            this.heroDeathVisualEncounter = this.activeEncounter;
            this.marchVisualActive = false;
            this.stopFriendlyMovement();
            this.hero?.setAlpha(1);
            if (this.heroShadow) this.heroShadow.setAlpha(1);
            this.summons.forEach((summon) => summon.setAlpha(1));
            this.summonShadows.forEach((shadow) => shadow.setAlpha(1));
            this.playActorAnimation(this.hero, HERO_ACTOR_ID, "death", false, HERO_DEATH_MS, true);
            this.summons.forEach((summon, index) => {
              const summonId = modelRef.current.activeSummons[index];
              if (summonId) this.playActorAnimation(summon, summonId, "death", false, HERO_DEATH_MS, true);
            });
            this.tweens.add({
              targets: [this.hero, this.heroShadow, ...this.summons, ...this.summonShadows].filter(Boolean),
              alpha: 0,
              duration: HERO_DEATH_MS,
              ease: reducedMotion ? "Linear" : "Stepped",
            });
          }

          private startMarchVisual(reducedMotion: boolean) {
            if (this.marchVisualEncounter === this.activeEncounter) return;
            this.marchVisualEncounter = this.activeEncounter;
            this.marchVisualActive = true;
            this.stopFriendlyMovement();
            this.hero?.setAlpha(1);
            if (this.heroShadow) this.heroShadow.setAlpha(1);
            this.summons.forEach((summon) => summon.setAlpha(1));
            this.summonShadows.forEach((shadow) => shadow.setAlpha(1));
            this.enemy?.setVisible(false);
            if (this.enemyShadow) this.enemyShadow.setVisible(false);
            this.bossOverlay?.setVisible(false);
            this.playFriendlyAnimation("march");

            if (reducedMotion) {
              this.cameras.main.setAlpha(1);
              this.tweens.killTweensOf(this.cameras.main);
              this.tweens.add({
                targets: this.cameras.main,
                alpha: 0.28,
                duration: 150,
                yoyo: true,
                ease: "Linear",
              });
              return;
            }

            this.tweens.add({
              targets: [this.hero, this.heroShadow, ...this.summons, ...this.summonShadows].filter(Boolean),
              x: "+=20",
              duration: MARCH_YOYO_LEG_MS,
              yoyo: true,
              repeat: MARCH_YOYO_REPEAT_COUNT,
              ease: "Stepped",
            });
          }

          renderEvent(event: IdleRpgEvent) {
            if (event.type === "animation-start") {
              this.actionHitCounts.set(event.actor, 0);
              if (event.actor === "hero") {
                const isUltimate = event.animation === "last-meridian";
                this.playHeroAction(isUltimate ? "ultimate" : event.animation === "attack" ? "attack" : "skill");
                if (event.animation === "attack") {
                  playIdleAttackSfx();
                } else {
                  this.triggerSkillFX(event.animation, 0);
                  if (event.animation === "meridian-rend") playSkillRendSfx();
                  else if (event.animation === "seam-step") playSkillStepSfx();
                  else if (event.animation === "shard-rain") playSkillShardSfx(0);
                  else if (event.animation === "last-meridian") playSkillUltimateSfx();
                }
              } else if (event.actor === "enemy") {
                this.playEnemyAnimation(event.animation === "attack" ? "attack" : "idle");
                if (event.animation === "attack") {
                  playIdleAttackSfx();
                }
              } else {
                const summonIndex = modelRef.current.activeSummons.slice(0, 3).indexOf(event.actor);
                const summon = this.summons[summonIndex];
                const summonShadow = this.summonShadows[summonIndex];
                if (summon) {
                  this.playActorAnimation(summon, event.actor, event.animation === "skill" ? "skill" : "attack");
                  if (event.animation === "skill") {
                    playSkillEchoSfx();
                  } else {
                    playIdleAttackSfx();
                  }
                  if (!modelRef.current.reducedMotion) {
                    const summonTints: Record<string, number> = {
                      "ember-bastion": 0xff9944,
                      "ink-mora": 0xaa55ff,
                      "storm-spire": 0x33ffff,
                      "dusk-aureole": 0xffe066,
                      "meridian-fang": 0x55ccff,
                    };
                    const tint = summonTints[event.actor] ?? 0x66ccff;
                    summon.setTint(tint);
                    this.tweens.add({
                      targets: [summon, summonShadow].filter(Boolean),
                      x: "+=24",
                      duration: 95,
                      yoyo: true,
                      ease: "Stepped",
                      onComplete: () => { if (summon.active) summon.clearTint(); },
                    });
                    if (event.animation === "skill") {
                      this.triggerSkillFX("echo-call", summonIndex);
                    }
                  }
                }
              }
              return;
            }
            if (event.type === "hit") {
              this.queueHitReaction(event);
              return;
            }
            if (event.type === "death") {
              if (event.actor === "enemy") {
                playIdleEnemyDeathSfx(modelRef.current.enemyTier === "boss");
                this.startEnemyDeathVisual(modelRef.current.reducedMotion);
              } else {
                this.startHeroDeathVisual(modelRef.current.reducedMotion);
              }
              return;
            }
            if (event.type === "march") this.startMarchVisual(modelRef.current.reducedMotion);
          }

          private playHeroAction(state: "attack" | "skill" | "ultimate" = "attack") {
            this.playActorAnimation(this.hero, HERO_ACTOR_ID, state);
          }

          private triggerSkillFX(skillId: string, hitIndex = 0) {
            if (modelRef.current.reducedMotion) return;
            const target = this.enemy;
            if (!target || !target.active) return;

            switch (skillId) {
              case "meridian-rend": {
                if (this.hero) {
                  this.tweens.add({
                    targets: [this.hero, this.heroShadow].filter(Boolean),
                    x: "+=32",
                    duration: 90,
                    yoyo: true,
                    ease: "Cubic.easeOut",
                  });
                }
                const slash = this.add.graphics();
                slash.setDepth(30);
                const startX = target.x + 35;
                const startY = target.y - 65;
                const endX = target.x - 45;
                const endY = target.y + 35;

                slash.lineStyle(8, 0x38bdf8, 0.95);
                slash.beginPath();
                slash.moveTo(startX, startY);
                slash.lineTo(endX, endY);
                slash.strokePath();

                slash.lineStyle(3, 0xffffff, 1);
                slash.beginPath();
                slash.moveTo(startX, startY);
                slash.lineTo(endX, endY);
                slash.strokePath();

                this.tweens.add({
                  targets: slash,
                  alpha: 0,
                  scaleX: 1.25,
                  scaleY: 1.25,
                  duration: 220,
                  ease: "Cubic.easeOut",
                  onComplete: () => slash.destroy(),
                });
                break;
              }

              case "shard-rain": {
                const shard = this.add.graphics();
                shard.setDepth(30);
                const spawnX = target.x - 30 + hitIndex * 22;
                const spawnY = target.y - 120;
                const landX = target.x - 15 + hitIndex * 12;
                const landY = target.y + (hitIndex % 2 === 0 ? -10 : 15);

                shard.setPosition(spawnX, spawnY);
                shard.fillStyle(0xc084fc, 0.95);
                shard.fillTriangle(-4, -18, 4, -18, 0, 18);
                shard.fillStyle(0xffffff, 1);
                shard.fillTriangle(-2, -12, 2, -12, 0, 12);
                shard.setRotation(0.35);

                this.tweens.add({
                  targets: shard,
                  x: landX,
                  y: landY,
                  duration: 110,
                  ease: "Quad.easeIn",
                  onComplete: () => {
                    shard.destroy();
                    const ring = this.add.graphics();
                    ring.setDepth(30);
                    ring.setPosition(landX, landY);
                    ring.lineStyle(3, 0x38bdf8, 1);
                    ring.strokeCircle(0, 0, 8);
                    this.tweens.add({
                      targets: ring,
                      scaleX: 2.2,
                      scaleY: 2.2,
                      alpha: 0,
                      duration: 160,
                      onComplete: () => ring.destroy(),
                    });
                  },
                });
                break;
              }

              case "echo-call": {
                this.summons.forEach((summon, idx) => {
                  if (!summon.active) return;
                  const aura = this.add.graphics();
                  aura.setDepth(15);
                  aura.setPosition(summon.x, summon.y + 10);
                  aura.fillStyle(0x8b5cf6, 0.5);
                  aura.fillEllipse(0, 0, 36, 14);
                  this.tweens.add({
                    targets: aura,
                    scaleX: 1.8,
                    scaleY: 1.8,
                    alpha: 0,
                    duration: 350,
                    onComplete: () => aura.destroy(),
                  });

                  const bolt = this.add.graphics();
                  bolt.setDepth(28);
                  bolt.setPosition(summon.x, summon.y - 15);
                  bolt.fillStyle(0x7c3aed, 0.9);
                  bolt.fillCircle(0, 0, 9);
                  bolt.fillStyle(0x38bdf8, 1);
                  bolt.fillCircle(0, 0, 4);

                  this.tweens.add({
                    targets: bolt,
                    x: target.x,
                    y: target.y - 10 + idx * 8,
                    duration: 180 + idx * 40,
                    ease: "Cubic.easeIn",
                    onComplete: () => {
                      bolt.destroy();
                      const impact = this.add.graphics();
                      impact.setDepth(29);
                      impact.setPosition(target.x, target.y - 10);
                      impact.fillStyle(0xa855f7, 0.7);
                      impact.fillCircle(0, 0, 16);
                      this.tweens.add({
                        targets: impact,
                        scaleX: 1.9,
                        scaleY: 1.9,
                        alpha: 0,
                        duration: 200,
                        onComplete: () => impact.destroy(),
                      });
                    },
                  });
                });
                break;
              }

              case "seam-step": {
                if (this.hero) {
                  const barrier = this.add.graphics();
                  barrier.setDepth(25);
                  barrier.setPosition(this.hero.x, this.hero.y);
                  barrier.lineStyle(3, 0x38bdf8, 0.9);
                  barrier.strokeCircle(0, -10, 38);
                  barrier.fillStyle(0x0284c7, 0.2);
                  barrier.fillCircle(0, -10, 38);

                  this.tweens.add({
                    targets: barrier,
                    scaleX: 1.3,
                    scaleY: 1.3,
                    alpha: 0,
                    duration: 400,
                    ease: "Quad.easeOut",
                    onComplete: () => barrier.destroy(),
                  });

                  this.tweens.add({
                    targets: [this.hero, this.heroShadow].filter(Boolean),
                    alpha: 0.35,
                    duration: 70,
                    yoyo: true,
                    repeat: 2,
                  });
                }
                break;
              }

              case "last-meridian": {
                this.cameras.main.shake(320, 0.016);
                const beam = this.add.graphics();
                beam.setDepth(35);
                beam.fillStyle(0x6366f1, 0.65);
                beam.fillRect(target.x - 24, 0, 48, target.y + 40);
                beam.fillStyle(0x38bdf8, 0.9);
                beam.fillRect(target.x - 12, 0, 24, target.y + 40);
                beam.fillStyle(0xffffff, 1);
                beam.fillRect(target.x - 4, 0, 8, target.y + 40);

                this.tweens.add({
                  targets: beam,
                  alpha: 0,
                  duration: 380,
                  ease: "Quad.easeOut",
                  onComplete: () => beam.destroy(),
                });

                const shockwave = this.add.graphics();
                shockwave.setDepth(34);
                shockwave.setPosition(target.x, target.y + 20);
                shockwave.lineStyle(5, 0x38bdf8, 1);
                shockwave.strokeEllipse(0, 0, 80, 28);
                shockwave.lineStyle(2, 0xffffff, 1);
                shockwave.strokeEllipse(0, 0, 50, 18);

                this.tweens.add({
                  targets: shockwave,
                  scaleX: 2.2,
                  scaleY: 2.2,
                  alpha: 0,
                  duration: 350,
                  ease: "Cubic.easeOut",
                  onComplete: () => shockwave.destroy(),
                });
                break;
              }
            }
          }

          private queueHitReaction(event: IdleRpgHitEvent) {
            const sourceState: IdleRpgAnimationState = event.source === "hero"
              ? event.skillId === "last-meridian" ? "ultimate" : event.skillId ? "skill" : "attack"
              : event.source === "enemy" || event.skillId !== "echo-call"
                ? "attack"
                : "skill";
            const sourceActorId = event.source === "hero"
              ? HERO_ACTOR_ID
              : event.source === "enemy"
                ? getEnemyActorId(modelRef.current)
                : event.source;
            const hitIndex = this.actionHitCounts.get(event.source) ?? 0;
            this.actionHitCounts.set(event.source, hitIndex + 1);
            const impactDelayMs = getActorAnimationMarkerDelayMs(sourceActorId, sourceState, "impact") ?? 0;
            const multiHitDelayMs = event.skillId === "shard-rain" ? hitIndex * SHARD_RAIN_HIT_SPACING_MS : 0;
            const delayMs = Math.max(0, Math.round(impactDelayMs + multiHitDelayMs));
            const encounterSerial = this.activeEncounter;
            let timer!: Phaser.Time.TimerEvent;
            timer = this.time.delayedCall(delayMs, () => {
              this.pendingHitReactions.delete(timer);
              if (this.activeEncounter !== encounterSerial) return;
              const targetSprite = event.target === "enemy" ? this.enemy : this.hero;
              if (!targetSprite?.active) return;

              if (event.skillId === "shard-rain" && hitIndex > 0) {
                this.triggerSkillFX("shard-rain", hitIndex);
                playSkillShardSfx(hitIndex);
              }

              playIdleHitSfx(event.target, event.critical);
              this.emitHitSparks(
                targetSprite.x,
                targetSprite.y - 10,
                event.critical,
                event.source === "hero" ? 0x38bdf8 : 0xaa55ff,
              );

              this.showDamageLabel(targetSprite, event.damage, event.critical, event.source, event.target);
              if (!modelRef.current.reducedMotion) {
                if (event.skillId === "last-meridian") {
                  this.cameras.main.shake(240, 0.014);
                } else if (event.critical) {
                  this.cameras.main.shake(120, 0.007);
                }
              }
              if (modelRef.current.phase !== "fighting") return;
              if (event.target === "enemy") {
                this.playEnemyAnimation("hit", true, undefined, true);
              } else {
                this.playActorAnimation(this.hero, HERO_ACTOR_ID, "hit", true, undefined, true);
              }
              this.flashSprite(targetSprite, event.critical);
            });
            this.pendingHitReactions.add(timer);
          }

          private showDamageLabel(
            sprite: Phaser.GameObjects.Sprite,
            damage: number,
            critical: boolean,
            source: "hero" | "enemy" | IdleRpgSummonId = "hero",
            target: "hero" | "enemy" = "enemy",
          ) {
            const label = this.damageLabels[this.damageLabelCursor % this.damageLabels.length];
            this.damageLabelCursor += 1;
            if (!label) return;
            this.tweens.killTweensOf(label);
            const isSummon = source !== "hero" && source !== "enemy";
            const isEnemyAttack = target === "hero";
            const jitterX = (Math.random() - 0.5) * 28;
            const startY = sprite.y - Math.max(52, sprite.displayHeight * 0.46) + (Math.random() - 0.5) * 12;

            let prefix = "";
            let color = "#ffffff";
            let fontSize = 18;
            if (isEnemyAttack) {
              prefix = "-";
              color = "#ff4d68";
              fontSize = critical ? 22 : 18;
            } else if (isSummon) {
              prefix = "⚡ ";
              color = "#5eead4";
              fontSize = 17;
            } else if (critical) {
              prefix = "✦ ";
              color = "#fde047";
              fontSize = 23;
            }

            label
              .setText(`${prefix}${Math.max(0, Math.round(damage))}`)
              .setColor(color)
              .setFontSize(fontSize)
              .setPosition(sprite.x + jitterX, startY)
              .setScale(critical ? 1.2 : 1)
              .setAlpha(1)
              .setVisible(true);
            this.tweens.add({
              targets: label,
              y: startY - (modelRef.current.reducedMotion ? 0 : 32),
              alpha: 0,
              duration: modelRef.current.reducedMotion ? 260 : 520,
              ease: "Cubic.easeOut",
              onComplete: () => label.setVisible(false),
            });
          }

          private clearPendingHitReactions() {
            this.pendingHitReactions.forEach((timer) => timer.remove(false));
            this.pendingHitReactions.clear();
            this.actionHitCounts.clear();
            this.damageLabels.forEach((label) => {
              this.tweens.killTweensOf(label);
              label.setVisible(false);
            });
          }

          private flashSprite(sprite?: Phaser.GameObjects.Sprite, critical = false) {
            if (!sprite) return;
            const now = this.time.now;
            if (now - (this.lastFlashAt.get(sprite) ?? Number.NEGATIVE_INFINITY) < HIT_FLASH_COOLDOWN_MS) return;
            this.lastFlashAt.set(sprite, now);
            sprite
              .setTint(critical ? 0xfff1a8 : 0xff866e)
              .setTintMode(PhaserLib.TintModes.FILL);
            this.time.delayedCall(modelRef.current.reducedMotion ? 35 : 70, () => {
              if (sprite.active) sprite.clearTint();
            });
          }
        }

        game = new PhaserLib.Game({
          type: PhaserLib.AUTO,
          parent: host,
          width: host.clientWidth || STAGE_WIDTH,
          height: host.clientHeight || STAGE_HEIGHT,
          transparent: true,
          pixelArt: true,
          antialias: false,
          roundPixels: true,
          render: {
            antialias: false,
            pixelArt: true,
            roundPixels: true,
          },
          scale: {
            mode: PhaserLib.Scale.RESIZE,
            autoCenter: PhaserLib.Scale.CENTER_BOTH,
          },
          audio: { noAudio: true },
          scene: IdleRpgBattleScene,
        });
        unsubscribeEvents = subscribeEvents?.((event) => renderScene?.renderEvent(event)) ?? null;
      })
      .catch(() => {
        if (!disposed) setRendererFailed(true);
      });

    return () => {
      disposed = true;
      unsubscribeEvents?.();
      renderScene = null;
      game?.destroy(true);
      host.replaceChildren();
    };
  }, [activeSummonKey, environmentKey, realmAtlasUrl, subscribeEvents, model.graphicsQuality]);

  return (
    <div className={`irpg-battle-stage ${className}`} aria-label="Scena automatycznej walki">
      {rendererFailed ? (
        <img
          className="irpg-stage-fallback-image"
          src={fallbackBackdropUrl}
          alt={`Tło krainy ${environmentKey}`}
        />
      ) : null}
      <div ref={hostRef} className="irpg-phaser-host" aria-hidden="true" />
    </div>
  );
}
