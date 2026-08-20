import React from "react";
import { motion } from "motion/react";
import { Sparkles, X, CheckCircle2, Shield, Flame } from "lucide-react";
import { CURRENT_APP_VERSION, CURRENT_VERSION_CHANGELOG } from "../services/updateService";

type WhatsNewModalProps = {
  onClose: () => void;
};

export const WhatsNewModal: React.FC<WhatsNewModalProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.92, y: 15 }}
        transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
        className="relative w-full max-w-md overflow-hidden rounded-2xl border border-cyan-500/40 bg-gradient-to-b from-slate-950 via-slate-900 to-black p-6 text-cyan-50 shadow-[0_0_50px_rgba(6,182,212,0.25)]"
      >
        {/* Top Glow Accent */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent" />

        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-cyan-500/20">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-950/80 border border-cyan-400/40 text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.3)]">
              <Flame className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <span className="text-[10px] font-mono tracking-widest text-cyan-400/80 uppercase">
                [ SYSTEM AWAKENING ]
              </span>
              <h3 className="text-base font-bold tracking-wide text-white font-sans">
                NOWOŚCI W WERSJI v{CURRENT_APP_VERSION}
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Subtitle Banner */}
        <div className="my-4 p-3 rounded-xl bg-cyan-950/40 border border-cyan-500/30 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-cyan-400 shrink-0" />
            <span className="text-xs text-slate-300 font-sans">
              System Łowcy został pomyślnie zaktualizowany!
            </span>
          </div>
          <span className="text-xs font-bold font-mono text-cyan-300 px-2 py-0.5 rounded bg-cyan-900/60 border border-cyan-400/30">
            v{CURRENT_APP_VERSION}
          </span>
        </div>

        {/* Changelog Items */}
        <div className="space-y-2 mb-6">
          <div className="text-xs font-mono font-semibold text-cyan-300 tracking-wider uppercase flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
            <span>LISTA ZMIAN I USPRAWNIEŃ:</span>
          </div>
          <div className="max-h-60 overflow-y-auto space-y-2.5 p-3.5 rounded-xl bg-black/60 border border-slate-800 text-xs text-slate-200 leading-relaxed font-sans">
            {CURRENT_VERSION_CHANGELOG.map((item, index) => (
              <div key={index} className="flex items-start gap-2.5">
                <span className="text-cyan-400 font-bold mt-0.5">•</span>
                <span className="text-slate-300">{item}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Action Button */}
        <button
          onClick={onClose}
          className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-cyan-600 via-cyan-500 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-black font-extrabold text-sm tracking-wide transition-all shadow-[0_0_25px_rgba(6,182,212,0.4)] active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer"
        >
          <Sparkles className="w-4 h-4" />
          <span>ROZPOCZNIJ TRENING</span>
        </button>
      </motion.div>
    </div>
  );
};
