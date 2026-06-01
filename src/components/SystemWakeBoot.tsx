import { motion } from "motion/react";

type SystemWakeBootProps = {
  onDone: () => void;
};

export function SystemWakeBoot({ onDone }: SystemWakeBootProps) {
  return (
    <motion.div
      className="sl-app-root fixed inset-0 z-[180] flex items-center justify-center overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onAnimationComplete={() => {
        window.setTimeout(onDone, 1250);
      }}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_34%,color-mix(in_srgb,var(--theme-accent)_16%,transparent),transparent_42%)]" />
      <motion.div
        className="absolute h-[56vmin] w-[56vmin] rounded-full border border-[color-mix(in_srgb,var(--theme-accent)_34%,transparent)]"
        initial={{ scale: 0.72, opacity: 0 }}
        animate={{ scale: [0.72, 1.02, 0.96], opacity: [0, 1, 0.42] }}
        transition={{ duration: 1.25, ease: "easeOut" }}
      />
      <motion.div
        className="sl-modal relative w-[min(86vw,520px)] rounded-[28px] border p-7 text-center shadow-[0_0_80px_var(--theme-shadow)]"
        initial={{ y: 22, scale: 0.96, opacity: 0 }}
        animate={{ y: 0, scale: 1, opacity: 1 }}
        transition={{ duration: 0.36, ease: [0.22, 1, 0.36, 1] }}
      >
        <p className="sl-kicker font-mono text-[10px] font-black uppercase tracking-[0.35em]">
          System online
        </p>
        <h2 className="mt-3 text-3xl font-black uppercase tracking-[0.24em] text-[var(--theme-text-strong)]">
          Przebudzenie
        </h2>
        <div className="sl-progress-track mt-6 h-2 overflow-hidden rounded-full">
          <motion.div
            className="sl-progress-fill h-full rounded-full shadow-[0_0_18px_color-mix(in_srgb,var(--theme-accent)_62%,transparent)]"
            initial={{ width: "0%" }}
            animate={{ width: "100%" }}
            transition={{ duration: 1.05, ease: "easeInOut" }}
          />
        </div>
        <p className="sl-muted mt-4 font-mono text-[10px] uppercase tracking-[0.22em]">
          Synchronizacja statusu lowcy
        </p>
      </motion.div>
    </motion.div>
  );
}
