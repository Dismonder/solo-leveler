import { useEffect, useMemo, useRef } from "react";
import Phaser from "phaser";
import {
  getSpriteAnimationDefinition,
  getSpriteSheetFilename,
  SPRITE_SOURCE_FRAME_SIZE,
  type SpriteActorAnimation,
  type SpriteActorKind,
} from "../game/spriteAnimation";

export type PhaserStageTheme = "cyan" | "orange" | "violet" | "combat";

export type PhaserStageActor = {
  id: string;
  kind: SpriteActorKind;
  animation: SpriteActorAnimation;
  x: number;
  y: number;
  facing?: "left" | "right";
  slot?: "gameplay" | "combat";
  scale?: number;
  alpha?: number;
  depth?: number;
  eventKey?: string | null;
};

export type PhaserStageShard = {
  id: number | string;
  kind?: "shard" | "spear";
  x: number;
  y: number;
  vx?: number;
  vy?: number;
  size?: number;
};

export type PhaserStageBeam = {
  id: number | string;
  axis: "x" | "y";
  pos: number;
  age: number;
  warning: number;
  width: number;
};

export type PhaserStageOrb = {
  id: number | string;
  kind: "shield" | "surge";
  x: number;
  y: number;
};

export type PhaserStageHazard = {
  id: number | string;
  x: number;
  y: number;
  radius: number;
  age?: number;
  warning?: number;
};

export type PhaserStageSafeZone = {
  x: number;
  y: number;
  radius: number;
  active?: boolean;
};

export type PhaserStageModel = {
  sceneId: "gate-dodge" | "penalty" | "shadow-strike" | "combat" | "rpg-world";
  theme: PhaserStageTheme;
  actors: PhaserStageActor[];
  shards?: PhaserStageShard[];
  beams?: PhaserStageBeam[];
  orbs?: PhaserStageOrb[];
  hazards?: PhaserStageHazard[];
  safeZone?: PhaserStageSafeZone | null;
  portal?: boolean;
  floorHeight?: number;
  backdropAlpha?: number;
  gridAlpha?: number;
};

const actorSheetModules = import.meta.glob<string>("../assets/models/actors/*.png", {
  eager: true,
  query: "?url",
  import: "default",
});

const actorSheetUrls = Object.fromEntries(
  Object.entries(actorSheetModules).map(([path, url]) => [path.split("/").pop()?.replace(/\.png$/, "") ?? path, url])
);

const tone = {
  cyan: { main: 0x22d3ee, alt: 0x2563eb, dark: 0x07101f, danger: 0xef4444 },
  orange: { main: 0xfb923c, alt: 0xf97316, dark: 0x1b0d08, danger: 0xef4444 },
  violet: { main: 0xa855f7, alt: 0x22d3ee, dark: 0x080712, danger: 0xef4444 },
  combat: { main: 0x22d3ee, alt: 0x8b5cf6, dark: 0x070b14, danger: 0xef4444 },
} satisfies Record<PhaserStageTheme, Record<string, number>>;

export function PhaserActionStage({ model, className = "" }: { model: PhaserStageModel; className?: string }) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const sceneRef = useRef<ActionStageScene | null>(null);
  const gameRef = useRef<Phaser.Game | null>(null);
  const initialModel = useMemo(() => model, []);

  useEffect(() => {
    if (!containerRef.current || gameRef.current) return;
    const scene = new ActionStageScene(initialModel);
    sceneRef.current = scene;
    gameRef.current = new Phaser.Game({
      type: Phaser.AUTO,
      parent: containerRef.current,
      width: containerRef.current.clientWidth || 960,
      height: containerRef.current.clientHeight || 540,
      transparent: true,
      backgroundColor: "#000000",
      scene,
      scale: {
        mode: Phaser.Scale.RESIZE,
        autoCenter: Phaser.Scale.NO_CENTER,
      },
      render: {
        antialias: true,
        pixelArt: false,
        transparent: true,
      },
      audio: {
        noAudio: true,
      },
    });

    return () => {
      gameRef.current?.destroy(true);
      gameRef.current = null;
      sceneRef.current = null;
    };
  }, [initialModel]);

  useEffect(() => {
    sceneRef.current?.setModel(model);
  }, [model]);

  return <div ref={containerRef} className={`sl-phaser-stage ${className}`} aria-hidden="true" />;
}

