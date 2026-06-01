import { AnimatePresence, motion } from "motion/react";
import { Coins, Sparkles, Zap } from "lucide-react";
import type { RewardAnimationEvent } from "../types";

type RewardAnimationLayerProps = {
  events: RewardAnimationEvent[];
};

export function RewardAnimationLayer({ events }: RewardAnimationLayerProps) {
  const visibleEvents = events.filter((event) => event.source !== "mini-game").slice(-2);

  return (
    <div
      className="pointer-events-none fixed right-[max(10px,calc((100vw-560px)/2+10px))] top-[calc(env(safe-area-inset-top)+14px)] z-[120] flex max-w-[min(180px,calc(100vw-20px))] flex-col items-end gap-1.5"
      aria-live="polite"
      aria-atomic="false"
      style={{ pointerEvents: "none" }}
    >
      <AnimatePresence initial={false}>
        {visibleEvents.map((event, index) => {
          const isGold = event.type === "gold";
          const Icon = isGold ? Coins : Sparkles;
          const TrailIcon = isGold ? Zap : Sparkles;
          return (
            <motion.div
              key={event.id}
              initial={{ opacity: 0, x: 32, y: 12, scale: 0.86 }}
              animate={{ opacity: 1, x: 0, y: 0, scale: 1 }}
              exit={{ opacity: 0, x: 26, y: -18, scale: 0.94 }}
              transition={{ duration: 0.28, delay: index * 0.025, ease: [0.22, 1, 0.36, 1] }}
              className={[
                "relative overflow-hidden rounded-xl border px-2.5 py-1.5 font-mono shadow-2xl",
                isGold
                  ? "border-[color-mix(in_srgb,var(--theme-warning)_40%,transparent)] bg-[var(--theme-warning-soft)] text-[var(--theme-warning-text)]"
                  : "border-[color-mix(in_srgb,var(--theme-accent)_38%,transparent)] bg-[var(--theme-accent-soft)] text-[var(--theme-accent-text)]",
              ].join(" ")}
              style={{ pointerEvents: "none" }}
            >
              <span
                className={[
                  "pointer-events-none absolute -right-6 -top-8 h-16 w-16 rounded-full blur-2xl",
                  isGold ? "bg-[var(--theme-warning-soft)]" : "bg-[var(--theme-accent-soft)]",
                ].join(" ")}
              />
              <span className="relative flex items-center gap-2">
                <span
                  className={[
                    "grid h-7 w-7 shrink-0 place-items-center rounded-lg border",
                    isGold
                      ? "border-[color-mix(in_srgb,var(--theme-warning)_38%,transparent)] bg-[var(--theme-warning-soft)]"
                      : "border-[color-mix(in_srgb,var(--theme-accent)_36%,transparent)] bg-[var(--theme-accent-soft)]",
                  ].join(" ")}
                >
                  <Icon className="h-4 w-4" />
                </span>
                <span className="min-w-0">
                  <span className="block text-[9px] font-black uppercase tracking-[0.18em] opacity-70">
                    {event.source === "daily" ? "Quest" : event.source === "workout" ? "Plan" : event.source === "mini-game" ? "Gra" : "System"}
                  </span>
                  <span className="block whitespace-nowrap text-xs font-black uppercase tracking-[0.12em]">
                    +{event.amount} {isGold ? "Gold" : "XP"}
                  </span>
                </span>
                <TrailIcon className="h-3.5 w-3.5 opacity-55" />
              </span>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
