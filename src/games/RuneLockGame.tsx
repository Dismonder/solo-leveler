import React, { useMemo, useRef, useState } from "react";
import { Lock, ScanLine } from "lucide-react";
import { usePlayer } from "../context/PlayerContext";
import { PixelFrame } from "./PixelFrame";
import { GameResult } from "./types";

const RUNES = ["VE", "KA", "RU", "SI", "ON", "EL", "MY", "TH"];

function shuffle<T>(items: T[]) {
  return [...items].sort(() => Math.random() - 0.5);
}

export function RuneLockGame({ onComplete, onExit }: { onComplete: (r: GameResult) => void; onExit: () => void }) {
  const { player } = usePlayer();
  const gameLevel = player.miniGames?.["rune-lock"]?.level || 1;
  const targetLength = Math.min(8, 3 + Math.floor((gameLevel - 1) / 3));
  const maxIntegrity = 2 + Math.floor(player.stats.SENSE / 18);
  const timeLimit = Math.max(9, Math.floor(22 + player.stats.INTELLIGENCE * 0.15 - gameLevel * 0.45));

  const [isPlaying, setIsPlaying] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [won, setWon] = useState(false);
  const [target, setTarget] = useState<string[]>([]);
  const [inputIndex, setInputIndex] = useState(0);
  const [integrity, setIntegrity] = useState(maxIntegrity);
  const [timeLeft, setTimeLeft] = useState(timeLimit);
  const [score, setScore] = useState(0);
  const intervalRef = useRef<number | null>(null);
  const startedAtRef = useRef(0);

  const choices = useMemo(() => shuffle(RUNES), [target.join("-")]);

  const stopTimer = () => {
    if (intervalRef.current) {
      window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const finish = (success: boolean, finalScore = score) => {
    stopTimer();
    setIsPlaying(false);
    setGameOver(true);
    setWon(success);
    onComplete({
      gameId: "rune-lock",
      score: finalScore,
      won: success,
      statHint: "INTELLIGENCE",
    });
  };

  const startGame = () => {
    stopTimer();
    const nextTarget = Array.from({ length: targetLength }, () => RUNES[Math.floor(Math.random() * RUNES.length)]);
    setTarget(nextTarget);
    setInputIndex(0);
    setIntegrity(maxIntegrity);
    setTimeLeft(timeLimit);
    setScore(0);
    setWon(false);
    setGameOver(false);
    setIsPlaying(true);
    startedAtRef.current = performance.now();
    intervalRef.current = window.setInterval(() => {
      setTimeLeft((current) => {
        if (current <= 1) {
          finish(false, Math.max(0, Math.floor((performance.now() - startedAtRef.current) / 100)));
          return 0;
        }
        return current - 1;
      });
    }, 1000);
  };

  const chooseRune = (rune: string) => {
    if (!isPlaying || gameOver) return;
    const expected = target[inputIndex];
    if (rune !== expected) {
      const nextIntegrity = integrity - 1;
      setIntegrity(nextIntegrity);
      if (nextIntegrity <= 0) finish(false, score);
      return;
    }

    const nextIndex = inputIndex + 1;
    const nextScore = score + 80 + gameLevel * 8 + Math.max(0, timeLeft * 4);
    setInputIndex(nextIndex);
    setScore(nextScore);

    if (nextIndex >= target.length) {
      finish(true, nextScore + integrity * 60);
    }
  };

  React.useEffect(() => stopTimer, []);

  return (
    <PixelFrame title="RUNE LOCK" onBack={onExit}>
      {!isPlaying && !gameOver && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/85 backdrop-blur-xl p-4 text-center">
          <div className="pointer-events-none absolute inset-0 -z-10 bg-black/60 backdrop-blur-xl" />
          <Lock className="mb-4 h-10 w-10 text-cyan-400 drop-shadow-[0_0_16px_rgba(34,211,238,0.8)]" />
          <h2 className="mb-3 text-2xl font-black uppercase tracking-[0.28em] text-cyan-300">Rune Lock</h2>
          <p className="mb-5 max-w-xs text-xs uppercase leading-relaxed tracking-widest text-zinc-400">
            Otwórz blokadę bramy, wybierając runy w dokładnej kolejności.
          </p>
          <div className="mb-7 border border-cyan-900/60 bg-cyan-950/10 p-3 text-left font-mono text-[10px] uppercase tracking-widest text-zinc-500">
            <p className="text-cyan-300">Poziom symulacji: {gameLevel}</p>
            <p>Runy: {targetLength}</p>
            <p>Czas: {timeLimit}s</p>
            <p>Integralność: {maxIntegrity}</p>
          </div>
          <button onClick={startGame} className="border border-cyan-500 bg-cyan-950 px-8 py-3 text-xs font-black uppercase tracking-widest text-cyan-100 transition-colors hover:bg-cyan-900">
            Rozpocznij
          </button>
        </div>
      )}

      {isPlaying && (
        <div className="absolute inset-0 z-10 flex flex-col p-4">
          <div className="mb-4 flex items-center justify-between font-mono text-[10px] uppercase tracking-widest text-zinc-400">
            <span>Czas: <b className="text-cyan-300">{timeLeft}s</b></span>
            <span>Integralność: <b className="text-cyan-300">{integrity}</b></span>
          </div>

          <div className="mb-6 border border-cyan-900/50 bg-black/50 p-3">
            <div className="mb-2 flex items-center gap-2 text-[10px] uppercase tracking-widest text-cyan-400">
              <ScanLine className="h-3 w-3" /> Sekwencja
            </div>
            <div className="flex flex-wrap gap-2">
              {target.map((rune, index) => (
                <span
                  key={`${rune}-${index}`}
                  className={`min-w-10 border px-2 py-2 text-center font-mono text-sm font-black ${
                    index < inputIndex ? "border-emerald-500 bg-emerald-950/40 text-emerald-300" : index === inputIndex ? "border-cyan-400 bg-cyan-950/30 text-white" : "border-zinc-800 bg-zinc-950 text-zinc-500"
                  }`}
                >
                  {rune}
                </span>
              ))}
            </div>
          </div>

          <div className="grid flex-1 grid-cols-2 gap-3 sm:grid-cols-4">
            {choices.map((rune) => (
              <button
                key={rune}
                onClick={() => chooseRune(rune)}
                className="border border-zinc-800 bg-zinc-950 text-xl font-black tracking-[0.2em] text-cyan-100 shadow-[inset_0_0_24px_rgba(8,47,73,0.3)] transition-all active:scale-95 hover:border-cyan-500 hover:bg-cyan-950/40"
              >
                {rune}
              </button>
            ))}
          </div>
        </div>
      )}

      {gameOver && (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-black/90 p-4 text-center">
          <h2 className={`mb-3 text-2xl font-black uppercase tracking-[0.3em] ${won ? "text-emerald-400" : "text-red-500"}`}>
            {won ? "BRAMA OTWARTA" : "BLOKADA PĘKŁA"}
          </h2>
          <p className="mb-7 font-mono text-xs uppercase tracking-widest text-zinc-400">Wynik: {score}</p>
          <button onClick={onExit} className="bg-zinc-800 px-6 py-2 text-xs font-bold uppercase tracking-widest text-white hover:bg-zinc-700">
            Wróć
          </button>
        </div>
      )}
    </PixelFrame>
  );
}
