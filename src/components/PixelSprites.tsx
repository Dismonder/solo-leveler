import type { CSSProperties } from 'react';

export type PixelMonsterKind = 'goblin' | 'wolf' | 'mage' | 'boss' | 'shadow';

type SpriteSize = 'sm' | 'md' | 'lg' | 'xl';
type HunterTone = 'cyan' | 'orange' | 'violet';
type HunterPose = 'idle' | 'run' | 'dash' | 'attack' | 'guard' | 'hurt';

export function PixelHunterModel({
  size = 'md',
  tone = 'cyan',
  pose = 'idle',
  facing = 'right',
  className = '',
}: {
  size?: SpriteSize;
  tone?: HunterTone;
  pose?: HunterPose;
  facing?: 'left' | 'right';
  className?: string;
}) {
  return (
    <div className={`pixel-model pixel-hunter pixel-size-${size} pixel-tone-${tone} pixel-pose-${pose} ${className}`}>
      <div className="pixel-shadow-disc" />
      <div className={`pixel-model-core ${facing === 'left' ? 'pixel-facing-left' : ''}`}>
        <div className="pixel-aura-ring" />
        <div className="pixel-part pixel-cape" />
        <div className="pixel-part pixel-head" />
        <div className="pixel-part pixel-hair pixel-hair-main" />
        <div className="pixel-part pixel-hair pixel-hair-side" />
        <div className="pixel-part pixel-eye pixel-eye-left" />
        <div className="pixel-part pixel-eye pixel-eye-right" />
        <div className="pixel-part pixel-neck" />
        <div className="pixel-part pixel-torso" />
        <div className="pixel-part pixel-chest-core" />
        <div className="pixel-part pixel-shoulder pixel-shoulder-left" />
        <div className="pixel-part pixel-shoulder pixel-shoulder-right" />
        <div className="pixel-part pixel-arm pixel-arm-back" />
        <div className="pixel-part pixel-arm pixel-arm-front" />
        <div className="pixel-part pixel-hand pixel-hand-back" />
        <div className="pixel-part pixel-hand pixel-hand-front" />
        <div className="pixel-part pixel-belt" />
        <div className="pixel-part pixel-leg pixel-leg-back" />
        <div className="pixel-part pixel-leg pixel-leg-front" />
        <div className="pixel-part pixel-boot pixel-boot-back" />
        <div className="pixel-part pixel-boot pixel-boot-front" />
        <div className="pixel-part pixel-sword" />
        <div className="pixel-part pixel-sword-glint" />
      </div>
    </div>
  );
}

export function PixelMonsterModel({
  kind,
  size = 'md',
  active = false,
  className = '',
}: {
  kind: PixelMonsterKind;
  size?: SpriteSize;
  active?: boolean;
  className?: string;
}) {
  return (
    <div className={`pixel-model pixel-monster pixel-size-${size} pixel-monster-kind-${kind} ${active ? 'pixel-active' : ''} ${className}`}>
      <div className="pixel-shadow-disc" />
      <div className="pixel-model-core">
        <div className="monster-aura" />
        <div className="monster-part monster-horn monster-horn-left" />
        <div className="monster-part monster-horn monster-horn-right" />
        <div className="monster-part monster-head" />
        <div className="monster-part monster-eye monster-eye-left" />
        <div className="monster-part monster-eye monster-eye-right" />
        <div className="monster-part monster-jaw" />
        <div className="monster-part monster-torso" />
        <div className="monster-part monster-core" />
        <div className="monster-part monster-arm monster-arm-left" />
        <div className="monster-part monster-arm monster-arm-right" />
        <div className="monster-part monster-claw monster-claw-left" />
        <div className="monster-part monster-claw monster-claw-right" />
        <div className="monster-part monster-leg monster-leg-left" />
        <div className="monster-part monster-leg monster-leg-right" />
        <div className="monster-part monster-weapon" />
      </div>
    </div>
  );
}

export function PixelSlash({ tone = 'cyan', className = '' }: { tone?: 'cyan' | 'violet' | 'red' | 'orange'; className?: string }) {
  return <div className={`sl-pixel-slash sl-slash-${tone} ${className}`} />;
}

export function PixelImpact({ tone = 'cyan', className = '' }: { tone?: 'cyan' | 'red' | 'orange'; className?: string }) {
  return <div className={`sl-impact-burst sl-impact-${tone} ${className}`} />;
}

export function PixelShockwave({ tone = 'cyan', className = '' }: { tone?: 'cyan' | 'violet' | 'orange'; className?: string }) {
  return <div className={`sl-shockwave sl-shockwave-${tone} ${className}`} />;
}

export function GatePortal({ className = '', style }: { className?: string; style?: CSSProperties }) {
  return (
    <div className={`sl-gate-portal ${className}`} style={style}>
      <span />
      <span />
      <span />
    </div>
  );
}
