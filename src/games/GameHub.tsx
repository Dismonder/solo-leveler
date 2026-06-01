import React, { useState } from 'react';
import { usePlayer } from '../context/PlayerContext';
import { GateDodgeGame } from './GateDodgeGame';
import { ShadowStrikeGame } from './ShadowStrikeGame';
import { ManaMemoryGame } from './ManaMemoryGame';
import { GameResult } from './types';
import { Brain, Crosshair, KeyRound, ShieldAlert, Sparkles, Swords } from 'lucide-react';
import { PenaltySurvivalGame } from './PenaltySurvivalGame';
import { RuneLockGame } from './RuneLockGame';
import { ShadowExtractionGame } from './ShadowExtractionGame';
import { applyMiniGameDecay, MiniGameId } from '../game/miniGameProgress';
import { getLocalDateKey } from '../game/playerMath';
import { SpriteActor } from '../components/SpriteActor';
import type { SpriteActorAnimation, SpriteActorKind } from '../components/SpriteActor';

export function GameHub() {
  const { player, completeMiniGame } = usePlayer();
  const [activeGame, setActiveGame] = useState<string | null>(null);

  if (!player) return null;

  const handleGameComplete = (result: GameResult) => {
    completeMiniGame(result);
  };

  const handleExit = () => {
    setActiveGame(null);
  };

  if (activeGame === 'gate') {
    return <GateDodgeGame onComplete={handleGameComplete} onExit={handleExit} />;
  }
  
  if (activeGame === 'shadow') {
    return <ShadowStrikeGame onComplete={handleGameComplete} onExit={handleExit} />;
  }

  if (activeGame === 'mana') {
    return <ManaMemoryGame onComplete={handleGameComplete} onExit={handleExit} />;
  }

  if (activeGame === 'rune-lock') {
    return <RuneLockGame onComplete={handleGameComplete} onExit={handleExit} />;
  }

  if (activeGame === 'shadow-extraction') {
    return <ShadowExtractionGame onComplete={handleGameComplete} onExit={handleExit} />;
  }

  // Penalty Game Demo (no reward but lets you test it without failing the daily)
  if (activeGame === 'penalty_demo') {
     return <PenaltySurvivalGame onComplete={() => setActiveGame(null)} />;
  }

  const today = getLocalDateKey();
  const idleDays = (dateKey: string | null | undefined) => {
    if (!dateKey) return 0;
    const [fromY, fromM, fromD] = dateKey.split("-").map(Number);
    const [toY, toM, toD] = today.split("-").map(Number);
    return Math.max(0, Math.floor((Date.UTC(toY, toM - 1, toD) - Date.UTC(fromY, fromM - 1, fromD)) / 86_400_000));
  };
  const gameCards: Array<{
    id: string;
    progressId?: MiniGameId;
    title: string;
    desc: string;
    stat: string;
    icon: React.ReactNode;
    tone: string;
    reward: boolean;
    preview: { kind: SpriteActorKind; animation: SpriteActorAnimation; facing?: 'left' | 'right' };
  }> = [
    {
      id: 'gate',
      progressId: 'gate-dodge',
      title: 'Gate Dodge',
      desc: 'Przetrwaj w bramie, unikając odłamków i pocisków many.',
      stat: 'AGILITY / VITALITY',
      icon: <ShieldAlert className="w-6 h-6 text-cyan-500" />,
      tone: 'hover:border-cyan-500/50',
      reward: true,
      preview: { kind: 'hunter', animation: 'dash' },
    },
    {
      id: 'shadow',
      progressId: 'shadow-strike',
      title: 'Shadow Strike',
      desc: 'Uderzaj w rytmie, rozbijając pancerz cienia.',
      stat: 'STR / SENSE',
      icon: <Swords className="w-6 h-6 text-zinc-300" />,
      tone: 'hover:border-zinc-500/50',
      reward: true,
      preview: { kind: 'knight', animation: 'attack_1', facing: 'left' },
    },
    {
      id: 'mana',
      progressId: 'mana-memory',
      title: 'Mana Memory',
      desc: 'Zapamiętaj i powtórz sekwencję run zanim system ją wygasi.',
      stat: 'INTELLIGENCE',
      icon: <Brain className="w-6 h-6 text-purple-500" />,
      tone: 'hover:border-purple-500/50',
      reward: true,
      preview: { kind: 'hunter', animation: 'cast' },
    },
    {
      id: 'rune-lock',
      progressId: 'rune-lock',
      title: 'Rune Lock',
      desc: 'Otwórz blokadę bramy przez właściwą kolejność znaków.',
      stat: 'INTELLIGENCE / SENSE',
      icon: <KeyRound className="w-6 h-6 text-cyan-300" />,
      tone: 'hover:border-cyan-400/50',
      reward: true,
      preview: { kind: 'hunter', animation: 'guard' },
    },
    {
      id: 'shadow-extraction',
      progressId: 'shadow-extraction',
      title: 'Shadow Extraction',
      desc: 'Wyciągaj rdzenie cienia, ignorując fałszywe sygnały.',
      stat: 'AGILITY / SENSE',
      icon: <Crosshair className="w-6 h-6 text-violet-400" />,
      tone: 'hover:border-violet-500/50',
      reward: true,
      preview: { kind: 'assassin', animation: 'run', facing: 'left' },
    },
    {
      id: 'penalty_demo',
      title: 'Strefa Kary',
      desc: 'Symulacja strefy kary bez konsekwencji i bez nagród.',
      stat: 'TRENING',
      icon: <Sparkles className="w-6 h-6 text-red-700" />,
      tone: 'hover:border-red-900',
      reward: false,
      preview: { kind: 'worm', animation: 'run', facing: 'left' },
    },
  ];

  return (
    <div className="min-h-full flex flex-col p-4 md:p-6 gap-5 bg-black/20 max-w-6xl">
      <div className="sl-frame sl-top-line shrink-0 overflow-hidden flex flex-col gap-4 lg:flex-row lg:justify-between lg:items-end p-5">
        <div>
          <div className="mb-1 font-mono text-[10px] uppercase tracking-[0.28em] text-cyan-700">Training Gates</div>
          <h2 className="text-2xl font-black uppercase tracking-[0.14em] text-cyan-300 drop-shadow-[0_0_8px_rgba(34,211,238,0.35)]">
            Symulacje Systemu
          </h2>
          <p className="text-xs text-zinc-400 uppercase tracking-widest mt-2 max-w-xl">
            Każda wygrana podnosi poziom danej symulacji. Przerwa od treningu obniża poziom, mnożnik i szansę na loot.
          </p>
        </div>
        <div className="text-right">
          <div className="text-xs uppercase tracking-widest text-zinc-500">Tryb Nagród</div>
          <div className="text-xl font-mono font-bold text-cyan-400">
            BEZ LIMITU
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {gameCards.map((card) => {
          const progress = card.reward && card.progressId ? applyMiniGameDecay(player.miniGames[card.progressId], today) : null;
          const daysOff = card.reward && card.progressId ? idleDays(player.miniGames[card.progressId]?.lastPlayedDate) : 0;
          const nextLevelProgress = progress ? Math.min(100, ((progress.wins % 5) / 5) * 100) : 0;
          return (
            <button
              key={card.id}
              onClick={() => setActiveGame(card.id)}
              className={`sl-panel sl-game-card relative min-h-[210px] overflow-hidden flex flex-col items-start gap-4 p-5 sm:pr-40 ${card.tone} transition-all text-left group active:scale-[0.98]`}
            >
              <div className="absolute inset-y-0 left-0 w-1 bg-blue-900/70 group-hover:bg-cyan-400 transition-colors shadow-[0_0_12px_rgba(34,211,238,0.55)]" />
              <div className="sl-game-card-preview pointer-events-none">
                <SpriteActor
                  kind={card.preview.kind}
                  animation={card.preview.animation}
                  facing={card.preview.facing}
                  size="lg"
                  slot="card"
                  className={card.preview.kind === 'hunter' ? 'sl-card-actor sl-game-hunter' : 'sl-card-actor sl-game-shadow'}
                />
              </div>
              <div className="w-full flex justify-between items-start gap-3">
                <div className="p-3 bg-black border border-zinc-700 shadow-inner rounded-sm">
                  {card.icon}
                </div>
                <div className="flex flex-col items-end gap-1 text-right font-mono text-[9px] uppercase tracking-widest font-bold">
                  {progress ? (
                    <>
                      <span className="border border-cyan-800/50 bg-cyan-950/40 px-2 py-1 text-cyan-300">Lv.{progress.level}</span>
                      <span className="text-zinc-500">x{progress.rewardMultiplier} · Loot {Math.round(progress.lootChance * 100)}%</span>
                      {daysOff >= 2 && <span className="text-red-400">Spadek po przerwie: -{Math.floor(daysOff / 2)} Lv</span>}
                    </>
                  ) : (
                    <span className="border border-zinc-800 bg-zinc-900 px-2 py-1 text-zinc-500">Bez nagród</span>
                  )}
                </div>
              </div>
              <div>
                <div className="font-black text-white uppercase tracking-[0.1em] text-lg mb-1 transition-colors group-hover:text-cyan-300">{card.title}</div>
                <div className="text-xs text-zinc-400 leading-relaxed uppercase">
                  {card.desc}<br />
                  <span className="font-bold text-cyan-700">{card.stat}</span>
                </div>
              </div>
              {progress && (
                <div className="w-full border-t border-zinc-800/80 pt-3">
                  <div className="mb-2 flex justify-between font-mono text-[9px] uppercase tracking-widest text-zinc-500">
                    <span>Rekord {progress.bestScore}</span>
                    <span>Seria {progress.winStreak}</span>
                  </div>
                  <div className="h-1.5 overflow-hidden bg-black ring-1 ring-zinc-800">
                    <div className="h-full bg-cyan-400 shadow-[0_0_12px_rgba(34,211,238,0.75)]" style={{ width: `${nextLevelProgress}%` }} />
                  </div>
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
