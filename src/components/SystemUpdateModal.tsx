import React, { useState } from "react";
import { motion } from "motion/react";
import { Download, Sparkles, X, ShieldAlert, CheckCircle2, RefreshCw } from "lucide-react";
import type { AppUpdateInfo } from "../services/updateService";
import { installUpdate } from "../services/updateService";

type SystemUpdateModalProps = {
  updateInfo: AppUpdateInfo;
  onClose: () => void;
};

export const SystemUpdateModal: React.FC<SystemUpdateModalProps> = ({
  updateInfo,
  onClose,
}) => {
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async () => {
    setDownloading(true);
    await installUpdate(updateInfo.downloadUrl);
    setTimeout(() => {
      setDownloading(false);
    }, 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.92, y: 15 }}
        transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
        className="relative w-full max-w-md overflow-hidden rounded-2xl border border-cyan-500/40 bg-gradient-to-b from-slate-950 via-slate-900 to-black p-6 text-cyan-50 shadow-[0_0_50px_rgba(6,182,212,0.25)]"
      >
        {/* Top Glow Ambient Accent */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent" />

        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-cyan-500/20">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-950/80 border border-cyan-400/40 text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.3)]">
              <Sparkles className="w-5 h-5 animate-spin-slow" />
            </div>
            <div>
              <span className="text-[10px] font-mono tracking-widest text-cyan-400/80 uppercase">
                [ SYSTEM NOTIFICATION ]
              </span>
              <h3 className="text-base font-bold tracking-wide text-white font-sans">
                NOWA WERSJA SYSTEMU
              </h3>
            </div>
          </div>
          {!updateInfo.mandatory && (
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Version Compare Banner */}
        <div className="my-5 p-3.5 rounded-xl bg-cyan-950/40 border border-cyan-500/30 flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-[11px] text-slate-400 font-mono">BIEŻĄCA WERSJA</span>
            <span className="text-sm font-bold text-slate-300">v{updateInfo.currentVersion}</span>
          </div>
          <div className="flex items-center gap-1.5 text-cyan-400 font-mono font-bold text-sm">
            <span>➔</span>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-[11px] text-cyan-400 font-mono">NOWA WERSJA</span>
            <span className="text-sm font-bold text-cyan-300 tracking-wider shadow-[0_0_10px_rgba(6,182,212,0.5)]">
              v{updateInfo.latestVersion}
            </span>
          </div>
        </div>

        {/* Changelog Section */}
        <div className="space-y-2 mb-6">
          <div className="text-xs font-mono font-semibold text-cyan-300 tracking-wider uppercase flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>LISTA ZMIAN / NOWOŚCI:</span>
          </div>
          <div className="max-h-48 overflow-y-auto space-y-1.5 p-3 rounded-xl bg-black/60 border border-slate-800 text-xs text-slate-300 leading-relaxed font-sans">
            {updateInfo.changelog.length > 0 ? (
              updateInfo.changelog.map((item, index) => (
                <div key={index} className="flex items-start gap-2">
                  <span className="text-cyan-400 font-bold mt-0.5">•</span>
                  <span>{item}</span>
                </div>
              ))
            ) : (
              <p className="text-slate-400 italic">Optymalizacje wydajności i poprawki błędów.</p>
            )}
          </div>
        </div>

        {/* Mandatory update warning */}
        {updateInfo.mandatory && (
          <div className="mb-4 p-2.5 rounded-lg bg-amber-950/40 border border-amber-500/40 flex items-center gap-2 text-xs text-amber-300">
            <ShieldAlert className="w-4 h-4 text-amber-400 flex-shrink-0" />
            <span>Ta aktualizacja jest wymagana do poprawnego działania Systemu Łowcy.</span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col gap-2.5">
          <button
            onClick={handleDownload}
            disabled={downloading}
            className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-cyan-600 via-cyan-500 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-black font-extrabold text-sm tracking-wide transition-all shadow-[0_0_25px_rgba(6,182,212,0.4)] active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-75"
          >
            {downloading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>POBIERANIE PAKIETU SYSTEMU...</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>POBIERZ I ZAINSTALUJ AKTUALIZACJĘ</span>
              </>
            )}
          </button>

          {!updateInfo.mandatory && (
            <button
              onClick={onClose}
              className="w-full py-2.5 px-4 rounded-xl border border-slate-700 bg-slate-900/60 hover:bg-slate-800 text-xs font-mono text-slate-300 transition-colors"
            >
              PRZYPOMNIJ PÓŹNIEJ
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
};
