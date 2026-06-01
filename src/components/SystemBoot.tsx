import React from "react";
import { motion } from "motion/react";

const BOOT_LINES = [
  "[SYSTEM] Inicjalizacja rdzenia łowcy...",
  "[GATE] Skanowanie sygnatury many...",
  "[STATUS] Synchronizacja rang E-D-C-B-A-S-SS...",
  "[READY] Przebudzenie dostępne.",
];

export function SystemBoot({ onComplete }: { onComplete: () => void }) {
  const completeRef = React.useRef(onComplete);

  React.useEffect(() => {
    completeRef.current = onComplete;
  }, [onComplete]);

  React.useEffect(() => {
    const complete = () => completeRef.current();
    const timeout = window.setTimeout(complete, 2250);
    const fallback = window.setTimeout(complete, 4200);
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Enter" || event.key === " ") complete();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.clearTimeout(timeout);
      window.clearTimeout(fallback);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.04, filter: "blur(8px)" }}
      transition={{ duration: 0.45 }}
      className="fixed inset-0 z-[100] flex min-h-[100dvh] items-center justify-center overflow-hidden bg-black px-4 py-[max(24px,env(safe-area-inset-top))] font-mono text-cyan-100 sl-grid-bg"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: [0, 1, 1], scale: [0.8, 1.04, 1] }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="sl-frame sl-top-line relative flex w-[min(92vw,620px)] flex-col items-center justify-center overflow-hidden p-6 sm:p-8"
      >
        <div className="absolute inset-0 sl-noise opacity-40" />
        <div className="absolute inset-5 border border-cyan-200/20 sm:inset-8" />
        <motion.div
          animate={{ x: ["-115%", "115%"] }}
          transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-0 h-full w-1/3 bg-gradient-to-r from-transparent via-cyan-300/20 to-transparent"
        />
        <motion.div
          animate={{ scale: [0.92, 1.08, 0.92], opacity: [0.45, 0.9, 0.45] }}
          transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
          className="absolute inset-x-24 top-1/2 h-8 -translate-y-1/2 bg-cyan-400/30 blur-xl"
        />
        <div className="relative mb-8 text-center">
          <div className="mb-3 text-[10px] uppercase tracking-[0.45em] text-cyan-500">Notification</div>
          <div className="text-3xl font-black uppercase tracking-[0.32em] text-cyan-100 drop-shadow-[0_0_18px_rgba(34,211,238,0.55)]">
            SYSTEM
          </div>
        </div>

        <div className="relative w-full max-w-[520px]">
          <div className="mb-3 h-1 overflow-hidden bg-zinc-950">
            <motion.div
              initial={{ width: "0%" }}
              animate={{ width: "100%" }}
              transition={{ duration: 2.05, ease: "easeInOut" }}
              className="h-full bg-cyan-400 shadow-[0_0_16px_rgba(34,211,238,0.9)]"
            />
          </div>
          <div className="space-y-1 overflow-hidden text-[10px] uppercase tracking-widest text-zinc-400">
            {BOOT_LINES.map((line, index) => (
              <motion.div
                key={line}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.34, duration: 0.25 }}
                className={`truncate ${index === BOOT_LINES.length - 1 ? "text-cyan-300" : ""}`}
              >
                {line}
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>

      <button
        type="button"
        onClick={() => completeRef.current()}
        className="sl-button absolute bottom-[max(18px,env(safe-area-inset-bottom))] right-4 min-h-11 px-4 text-[10px] uppercase tracking-[0.28em] text-cyan-200"
      >
        Pomiń
      </button>
    </motion.div>
  );
}
