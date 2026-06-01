import React, { useState, useEffect, useRef } from 'react';
import { PixelFrame } from './PixelFrame';
import { GameResult } from './types';
import { usePlayer } from '../context/PlayerContext';

export function ManaMemoryGame({ onComplete, onExit }: { onComplete: (r: GameResult) => void, onExit: () => void }) {
  const { player } = usePlayer();
  const [isPlaying, setIsPlaying] = useState(false);
  const [sequence, setSequence] = useState<number[]>([]);
  const [playerInput, setPlayerInput] = useState<number[]>([]);
  const [showSequence, setShowSequence] = useState(false);
  const [round, setRound] = useState(0);
  const [activeRune, setActiveRune] = useState<number | null>(null);
  const [lives, setLives] = useState(0);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [won, setWon] = useState(false);
  const scoreRef = useRef(0);
  const roundRef = useRef(0);
  const intervalRef = useRef<number | null>(null);

  const gameLevel = player.miniGames?.["mana-memory"]?.level || 1;
  const targetRounds = Math.min(10, 5 + Math.floor((gameLevel - 1) / 3));
  const runeCount = Math.min(6, 4 + Math.floor((gameLevel - 1) / 6));

  const startRound = (currentSequence: number[]) => {
    if (intervalRef.current) window.clearInterval(intervalRef.current);
    setPlayerInput([]);
    setShowSequence(true);
    let i = 0;
    const revealDelay = Math.max(320, 900 - player.stats.INTELLIGENCE * 10 - gameLevel * 18);
    intervalRef.current = window.setInterval(() => {
      setActiveRune(null);
      if (i >= currentSequence.length) {
        if (intervalRef.current) window.clearInterval(intervalRef.current);
        setShowSequence(false);
        return;
      }
      setTimeout(() => {
         setActiveRune(currentSequence[i]);
         i++;
      }, 200); // blank delay between runes
    }, revealDelay);
  };

  const startGame = () => {
    setIsPlaying(true);
    setGameOver(false);
    setWon(false);
    setScore(0);
    scoreRef.current = 0;
    setRound(1);
    roundRef.current = 1;
    setLives(1 + Math.floor(player.stats.INTELLIGENCE / 14)); // INT gives extra mistake
    const newSeq = [Math.floor(Math.random() * runeCount)];
    setSequence(newSeq);
    startRound(newSeq);
  };

  const endGame = (won: boolean) => {
    if (intervalRef.current) window.clearInterval(intervalRef.current);
    setIsPlaying(false);
    setGameOver(true);
    setWon(won);
    onComplete({
      gameId: 'mana-memory',
      score: scoreRef.current,
      won,
      statHint: 'INTELLIGENCE'
    });
  };

  const handleRuneClick = (index: number) => {
    if (showSequence || !isPlaying) return;
    
    // Animate click
    setActiveRune(index);
    setTimeout(() => setActiveRune(null), 200);

    const newInput = [...playerInput, index];
    setPlayerInput(newInput);

    if (newInput[newInput.length - 1] !== sequence[newInput.length - 1]) {
      // Mistake
      if (lives > 1) {
         setLives(l => l - 1);
         setPlayerInput([]); // reset input for this round
         setTimeout(() => startRound(sequence), 1000);
      } else {
         endGame(false);
      }
      return;
    }

    if (newInput.length === sequence.length) {
      // Round won
      scoreRef.current += sequence.length * 10 + gameLevel * 3;
      setScore(scoreRef.current);
      if (roundRef.current >= targetRounds) {
         endGame(true);
         return;
      }
      roundRef.current += 1;
      setRound(roundRef.current);
      const newSeq = [...sequence, Math.floor(Math.random() * runeCount)];
      setSequence(newSeq);
      setTimeout(() => startRound(newSeq), 1000);
    }
  };

  const runes = [
     { color: 'bg-blue-500', glow: 'shadow-[0_0_20px_rgba(59,130,246,1)]' },
     { color: 'bg-purple-500', glow: 'shadow-[0_0_20px_rgba(168,85,247,1)]' },
     { color: 'bg-cyan-500', glow: 'shadow-[0_0_20px_rgba(34,211,238,1)]' },
     { color: 'bg-indigo-500', glow: 'shadow-[0_0_20px_rgba(99,102,241,1)]' },
     { color: 'bg-emerald-500', glow: 'shadow-[0_0_20px_rgba(16,185,129,1)]' },
     { color: 'bg-rose-500', glow: 'shadow-[0_0_20px_rgba(244,63,94,1)]' }
  ];

  useEffect(() => {
    return () => {
      if (intervalRef.current) window.clearInterval(intervalRef.current);
    };
  }, []);

  return (
    <PixelFrame title="MANA MEMORY" onBack={onExit}>
       {!isPlaying && !gameOver && (
         <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center z-10">
            <h2 className="text-2xl text-blue-400 font-black mb-4 uppercase tracking-[0.3em] font-mono">Mana Memory</h2>
            <p className="text-xs text-zinc-400 mb-8 uppercase font-mono leading-relaxed">System testuje Twoją koncentrację.<br/>Powtórz magiczną sekwencję {targetRounds} razy, aby ukończyć test.</p>
            <div className="text-xs text-zinc-500 mb-8 border border-zinc-800 p-2 bg-zinc-900/50 text-left w-full max-w-[200px]">
               <p className="text-blue-300 mb-1">Poziom symulacji: {gameLevel}</p>
               <p className="mt-2 text-cyan-400 mb-1">INT + Czas na zapamiętanie</p>
               <p className="text-cyan-400">INT + Margin błędów ({1 + Math.floor(player.stats.INTELLIGENCE / 10)})</p>
            </div>
            <button onClick={startGame} className="bg-blue-900 text-blue-100 uppercase tracking-widest font-bold px-8 py-3 border border-blue-500 hover:bg-blue-800 transition-colors">Rozpocznij</button>
         </div>
       )}

       {isPlaying && (
         <div className="absolute inset-0 flex flex-col items-center justify-center p-4 z-10">
            <div className="absolute top-4 left-4 font-mono font-bold text-xs text-zinc-400 uppercase tracking-widest">
               Runda {round} / {targetRounds}
            </div>
            <div className="absolute top-4 right-4 font-mono font-bold text-xs text-zinc-400 uppercase tracking-widest">
               Błędy: {lives - 1}
            </div>

            <div className="grid grid-cols-2 gap-4">
              {runes.slice(0, runeCount).map((rune, i) => (
                <button
                  key={i}
                  disabled={showSequence}
                  onClick={() => handleRuneClick(i)}
                  className={`w-24 h-24 border-2 flex items-center justify-center transition-all ${
                     activeRune === i 
                     ? `${rune.color} border-white ${rune.glow} scale-110`
                     : `bg-zinc-900 border-zinc-700 opacity-50`
                  }`}
                >
                  <div className={`w-8 h-8 rotate-45 ${activeRune === i ? 'bg-white' : 'bg-zinc-700'}`}></div>
                </button>
              ))}
            </div>

            <div className="absolute bottom-10 font-mono text-[10px] text-zinc-500 uppercase tracking-widest h-4">
               {showSequence ? 'Obserwuj...' : 'Powtórz sekwencję'}
            </div>
         </div>
       )}

       {gameOver && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 z-20 p-4 text-center">
            <h2 className={`text-2xl font-black mb-2 uppercase tracking-[0.3em] font-mono ${won ? 'text-green-500' : 'text-red-500'}`}>
               {won ? 'ZALICZONO' : 'NIE ZALICZONO'}
            </h2>
            <p className="text-xs text-zinc-400 mb-8 font-mono">Wynik: {score}</p>
            <button onClick={onExit} className="bg-zinc-800 text-white uppercase tracking-widest font-bold px-6 py-2 hover:bg-zinc-700">Wróć</button>
          </div>
       )}
    </PixelFrame>
  );
}