class ActionStageScene extends Phaser.Scene {
  private model: PhaserStageModel;
  private graphics!: Phaser.GameObjects.Graphics;
  private actors = new Map<string, ActorController>();

  constructor(model: PhaserStageModel) {
    super({ key: `sl-action-stage-${model.sceneId}-${Math.random().toString(36).slice(2)}` });
    this.model = model;
  }

  setModel(model: PhaserStageModel) {
    this.model = model;
  }

  preload() {
    for (const [key, url] of Object.entries(actorSheetUrls)) {
      this.load.spritesheet(key, url, {
        frameWidth: SPRITE_SOURCE_FRAME_SIZE,
        frameHeight: SPRITE_SOURCE_FRAME_SIZE,
      });
    }
  }

  create() {
    this.graphics = this.add.graphics();
  }

  update() {
    this.syncActors();
    this.drawStage();
  }

  private syncActors() {
    const live = new Set(this.model.actors.map((actor) => actor.id));
    for (const [id, actor] of this.actors) {
      if (!live.has(id)) {
        actor.destroy();
        this.actors.delete(id);
      }
    }

    for (const actorModel of this.model.actors) {
      let actor = this.actors.get(actorModel.id);
      if (!actor) {
        actor = new ActorController(this, actorModel);
        this.actors.set(actorModel.id, actor);
      }
      actor.apply(actorModel, this.scale.width, this.scale.height);
    }
  }

  private drawStage() {
    const width = this.scale.width;
    const height = this.scale.height;
    const palette = tone[this.model.theme];
    this.graphics.clear();

    const backdropAlpha = this.model.backdropAlpha ?? 0.72;
    if (backdropAlpha > 0) {
      this.graphics.fillStyle(palette.dark, backdropAlpha);
      this.graphics.fillRect(0, 0, width, height);
    }
    this.drawGrid(width, height, palette.main, this.model.gridAlpha ?? 0.07);

    this.graphics.fillStyle(palette.alt, 0.11);
    this.graphics.fillRect(0, height * (1 - (this.model.floorHeight ?? 0.16)), width, height * (this.model.floorHeight ?? 0.16));

    if (this.model.portal) this.drawPortal(width, height, palette.main);
    if (this.model.safeZone) this.drawSafeZone(this.model.safeZone, width, height);
    for (const hazard of this.model.hazards ?? []) this.drawHazard(hazard, width, height);
    for (const beam of this.model.beams ?? []) this.drawBeam(beam, width, height);
    for (const shard of this.model.shards ?? []) this.drawShard(shard, width, height);
    for (const orb of this.model.orbs ?? []) this.drawOrb(orb, width, height);
    for (const actor of this.model.actors) this.drawActorAura(actor, width, height);
  }

  private drawGrid(width: number, height: number, color: number, alpha: number) {
    this.graphics.lineStyle(1, color, alpha);
    const step = Math.max(24, Math.min(42, width / 32));
    for (let x = 0; x < width; x += step) this.graphics.lineBetween(x, 0, x, height);
    for (let y = 0; y < height; y += step) this.graphics.lineBetween(0, y, width, y);
    this.graphics.lineStyle(1, color, 0.22);
    this.graphics.strokeRect(1, 1, width - 2, height - 2);
  }

  private drawPortal(width: number, height: number, color: number) {
    const x = width * 0.5;
    const y = height * 0.52;
    const size = Math.min(width, height) * 0.18;
    const pulse = 0.55 + Math.sin(this.time.now / 380) * 0.18;
    this.graphics.lineStyle(2, color, 0.1 * pulse);
    for (let i = 0; i < 4; i += 1) {
      const s = size * (1 - i * 0.19);
      this.graphics.strokeRect(x - s / 2, y - s / 2, s, s);
    }
  }

  private drawSafeZone(zone: PhaserStageSafeZone, width: number, height: number) {
    const x = toX(zone.x, width);
    const y = toY(zone.y, height);
    const radius = (zone.radius / 100) * Math.min(width, height);
    this.graphics.fillStyle(0x22d3ee, zone.active ? 0.16 : 0.08);
    this.graphics.lineStyle(2, 0x67e8f9, zone.active ? 0.56 : 0.32);
    this.graphics.beginPath();
    for (let i = 0; i < 6; i += 1) {
      const angle = -Math.PI / 2 + (i / 6) * Math.PI * 2;
      const px = x + Math.cos(angle) * radius;
      const py = y + Math.sin(angle) * radius;
      if (i === 0) this.graphics.moveTo(px, py);
      else this.graphics.lineTo(px, py);
    }
    this.graphics.closePath();
    this.graphics.fillPath();
    this.graphics.strokePath();
  }

