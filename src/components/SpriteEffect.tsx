import impactSheet from "../assets/sprites/effects/impact.svg";
import portalSheet from "../assets/sprites/effects/portal.svg";
import slashSheet from "../assets/sprites/effects/slash.svg";
import type { CSSProperties } from "react";

const effectSheets = {
  slash: { src: slashSheet, frames: 4, durationMs: 340 },
  impact: { src: impactSheet, frames: 4, durationMs: 360 },
  portal: { src: portalSheet, frames: 4, durationMs: 900 },
  reward: { src: impactSheet, frames: 4, durationMs: 620 },
} as const;

export function SpriteEffect({
  type,
  size = 120,
  className = "",
}: {
  type: keyof typeof effectSheets;
  size?: number;
  className?: string;
}) {
  const sheet = effectSheets[type];
  const sheetWidth = size * sheet.frames;
  const endOffset = size * (sheet.frames - 1);

  return (
    <div
      className={`sl-sprite-effect ${className}`}
      style={
        {
          width: size,
          height: size,
          "--sprite-frame-width": `${size}px`,
          "--sprite-frame-height": `${size}px`,
          "--sprite-sheet-width": `${sheetWidth}px`,
          "--sprite-end": `-${endOffset}px`,
          "--sprite-duration": `${sheet.durationMs}ms`,
        } as CSSProperties
      }
    >
      <img src={sheet.src} alt="" draggable={false} className={`sl-sprite-img sl-sprite-frames-${sheet.frames}`} />
    </div>
  );
}
