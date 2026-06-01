import { useEffect, useMemo, useState } from "react";
import { motion } from "motion/react";

type WorkoutStartCountdownProps = {
  onComplete: () => void;
  onCancel: () => void;
};

const COUNTDOWN_STEPS = ["3", "2", "1", "START"];

export function WorkoutStartCountdown({ onComplete, onCancel }: WorkoutStartCountdownProps) {
  const [index, setIndex] = useState(0);
  const label = COUNTDOWN_STEPS[Math.min(index, COUNTDOWN_STEPS.length - 1)];
  const isStart = label === "START";

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      if (index >= COUNTDOWN_STEPS.length - 1) {
        onComplete();
        return;
      }
      setIndex((value) => value + 1);
    }, isStart ? 720 : 820);
    return () => window.clearTimeout(timeout);
  }, [index, isStart, onComplete]);

  const rings = useMemo(() => [0, 1, 2], []);

  return (
    <div className="sl-modal-backdrop fixed inset-0 z-[160] flex items-center justify-center overflow-hidden p-5">
      <button
        type="button"
        onClick={onCancel}
        className="sl-button-secondary absolute right-4 top-[calc(env(safe-area-inset-top)+16px)] rounded-2xl border px-4 py-2 text-xs font-black uppercase tracking-widest active:scale-[0.98]"
      >
        Anuluj
      </button>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,var(--theme-accent-soft),transparent_38%)]" />
      {rings.map((ring) => (
        <motion.div
          key={ring}
          className="absolute h-[44vmin] w-[44vmin] rounded-full border border-[color-mix(in_srgb,var(--theme-accent)_24%,transparent)]"
          initial={{ scale: 0.7, opacity: 0 }}
          animate={{ scale: [0.7, 1.3 + ring * 0.18], opacity: [0.5, 0] }}
          transition={{ duration: 1.45, repeat: Infinity, delay: ring * 0.22, ease: "easeOut" }}
        />
      ))}
      <motion.div
        key={label}
        initial={{ scale: 0.42, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 1.4, opacity: 0 }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        className="sl-modal relative rounded-[32px] border px-12 py-8 text-center shadow-[0_0_90px_var(--theme-shadow)]"
      >
        <p className="sl-kicker font-mono text-[10px] font-black uppercase tracking-[0.35em]">
          Plan treningowy
        </p>
        <div className="mt-3 text-7xl font-black uppercase tracking-[0.18em] text-[var(--theme-text-strong)]">
          {label}
        </div>
      </motion.div>
    </div>
  );
}