  private drawHazard(hazard: PhaserStageHazard, width: number, height: number) {
    const active = (hazard.age ?? 0) >= (hazard.warning ?? 0);
    const radius = (hazard.radius / 100) * Math.min(width, height);
    this.graphics.fillStyle(active ? 0xef4444 : 0xfb923c, active ? 0.22 : 0.09);
    this.graphics.lineStyle(2, active ? 0xef4444 : 0xfb923c, active ? 0.6 : 0.32);
    this.graphics.strokeCircle(toX(hazard.x, width), toY(hazard.y, height), radius);
    this.graphics.fillCircle(toX(hazard.x, width), toY(hazard.y, height), radius);
  }

  private drawBeam(beam: PhaserStageBeam, width: number, height: number) {
    const active = beam.age >= beam.warning;
    this.graphics.fillStyle(active ? 0xef4444 : 0xef4444, active ? 0.42 : 0.14);
    if (beam.axis === "x") {
      const x = toX(beam.pos, width);
      const w = (beam.width / 100) * width;
      this.graphics.fillRect(x - w / 2, 0, w, height);
    } else {
      const y = toY(beam.pos, height);
      const h = (beam.width / 100) * height;
      this.graphics.fillRect(0, y - h / 2, width, h);
    }
  }

  private drawShard(shard: PhaserStageShard, width: number, height: number) {
    const x = toX(shard.x, width);
    const y = toY(shard.y, height);
    const size = Math.max(8, (shard.size ?? 3) * Math.min(width, height) * 0.0065);
    this.graphics.fillStyle(0xef4444, 0.92);
    this.graphics.lineStyle(1, 0xffb4b4, 0.55);
    if (shard.kind === "spear") {
      const angle = Math.atan2(shard.vy ?? 1, shard.vx ?? 0) + Math.PI / 2;
      const points = [
        rotatePoint(0, -size * 1.9, angle, x, y),
        rotatePoint(size * 0.38, size * 1.4, angle, x, y),
        rotatePoint(-size * 0.38, size * 1.4, angle, x, y),
      ];
      this.graphics.fillPoints(points, true);
      this.graphics.strokePoints(points, true);
      return;
    }
    const points = [
      new Phaser.Math.Vector2(x, y - size),
      new Phaser.Math.Vector2(x + size, y),
      new Phaser.Math.Vector2(x, y + size),
      new Phaser.Math.Vector2(x - size, y),
    ];
    this.graphics.fillPoints(points, true);
    this.graphics.strokePoints(points, true);
  }

  private drawOrb(orb: PhaserStageOrb, width: number, height: number) {
    const color = orb.kind === "shield" ? 0x67e8f9 : 0xa855f7;
    const x = toX(orb.x, width);
    const y = toY(orb.y, height);
    const radius = Math.max(8, Math.min(width, height) * 0.014);
    this.graphics.fillStyle(color, 0.8);
    this.graphics.lineStyle(2, 0xffffff, 0.45);
    this.graphics.fillCircle(x, y, radius);
    this.graphics.strokeCircle(x, y, radius * (1.4 + Math.sin(this.time.now / 240) * 0.18));
  }

  private drawActorAura(actor: PhaserStageActor, width: number, height: number) {
    const x = toX(actor.x, width);
    const y = toY(actor.y, height);
    const color = actor.id === "hunter" ? 0x22d3ee : 0xef4444;
    const size = (actor.slot === "combat" ? 0.08 : 0.035) * Math.min(width, height) * (actor.scale ?? 1);
    this.graphics.fillStyle(color, actor.animation === "dash" ? 0.26 : 0.12);
    this.graphics.fillEllipse(x, y + 2, size * 2.2, size * 0.54);
    if (actor.animation === "dash") {
      this.graphics.lineStyle(2, color, 0.45);
      const dir = actor.facing === "left" ? 1 : -1;
      this.graphics.lineBetween(x + dir * size * 0.6, y - size * 1.4, x + dir * size * 3.2, y - size * 0.4);
    }
    if (actor.animation === "attack_1" || actor.animation === "attack_2" || actor.animation === "cast") {
      this.graphics.lineStyle(4, actor.animation === "cast" ? 0xa855f7 : 0x67e8f9, 0.36);
      const dir = actor.facing === "left" ? -1 : 1;
      this.graphics.beginPath();
      this.graphics.arc(x + dir * size * 1.4, y - size * 2.1, size * 1.7, -0.7, 0.7, false);
      this.graphics.strokePath();
    }
  }
}

