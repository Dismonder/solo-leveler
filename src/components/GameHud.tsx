import React from "react";

type HudMeterTone = "cyan" | "red" | "orange" | "violet" | "emerald";

const toneVar: Record<HudMeterTone, string> = {
  cyan: "var(--theme-accent)",
  red: "var(--theme-danger)",
  orange: "var(--theme-warning)",
  violet: "var(--theme-focus)",
  emerald: "var(--theme-success)",
};

export function HudMeter({
  label,
  value,
  max,
  tone = "cyan",
  rightLabel,
}: {
  label: string;
  value: number;
  max: number;
  tone?: HudMeterTone;
  rightLabel?: React.ReactNode;
}) {
  const percentage = max <= 0 ? 0 : Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div className="min-w-0 font-mono text-[10px] uppercase tracking-widest text-[var(--theme-muted)]">
      <div className="mb-1 flex items-center justify-between gap-3">
        <span>{label}</span>
        <span className="text-[var(--theme-text)]">{rightLabel ?? `${Math.ceil(value)} / ${Math.ceil(max)}`}</span>
      </div>
      <div className="sl-progress-track h-2 overflow-hidden border border-[var(--theme-border)]">
        <div
          className="h-full transition-[width] duration-200"
          style={{ width: `${percentage}%`, background: toneVar[tone], boxShadow: `0 0 12px ${toneVar[tone]}` }}
        />
      </div>
    </div>
  );
}

export function HudBadge({ children, tone = "cyan" }: { children: React.ReactNode; tone?: HudMeterTone }) {
  const color = toneVar[tone];
  return (
    <span
      className="border px-2 py-1 font-mono text-[9px] font-black uppercase tracking-widest"
      style={{
        borderColor: `color-mix(in srgb, ${color} 45%, transparent)`,
        background: `color-mix(in srgb, ${color} 14%, var(--theme-input))`,
        color: "var(--theme-text)",
      }}
    >
      {children}
    </span>
  );
}
