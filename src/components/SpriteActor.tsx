import hunterModel from "../assets/models/hunter-shadow-armor.png";
import golemModel from "../assets/models/monster-abyssal-core-golem.png";
import mageModel from "../assets/models/monster-abyss-mage-wraith.png";
import spiderModel from "../assets/models/monster-corrupted-spider-queen.png";
import knightModel from "../assets/models/monster-dreadwing-knight.png";
import wolfModel from "../assets/models/monster-shadow-spike-wolf.png";
import assassinModel from "../assets/models/monster-voidstalker-assassin.png";
import wormModel from "../assets/models/penalty-worm-run.png";
import {
  getFallbackAnimation,
  getModelFrameSize,
  getSpriteAnimationDefinition,
  getSpriteSheetFilename,
  type SpriteActorAnimation,
  type SpriteActorKind,
  type SpriteActorSize,
  type SpriteActorSlot,
  type SpriteAnimationDefinition,
} from "../game/spriteAnimation";
import { useFrameAnimation } from "../hooks/useFrameAnimation";
import { PixelHunterModel, PixelMonsterKind, PixelMonsterModel } from "./PixelSprites";
import { useState, type CSSProperties } from "react";

export type { SpriteActorAnimation, SpriteActorKind, SpriteActorSize, SpriteActorSlot };

type AnimatedModelSheet = SpriteAnimationDefinition & { src: string };

const actorSheetModules = import.meta.glob<string>("../assets/models/actors/*.png", {
  eager: true,
  query: "?url",
  import: "default",
});

function actorSheet(name: string) {
  return actorSheetModules[`../assets/models/actors/${name}.png`];
}

const staticModels: Partial<Record<SpriteActorKind, string>> = {
  hunter: hunterModel,
  goblin: assassinModel,
  goblin_archer: assassinModel,
  goblin_assassin: assassinModel,
  wolf: wolfModel,
  young_wolf: wolfModel,
  mage: mageModel,
  boss: golemModel,
  shadow: assassinModel,
  assassin: assassinModel,
  golem: golemModel,
  wraith: mageModel,
  knight: knightModel,
  spider: spiderModel,
  young_spider: spiderModel,
  worm: wormModel,
  slime_cursed: mageModel,
  skeleton_shield: knightModel,
};

function toPixelKind(kind: SpriteActorKind): PixelMonsterKind {
  if (kind === "wolf" || kind === "young_wolf") return "wolf";
  if (kind === "mage" || kind === "wraith" || kind === "slime_cursed") return "mage";
  if (kind === "boss" || kind === "golem" || kind === "knight" || kind === "spider" || kind === "young_spider" || kind === "skeleton_shield") return "boss";
  if (kind === "worm" || kind === "shadow") return "shadow";
  return "goblin";
}

function getAnimatedModelSheet(kind: SpriteActorKind, animation: SpriteActorAnimation): AnimatedModelSheet | null {
  const filename = getSpriteSheetFilename(kind, animation);
  if (!filename) return null;
  const src = actorSheet(filename);
  if (!src) return null;

  return {
    src,
    ...getSpriteAnimationDefinition(kind, animation),
  };
}

export function SpriteActor({
  kind,
  animation = "idle",
  size = "md",
  slot = "gameplay",
  facing = "right",
  className = "",
  fallback = false,
}: {
  kind: SpriteActorKind;
  animation?: SpriteActorAnimation;
  size?: SpriteActorSize;
  slot?: SpriteActorSlot;
  facing?: "left" | "right";
  className?: string;
  fallback?: boolean;
}) {
  const [assetFailed, setAssetFailed] = useState(false);

  if (fallback || assetFailed) {
    if (kind === "hunter") {
      return <PixelHunterModel size={size} pose={getFallbackAnimation(animation)} facing={facing} className={className} />;
    }
    return <PixelMonsterModel kind={toPixelKind(kind)} size={size} active={animation === "attack_1" || animation === "attack_2"} className={className} />;
  }

  const animatedModelSheet = getAnimatedModelSheet(kind, animation);
  if (animatedModelSheet) {
    return (
      <AnimatedModelActor
        kind={kind}
        animation={animation}
        size={size}
        slot={slot}
        facing={facing}
        className={className}
        sheet={animatedModelSheet}
        modelFrame={getModelFrameSize(size, slot)}
        onAssetFailed={() => setAssetFailed(true)}
      />
    );
  }

  const staticModel = staticModels[kind];
  if (!staticModel) {
    return <PixelMonsterModel kind={toPixelKind(kind)} size={size} active={animation === "attack_1" || animation === "attack_2"} className={className} />;
  }

  const modelFrame = getModelFrameSize(size, slot);
  return (
    <div
      className={`sl-sprite-actor sl-model-actor sl-sprite-${size} sl-model-slot-${slot} sl-model-kind-${kind} sl-model-anim-${animation} ${facing === "left" ? "sl-sprite-facing-left" : ""} ${className}`}
      style={{ width: modelFrame, height: modelFrame } as CSSProperties}
    >
      <img src={staticModel} alt="" draggable={false} onError={() => setAssetFailed(true)} className="sl-model-img" />
    </div>
  );
}

function AnimatedModelActor({
  kind,
  animation,
  size,
  slot,
  facing,
  className,
  sheet,
  modelFrame,
  onAssetFailed,
}: {
  kind: SpriteActorKind;
  animation: SpriteActorAnimation;
  size: SpriteActorSize;
  slot: SpriteActorSlot;
  facing: "left" | "right";
  className: string;
  sheet: AnimatedModelSheet;
  modelFrame: number;
  onAssetFailed: () => void;
}) {
  const currentFrame = useFrameAnimation(`${kind}:${animation}:${sheet.src}`, sheet);
  const frameOffset = modelFrame * currentFrame;
  const sheetWidth = modelFrame * sheet.frames;

  return (
    <div
      className={`sl-sprite-actor sl-model-actor sl-model-sheet-actor sl-sprite-${size} sl-model-slot-${slot} sl-model-kind-${kind} sl-model-anim-${animation} sl-sprite-frames-${sheet.frames} ${facing === "left" ? "sl-sprite-facing-left" : ""} ${className}`}
      style={{
        width: modelFrame,
        height: modelFrame,
        "--sprite-frame-width": `${modelFrame}px`,
        "--sprite-frame-height": `${modelFrame}px`,
        "--sprite-sheet-width": `${sheetWidth}px`,
        "--sprite-current-offset": `-${frameOffset}px`,
        "--sprite-duration": `${sheet.durationMs}ms`,
        "--sprite-hit-frame": sheet.hitFrame ?? -1,
        "--model-scale": sheet.scale,
      } as CSSProperties}
      data-source={sheet.source}
      data-sheet={sheet.sheet}
      data-motion-profile={sheet.motionProfile}
    >
      <div className="sl-model-motion">
        <div className="sl-model-frame-window">
          <img
            src={sheet.src}
            alt=""
            draggable={false}
            onError={onAssetFailed}
            className="sl-model-img sl-model-sheet-img"
            style={{ transform: `translate3d(-${frameOffset}px, 0, 0)` }}
          />
        </div>
      </div>
    </div>
  );
}