class ActorController {
  private sprite: Phaser.GameObjects.Sprite;
  private animation: SpriteActorAnimation | null = null;
  private eventKey: string | null = null;
  private lockedUntil = 0;
  private facing: "left" | "right" = "right";

  constructor(private scene: ActionStageScene, model: PhaserStageActor) {
    const textureKey = getTextureKey(model.kind, "idle") ?? "hunter-idle";
    this.sprite = scene.add.sprite(0, 0, textureKey);
    this.sprite.setOrigin(0.5, 1);
    this.sprite.setDepth(model.depth ?? model.y);
  }

  apply(model: PhaserStageActor, width: number, height: number) {
    const now = this.scene.time.now;
    const x = toX(model.x, width);
    const y = toY(model.y, height);
    this.sprite.setPosition(x, y);
    this.sprite.setAlpha(model.alpha ?? 1);
    this.sprite.setDepth(model.depth ?? model.y);
    if (model.facing) this.facing = model.facing;
    this.sprite.setFlipX(this.facing === "left");

    const definition = getSpriteAnimationDefinition(model.kind, model.animation);
    const slotHeight = getSlotHeight(model.slot ?? "gameplay", width, height);
    const scale = (slotHeight / SPRITE_SOURCE_FRAME_SIZE) * definition.scale * (model.scale ?? 1);
    this.sprite.setScale(scale);

    const eventChanged = Boolean(model.eventKey && model.eventKey !== this.eventKey);
    const currentLocked = this.animation !== null && this.animation !== "idle" && this.animation !== "run" && now < this.lockedUntil;
    const onlyReturningToLoop = model.animation === "idle" || model.animation === "run";
    if (currentLocked && onlyReturningToLoop && !eventChanged) return;

    if (model.animation !== this.animation || eventChanged) {
      this.play(model.kind, model.animation, eventChanged);
      this.eventKey = model.eventKey ?? null;
    }
  }

  destroy() {
    this.sprite.destroy();
  }

  private play(kind: SpriteActorKind, animation: SpriteActorAnimation, restart: boolean) {
    const textureKey = getTextureKey(kind, animation);
    const animationKey = getAnimationKey(kind, animation);
    if (!textureKey || !actorSheetUrls[textureKey]) return;
    const definition = getSpriteAnimationDefinition(kind, animation);
    if (!this.scene.anims.exists(animationKey)) {
      this.scene.anims.create({
        key: animationKey,
        frames: this.scene.anims.generateFrameNumbers(textureKey, { start: 0, end: definition.frames - 1 }),
        frameRate: Math.max(1, definition.frames / (definition.durationMs / 1000)),
        repeat: definition.loop ? -1 : 0,
      });
    }
    if (restart) this.sprite.stop();
    this.sprite.play(animationKey, !restart);
    this.animation = animation;
    this.lockedUntil = definition.loop ? 0 : this.scene.time.now + definition.durationMs;
  }
}

function getSlotHeight(slot: NonNullable<PhaserStageActor["slot"]>, width: number, height: number) {
  const short = Math.min(width, height);
  if (slot === "combat") return Math.max(190, Math.min(330, height * 0.48));
  return Math.max(72, Math.min(136, short * 0.15));
}

function getTextureKey(kind: SpriteActorKind, animation: SpriteActorAnimation) {
  return getSpriteSheetFilename(kind, animation);
}

function getAnimationKey(kind: SpriteActorKind, animation: SpriteActorAnimation) {
  return `sl:${kind}:${animation}`;
}

function toX(value: number, width: number) {
  return (value / 100) * width;
}

function toY(value: number, height: number) {
  return (value / 100) * height;
}

function rotatePoint(x: number, y: number, angle: number, originX: number, originY: number) {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  return new Phaser.Math.Vector2(originX + x * cos - y * sin, originY + x * sin + y * cos);
}
