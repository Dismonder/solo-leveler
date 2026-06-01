import React, { useEffect, useRef, useState } from "react";
import { Crosshair, Eye } from "lucide-react";
import { usePlayer } from "../context/PlayerContext";
import { getShadowExtractionArenaPoint, type ShadowExtractionArenaPoint } from "../game/shadowExtraction";
import { PixelFrame } from "./PixelFrame";
import { GameResult } from "./types";

type Node = {
  id: number;
  x: number;
  y: number;
  core: boolean;
  expiresAt: number;
};

export function ShadowExtractionGame({ onComplete, onExit }: { onComplete: (r: GameResult) => void; onExit: () => void }) {
  const { player } = usePlayer();
  const gameLevel = player.miniGames?.["shadow-extraction"]?.level || 1;
  const requiredCores = Math.min(28, 8 + gameLevel);
  const maxFocus = 3 + Math.floor(player.stats.SENSE / 20);
  const duration = Math.max(18, 30 - Math.floor(gameLevel / 4));

  const [isPlaying, setIsPlaying] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [won, setWon] = useState(false);
  const [timeLeft, setTimeLeft] = useState(duration);
  const [focus, setFocus] = useState(maxFocus);
  const [score, setScore] = useState(0);
  const [extracted, setExtracted] = useState(0);
  const [nodes, setNodes] = useState<Node[]>([]);
  const [reticle, setReticle] = useState<ShadowExtractionArenaPoint>({ x: 50, y: 50 });
  const intervalRef = useRef<number | null>(null);
  const idRef = useRef(0);
  const stateRef = useRef({ score: 0, extracted: 0, focus: maxFocus });

  const stopLoop = () => {
    if (intervalRef.current) {
      window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const finish = (success: boolean) => {
    stopLoop();
    setIsPlaying(false);
    setGameOver(true);
    setWon(success);
    onComplete({
      gameId: "shadow-extraction",
      score: stateRef.current.score,
      won: success,
      statHint: "SENSE",
    });
  };

  const spawnNode = () => {
    const coreChance = Math.max(0.3, 0.62 - gameLevel * 0.008 + player.stats.SENSE * 0.002);
    const now = performance.now();
    const life = Math.max(850, 1700 - gameLevel * 22 + player.stats.AGILITY * 8);
    const next: Node = {
      id: idRef.current,
      x: 8 + Math.random() * 84,
      y: 14 + Math.random() * 72,
      core: Math.random() < coreChance,
      expiresAt: now + life,
    };
    idRef.current += 1;
    setNodes((current) => [...current.filter((node) => node.expiresAt > now).slice(-10), next]);
  };

  const startGame = () => {
    stopLoop();
    stateRef.current = { score: 0, extracted: 0, focus: maxFocus };
    setScore(0);
    setExtracted(0);
    setFocus(maxFocus);
    setTimeLeft(duration);
    setNodes([]);
    setReticle({ x: 50, y: 50 });
    setWon(false);
    setGameOver(false);
    setIsPlaying(true);
    intervalRef.current = window.setInterval(() => {
      setTimeLeft((current) => {
        if (current <= 1) {
          finish(false);
          return 0;
        }
        return current - 1;
      });
      spawnNode();
    }, Math.max(420, 850 - gameLevel * 15));
  };

  const clickNode = (node: Node) => {
    if (!isPlaying || gameOver) return;
    setNodes((current) => current.filter((item) => item.id !== node.id));

    if (!node.core) {
      stateRef.current.focus -= 1;
      setFocus(stateRef.current.focus);
      if (stateRef.current.focus <= 0) finish(false);
      return;
    }

    stateRef.current.extracted += 1;
    stateRef.current.score += 90 + gameLevel * 6 + Math.max(0, timeLeft * 2);
    setExtracted(stateRef.current.extracted);
    setScore(stateRef.current.score);

    if (stateRef.current.extracted >= requiredCores) {
      finish(true);
    }
  };

  const updateReticle = (event: React.PointerEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    setReticle(getShadowExtractionArenaPoint(event.clientX, event.clientY, rect));
  };

  useEffect(() => {
    return () => stopLoop();
  }, []);

  return (
    <PixelFrame title="SHADOW EXTRACTION" onBack={onExit}>
      {!isPlaying && !gameOver && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/85 p-4 text-center">
          <Eye className="mb-4 h-10 w-10 text-violet-400 drop-shadow-[0_0_16px_rgba(167,139,250,0.9)]" />
          <h2 className="mb-3 text-2xl font-black uppercase tracking-[0.25em] text-violet-300">Shadow Extraction</h2>
          <p className="mb-5 max-w-xs text-xs uppercase leading-relaxed tracking-widest text-zinc-400">
            Wyciągaj tylko rdzenie cienia. Fałszywe sygnały łamią koncentrację.
          </p>
          <div className="mb-7 border border-violet-900/60 bg-violet-950/10 p-3 text-left font-mono text-[10px] uppercase tracking-widest text-zinc-500">
            <p className="text-violet-300">Poziom symulacji: {gameLevel}</p>
            <p>Rdzenie: {requiredCores}</p>
            <p>Czas: {duration}s</p>
            <p>Koncentracja: {maxFocus}</p>
          </div>
          <button onClick={startGame} className="border border-violet-500 bg-violet-950 px-8 py-3 text-xs font-black uppercase tracking-widest text-violet-100 transition-colors hover:bg-violet-900">
            Rozpocznij
          </button>
        </div>
      )}

      {isPlaying && (
        <div
          className="absolute inset-0 z-10 touch-none cursor-crosshair overflow-hidden bg-[radial-gradient(circle_at_center,rgba(76,29,149,0.22),transparent_62%)]"
          onPointerDown={updateReticle}
          onPointerMove={updateReticle}
        >
          <div className="absolute left-4 right-4 top-4 z-20 flex items-center justify-between font-mono text-[10px] uppercase tracking-widest text-zinc-400">
            <span>Czas: <b className="text-violet-300">{timeLeft}s</b></span>
            <span>Rdzenie: <b className="text-violet-300">{extracted}/{requiredCores}</b></span>
            <span>Focus: <b className="text-violet-300">{focus}</b></span>
          </div>
          <Crosshair
            className="sl-extraction-reticle absolute h-16 w-16 -translate-x-1/2 -translate-y-1/2 text-violet-300"
            style={{ left: `${reticle.x}%`, top: `${reticle.y}%` }}
          />

          {nodes.map((node) => (
            <button
              key={node.id}
              onClick={() => clickNode(node)}
              className="absolute h-14 w-14 -translate-x-1/2 -translate-y-1/2 border-0 bg-transparent p-0 transition-transform active:scale-90"
              style={{ left: `${node.x}%`, top: `${node.y}%` }}
              aria-label={node.core ? "Rdzeń cienia" : "Fałszywy cień"}
            >
              <span className={`sl-extraction-signal ${node.core ? "sl-extraction-core" : "sl-extraction-false"}`} />
            </button>
          ))}
        </div>
      )}

      {gameOver && (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-black/90 p-4 text-center">
          <h2 className={`mb-3 text-2xl font-black uppercase tracking-[0.3em] ${won ? "text-emerald-400" : "text-red-500"}`}>
            {won ? "EKSTRAKCJA UDANA" : "CIENIE UCIEKŁY"}
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
