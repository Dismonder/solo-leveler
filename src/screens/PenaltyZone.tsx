import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { usePlayer } from "../context/PlayerContext";
import { PenaltySurvivalGame } from "../games/PenaltySurvivalGame";
import { AlertTriangle } from "lucide-react";

export function PenaltyZone() {
  const { clearPenalty } = usePlayer();
  const [isPlaying, setIsPlaying] = useState(false);

  return (
    <AnimatePresence>
      {!isPlaying ? (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="h-full w-full bg-red-950 flex flex-col items-center justify-center p-4 relative overflow-hidden"
        >
          {/* Intense red pulsing background */}
          <motion.div 
            animate={{ opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="absolute inset-0 bg-red-900 pointer-events-none mix-blend-overlay"
          />

          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="z-10 bg-black/80 border-2 border-red-600 p-8 text-center shadow-[0_0_50px_rgba(220,38,38,0.8)] rounded-sm max-w-md w-full"
          >
            <AlertTriangle className="w-20 h-20 text-red-500 mx-auto mb-6 animate-pulse" />
            
            <h1 className="text-3xl font-black text-red-500 uppercase tracking-widest mb-2 drop-shadow-[0_0_10px_rgba(239,68,68,1)]">
              [Strefa Kary]
            </h1>
            
            <p className="text-red-300 font-bold uppercase tracking-wider mb-8 text-sm">
              Ostrzeżenie: Codzienne zadanie nieukończone.
            </p>

            <p className="text-zinc-400 text-sm mb-8 leading-relaxed">
              Nie ukończyłeś codziennego zadania w terminie. Zostałeś przeniesiony do Strefy Kary.
              Musisz przetrwać 60 sekund w piaskach przesyconych cieniem wymiarów i potworami.
              System nie zna litości.
            </p>

            <button 
              onClick={() => setIsPlaying(true)}
              className="w-full bg-red-800 hover:bg-red-700 text-white font-black uppercase tracking-widest py-4 border border-red-500 shadow-[0_0_20px_rgba(239,68,68,0.5)] transition-all transform hover:scale-105"
            >
              Wejdź de strefy
            </button>
          </motion.div>
        </motion.div>
      ) : (
        <PenaltySurvivalGame onComplete={clearPenalty} />
      )}
    </AnimatePresence>
  );
}
