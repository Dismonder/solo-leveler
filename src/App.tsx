import { Toaster } from "sonner";
import React, { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { App as CapacitorApp } from "@capacitor/app";
import { PlayerProvider, usePlayer } from "./context/PlayerContext";
import { Onboarding } from "./screens/Onboarding";
import { Dashboard } from "./screens/Dashboard";
import { lockAppPortrait } from "./services/orientationService";
import { enableHighPerformanceMode } from "./services/performanceService";
import { playClickSound, playKeyboardSound } from "./utils/audio";
import { SystemWakeBoot } from "./components/SystemWakeBoot";

const WAKE_BOOT_THRESHOLD_MS = 30 * 60 * 1000;
const LAST_INACTIVE_KEY = "sololeveler_last_inactive_at";

function AppContent() {
  const { player, loading } = usePlayer();

  useEffect(() => {
    if (!player) return;
    void enableHighPerformanceMode(player.settings.performanceMode);
  }, [player?.settings.performanceMode]);

  if (loading) {
    return (
      <motion.div key="loading" className="h-full w-full bg-black flex items-center justify-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
        <div className="text-blue-500 animate-pulse font-mono flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-t-2 border-r-2 border-blue-500 animate-spin flex items-center justify-center">
            <div className="w-6 h-6 rounded-full border-b-2 border-l-2 border-blue-300 animate-spin"></div>
          </div>
          <div>LOADING SYSTEM...</div>
        </div>
      </motion.div>
    );
  }

  if (!player) {
    return <ScreenTransition screenKey="onboarding"><Onboarding /></ScreenTransition>;
  }

  return <ScreenTransition screenKey="dashboard"><Dashboard /></ScreenTransition>;
}

export default function App() {
  const [showWakeBoot, setShowWakeBoot] = useState(false);

  useEffect(() => {
    void lockAppPortrait();
  }, []);

  useEffect(() => {
    const shouldShowBoot = () => {
      const lastInactiveAt = Number(localStorage.getItem(LAST_INACTIVE_KEY) || 0);
      return lastInactiveAt > 0 && Date.now() - lastInactiveAt >= WAKE_BOOT_THRESHOLD_MS;
    };

    if (shouldShowBoot()) setShowWakeBoot(true);

    const markInactive = () => {
      localStorage.setItem(LAST_INACTIVE_KEY, String(Date.now()));
    };
    const handleVisibility = () => {
      if (document.hidden) {
        markInactive();
      } else if (shouldShowBoot()) {
        setShowWakeBoot(true);
      }
    };

    document.addEventListener("visibilitychange", handleVisibility);
    void CapacitorApp.addListener("pause", markInactive);
    void CapacitorApp.addListener("resume", () => {
      if (shouldShowBoot()) setShowWakeBoot(true);
    });

    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, []);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest('button, a, input, select, textarea, [role="button"]')) {
        playClickSound();
      }
    };

    const handleKeyDown = () => {
      playKeyboardSound();
    };

    window.addEventListener('mousedown', handleClick);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('mousedown', handleClick);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  return (
    <PlayerProvider>
      <div className="fixed inset-0 bg-black flex overscroll-none overflow-hidden text-cyan-50 font-sans">
        <AppContent />
        <AnimatePresence>
          {showWakeBoot && <SystemWakeBoot onDone={() => setShowWakeBoot(false)} />}
        </AnimatePresence>
        <Toaster theme="dark" position="bottom-center" toastOptions={{
          style: {
            background: 'rgba(2, 6, 23, 0.94)',
            border: '1px solid rgba(34, 211, 238, 0.22)',
            color: '#e0f2fe',
            borderRadius: '18px',
            boxShadow: '0 0 22px rgba(34, 211, 238, 0.12)',
            marginBottom: 'calc(env(safe-area-inset-bottom, 0px) + 5.7rem)',
            maxWidth: 'min(92vw, 22rem)',
          }
        }} />
      </div>
    </PlayerProvider>
  );
}

function ScreenTransition({ screenKey, children }: { screenKey: string; children: React.ReactNode }) {
  const reducedMotion = useReducedMotion();
  const transition = reducedMotion
    ? { duration: 0.08 }
    : { duration: 0.16, ease: [0.16, 1, 0.3, 1] as const };

  return (
    <motion.div
      key={screenKey}
      className="h-full w-full transform-gpu [will-change:opacity,transform]"
      initial={reducedMotion ? { opacity: 0 } : { opacity: 0, y: 6 }}
      animate={reducedMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
      exit={reducedMotion ? { opacity: 0 } : { opacity: 0, y: -6 }}
      transition={transition}
    >
      {children}
    </motion.div>
  );
}
