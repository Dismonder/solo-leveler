import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShieldAlert,
  BatteryCharging,
  Bell,
  CheckCircle2,
  ChevronRight,
  Sparkles,
  Info,
  X,
  Smartphone,
  ExternalLink,
} from "lucide-react";
import {
  getNotificationStatus,
  requestNotificationPermission,
  requestIgnoreBatteryOptimizations,
  type HunterNotificationStatus,
} from "../services/notificationService";

interface BackgroundPermissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStatusUpdated?: (status: HunterNotificationStatus) => void;
}

export function BackgroundPermissionModal({
  isOpen,
  onClose,
  onStatusUpdated,
}: BackgroundPermissionModalProps) {
  const [status, setStatus] = useState<HunterNotificationStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [brandTip, setBrandTip] = useState<string | null>(null);

  const refreshStatus = async () => {
    try {
      const currentStatus = await getNotificationStatus();
      setStatus(currentStatus);
      onStatusUpdated?.(currentStatus);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    if (isOpen) {
      refreshStatus();
      // Detect common vendor brands
      const ua = navigator.userAgent.toLowerCase();
      if (ua.includes("xiaomi") || ua.includes("redmi") || ua.includes("poco") || ua.includes("miui")) {
        setBrandTip("Xiaomi / MIUI: Włącz również opcję 'Autostart' oraz 'Brak ograniczeń' w zarządzaniu zasilaniem.");
      } else if (ua.includes("samsung")) {
        setBrandTip("Samsung: Upewnij się, że aplikacja nie znajduje się na liście 'Aplikacje w głębokim uśpieniu'.");
      } else if (ua.includes("huawei") || ua.includes("honor")) {
        setBrandTip("Huawei / Honor: Włącz 'Uruchamianie ręczne' (Autostart + Działanie w tle) w Menedżerze telefonu.");
      }
    }
  }, [isOpen]);

  const handleRequestBattery = async () => {
    setLoading(true);
    try {
      await requestIgnoreBatteryOptimizations();
      setTimeout(refreshStatus, 1200);
    } finally {
      setLoading(false);
    }
  };

  const handleRequestNotifications = async () => {
    setLoading(true);
    try {
      await requestNotificationPermission();
      setTimeout(refreshStatus, 800);
    } finally {
      setLoading(false);
    }
  };

  const handleSnooze = () => {
    localStorage.setItem("last_bg_perm_prompt_ms", Date.now().toString());
    onClose();
  };

  const handleDismissForever = () => {
    localStorage.setItem("last_bg_perm_prompt_dismissed", "true");
    onClose();
  };

  const isBatteryOk = status?.batteryOptimizationIgnored ?? false;
  const isNotificationOk = status?.permissionGranted ?? false;
  const allGranted = isBatteryOk && isNotificationOk;

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          className="absolute inset-0 bg-black/85 backdrop-blur-md"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleSnooze}
        />

        {/* Modal Window */}
        <motion.div
          className="relative max-h-[90vh] w-full max-w-md overflow-hidden rounded-[28px] border-2 border-amber-400/80 bg-slate-950 p-5 text-slate-100 shadow-[0_0_50px_rgba(251,191,36,0.35)] custom-scrollbar overflow-y-auto"
          initial={{ scale: 0.88, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
        >
          {/* Header */}
          <div className="flex items-start justify-between gap-3 border-b border-amber-500/30 pb-4">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-amber-400/60 bg-amber-500/20 text-amber-300 shadow-[0_0_20px_rgba(251,191,36,0.4)]">
                <ShieldAlert className="h-6 w-6" />
              </div>
              <div>
                <span className="font-mono text-[10px] font-black uppercase tracking-[0.25em] text-amber-400">
                  SYSTEM AUTORYZACJI
                </span>
                <h3 className="text-base font-black uppercase tracking-wider text-slate-100">
                  Działanie w tle i alerty
                </h3>
              </div>
            </div>
            <button
              type="button"
              onClick={handleSnooze}
              className="rounded-xl border border-slate-700/80 bg-slate-900/80 p-2 text-slate-400 hover:text-slate-200"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Description */}
          <div className="mt-4 space-y-3">
            <p className="text-xs leading-relaxed text-slate-300">
              Aby <span className="font-bold text-amber-300">System Solo Leveler</span> mógł odliczać czasy treningów przy zablokowanym ekranie, odtwarzać muzykę OST w tle oraz natychmiastowo powiadamiać o karach i odnowieniach wrót, Android wymaga wyłączenia usypiania aplikacji.
            </p>

            {/* Checklist */}
            <div className="grid gap-2.5">
              {/* Battery optimization */}
              <div
                className={`flex items-center justify-between gap-3 rounded-2xl border p-3.5 transition-all ${
                  isBatteryOk
                    ? "border-emerald-500/40 bg-emerald-950/30 text-emerald-300"
                    : "border-amber-500/50 bg-amber-950/25 text-amber-200"
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <BatteryCharging className="h-5 w-5 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs font-black uppercase tracking-wider">
                      Działanie bez ograniczeń (Bateria)
                    </p>
                    <p className="text-[11px] text-slate-400">
                      {isBatteryOk
                        ? "✅ Aplikacja nie będzie usypiana w tle"
                        : "Wymaga ustawienia 'Bez ograniczeń'"}
                    </p>
                  </div>
                </div>
                {!isBatteryOk ? (
                  <button
                    type="button"
                    onClick={handleRequestBattery}
                    disabled={loading}
                    className="shrink-0 rounded-xl border border-amber-400/80 bg-amber-500/20 px-3 py-1.5 font-mono text-[11px] font-black uppercase tracking-wider text-amber-300 shadow-[0_0_15px_rgba(251,191,36,0.3)] active:scale-95"
                  >
                    Włącz
                  </button>
                ) : (
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-400" />
                )}
              </div>

              {/* Notifications */}
              <div
                className={`flex items-center justify-between gap-3 rounded-2xl border p-3.5 transition-all ${
                  isNotificationOk
                    ? "border-emerald-500/40 bg-emerald-950/30 text-emerald-300"
                    : "border-cyan-500/50 bg-cyan-950/25 text-cyan-200"
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Bell className="h-5 w-5 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs font-black uppercase tracking-wider">
                      Powiadomienia i Alerty
                    </p>
                    <p className="text-[11px] text-slate-400">
                      {isNotificationOk
                        ? "✅ Alerty systemowe są aktywne"
                        : "Zezwól na alerty o treningach i karach"}
                    </p>
                  </div>
                </div>
                {!isNotificationOk ? (
                  <button
                    type="button"
                    onClick={handleRequestNotifications}
                    disabled={loading}
                    className="shrink-0 rounded-xl border border-cyan-400/80 bg-cyan-500/20 px-3 py-1.5 font-mono text-[11px] font-black uppercase tracking-wider text-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.3)] active:scale-95"
                  >
                    Zezwól
                  </button>
                ) : (
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-400" />
                )}
              </div>
            </div>

            {/* Instruction Steps */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-3.5">
              <p className="flex items-center gap-1.5 font-mono text-[10px] font-black uppercase tracking-widest text-slate-300">
                <Info className="h-3.5 w-3.5 text-cyan-400" /> Instrukcja konfiguracji:
              </p>
              <ol className="mt-2 list-decimal space-y-1.5 pl-4 text-[11px] leading-relaxed text-slate-300">
                <li>Kliknij <strong className="text-amber-300">Włącz</strong> przy optymalizacji baterii i wybierz opcję <strong className="text-amber-300">Bez ograniczeń</strong>.</li>
                <li>Kliknij <strong className="text-cyan-300">Zezwól</strong>, aby zatwierdzić wysyłanie alertów w telefonie.</li>
                {brandTip && (
                  <li className="text-amber-200 font-medium">{brandTip}</li>
                )}
              </ol>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-5 flex flex-col gap-2">
            {allGranted ? (
              <button
                type="button"
                onClick={onClose}
                className="flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl border border-emerald-400 bg-emerald-500/25 font-mono text-xs font-black uppercase tracking-wider text-emerald-300 shadow-[0_0_25px_rgba(16,185,129,0.4)] active:scale-98"
              >
                <Sparkles className="h-4 w-4" /> Gotowe — Wszystko aktywne
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSnooze}
                className="flex min-h-11 w-full items-center justify-center rounded-2xl border border-slate-700 bg-slate-800/90 font-mono text-xs font-black uppercase tracking-wider text-slate-200 active:scale-98"
              >
                Rozumiem / Skonfiguruję później
              </button>
            )}

            {!allGranted && (
              <button
                type="button"
                onClick={handleDismissForever}
                className="py-1 text-center font-mono text-[10px] font-medium text-slate-500 underline hover:text-slate-400"
              >
                Nie przypominaj mi ponownie
              </button>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

/**
 * Hook checking if background permission modal should be prompted.
 */
export function useBackgroundPermissionCheck() {
  const [showModal, setShowModal] = useState(false);
  const [notificationStatus, setNotificationStatus] = useState<HunterNotificationStatus | null>(null);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    async function check() {
      try {
        const status = await getNotificationStatus();
        setNotificationStatus(status);

        if (!status.android) return;

        const dismissed = localStorage.getItem("last_bg_perm_prompt_dismissed") === "true";
        if (dismissed) return;

        const isBatteryOk = status.batteryOptimizationIgnored ?? false;
        const isNotificationOk = status.permissionGranted ?? false;

        // If either is missing, check frequency (once per 2 days / 48h)
        if (!isBatteryOk || !isNotificationOk) {
          const lastPromptMs = parseInt(localStorage.getItem("last_bg_perm_prompt_ms") || "0", 10);
          const TWO_DAYS = 2 * 24 * 60 * 60 * 1000;
          if (Date.now() - lastPromptMs > TWO_DAYS) {
            // Delay modal presentation slightly after app startup so user isn't startled
            timer = setTimeout(() => setShowModal(true), 2500);
          }
        }
      } catch {
        // ignore
      }
    }
    check();
    return () => clearTimeout(timer);
  }, []);

  return {
    showBackgroundPermissionModal: showModal,
    openBackgroundPermissionModal: () => setShowModal(true),
    closeBackgroundPermissionModal: () => setShowModal(false),
    notificationStatus,
    setNotificationStatus,
  };
}
