import React, { useEffect, useRef, useState } from 'react';
import { HudMeter } from '../components/GameHud';
import { PhaserActionStage } from '../components/PhaserActionStage';
import { SpriteEffect } from '../components/SpriteEffect';
import { usePlayer } from '../context/PlayerContext';
import { animationEventToSpriteAnimation, spriteEventDuration, spriteEventLock } from '../game/actionAnimation';
import type { AnimationActor, AnimationEventType } from '../game/animationSystem';
import { getMiniGameSkillModifiers } from '../game/skillSystem';
import type { SpriteActorAnimation, SpriteActorKind } from '../game/spriteAnimation';
import { useAnimationQueue } from '../hooks/useAnimationQueue';
import { PixelFrame } from './PixelFrame';
import { GameResult } from './types';

type StrikeState = {
  slider: number;
  direction: 1 | -1;
  enemyHp: number;
  enemyMaxHp: number;
  playerHp: number;
  combo: number;
  score: number;
  hitText: string;
  flash: 'none' | 'good' | 'perfect' | 'miss';
  focus: number;
  enemyCharge: number;
  phase: 'read' | 'break' | 'execute';
};

export function ShadowStrikeGame({ onComplete, onExit }: { onComplete: (r: GameResult) => void; onExit: () => void }) {
  const { player } = usePlayer();
  const [isPlaying, setIsPlaying] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [won, setWon] = useState(false);
  const [view, setView] = useState<StrikeState>(() => createInitialState(1, 1));
  const animation = useAnimationQueue();

  const stateRef = useRef(view);
  const requestRef = useRef<number | null>(null);
  const lastTimeRef = useRef(0);
  const isPlayingRef = useRef(false);
  const flashTimerRef = useRef<number | null>(null);

  if (!player) return null;

  const level = player.miniGames?.["shadow-strike"]?.level || 1;
  const skillMods = getMiniGameSkillModifiers(player.skills);
  const baseDamage = 10 + player.stats.STR * 0.55;
  const comboMultiplier = 1 + player.stats.INTELLIGENCE * 0.045;
  const perfectWidth = Math.max(6, 18 + player.stats.SENSE * 0.14 - level * 0.42);
  const goodWidth = Math.max(30, 52 - level * 0.5);
  const perfectStart = 50 - perfectWidth / 2;
  const goodStart = 50 - goodWidth / 2;
  const hunterPose: SpriteActorAnimation = animationEventToSpriteAnimation(animation.getActiveEvent('hunter'));
  const enemyPose: SpriteActorAnimation = animationEventToSpriteAnimation(animation.getActiveEvent('enemy'));
  const phaseLabel = view.phase === 'read' ? 'Odczyt' : view.phase === 'break' ? 'Przełamanie' : 'Egzekucja';

  const playSpriteEvent = (type: AnimationEventType, actor: AnimationActor, kind: SpriteActorKind, spriteAnimation: SpriteActorAnimation) => {
    animation.play(type, actor, {
      durationMs: spriteEventDuration(kind, spriteAnimation),
      lockMs: spriteEventLock(kind, spriteAnimation, type),
    });
  };

  function createInitialState(difficulty: number, playerLevel: number): StrikeState {
    const enemyMaxHp = 90 + playerLevel * 8 + difficulty * 20;
    return {
      slider: 8,
      direction: 1,
      enemyHp: enemyMaxHp,
      enemyMaxHp,
      playerHp: 3,
      combo: 0,
      score: 0,
      hitText: 'Czekaj na szczelinę cienia',
      flash: 'none',
      focus: 0,
      enemyCharge: 0,
      phase: 'read',
    };
  }

  const phaseForHp = (hp: number, maxHp: number): StrikeState['phase'] => {
    const ratio = hp / maxHp;
    if (ratio <= 0.32) return 'execute';
    if (ratio <= 0.66) return 'break';
    return 'read';
  };

  const setFlash = (flash: StrikeState['flash'], text: string) => {
    if (flashTimerRef.current) window.clearTimeout(flashTimerRef.current);
    stateRef.current = { ...stateRef.current, flash, hitText: text };
    setView(stateRef.current);
    flashTimerRef.current = window.setTimeout(() => {
      stateRef.current = { ...stateRef.current, flash: 'none' };
      setView(stateRef.current);
    }, 180);
  };

  const finishGame = (success: boolean) => {
    if (!isPlayingRef.current) return;
    isPlayingRef.current = false;
    setIsPlaying(false);
    setGameOver(true);
    setWon(success);
    if (requestRef.current) cancelAnimationFrame(requestRef.current);
    onComplete({
      gameId: 'shadow-strike',
      score: stateRef.current.score,
      won: success,
      statHint: 'STR',
    });
  };

  const tick = (time: number) => {
    if (!isPlayingRef.current) return;
    const deltaSeconds = Math.min(0.034, (time - lastTimeRef.current) / 1000 || 0.016);
    lastTimeRef.current = time;

    const current = stateRef.current;
    const phaseSpeed = current.phase === 'execute' ? 12 : current.phase === 'break' ? 6 : 0;
    const speed = 42 + level * 2.4 + player.level * 0.8 + phaseSpeed;
    let slider = current.slider + current.direction * speed * deltaSeconds;
    let direction = current.direction;
    if (slider >= 100) {
      slider = 100;
      direction = -1;
    } else if (slider <= 0) {
      slider = 0;
      direction = 1;
    }

    const enemyCharge = current.enemyCharge + (8.5 + level * 0.48 + phaseSpeed * 0.45) * deltaSeconds;
      if (enemyCharge >= 100) {
      const playerHp = Math.max(0, current.playerHp - 1);
      const next = {
        ...current,
        slider,
        direction,
        playerHp,
        enemyCharge: enemyCharge - 100,
        combo: 0,
        flash: 'miss' as const,
        hitText: 'CIENIOWY NAPÓR: -1 HP',
      };
      stateRef.current = next;
      setView(next);
      playSpriteEvent('attack', 'enemy', 'knight', 'attack_1');
      playSpriteEvent('hit', 'hunter', 'hunter', 'hurt');
      if (playerHp <= 0) {
        finishGame(false);
        return;
      }
      requestRef.current = requestAnimationFrame(tick);
      return;
    }

    const next = { ...current, slider, direction, enemyCharge };
    stateRef.current = next;
    setView(next);
    requestRef.current = requestAnimationFrame(tick);
  };

  const startGame = () => {
    const initial = createInitialState(level, player.level);
    stateRef.current = initial;
    setView(initial);
    setIsPlaying(true);
    setGameOver(false);
    setWon(false);
    isPlayingRef.current = true;
    lastTimeRef.current = performance.now();
    requestRef.current = requestAnimationFrame(tick);
  };

  const strike = () => {
    if (!isPlayingRef.current) return;
    const current = stateRef.current;
    const pos = current.slider;
    const perfect = pos >= perfectStart && pos <= perfectStart + perfectWidth;
    const good = pos >= goodStart && pos <= goodStart + goodWidth;

    if (perfect || good) {
      const combo = current.combo + 1;
      const phaseBonus = current.phase === 'execute' ? 1.34 : current.phase === 'break' ? 1.16 : 1;
      const perfectSkillBonus = skillMods.hasVitalStrike ? 2.08 : 1.8;
      const damage = Math.floor(baseDamage * phaseBonus * (perfect ? perfectSkillBonus : 1.05) * (1 + current.combo * comboMultiplier * 0.1));
      const enemyHp = Math.max(0, current.enemyHp - damage);
      const score = current.score + (perfect ? 70 : 28) * combo;
      stateRef.current = {
        ...current,
        combo,
        enemyHp,
        score,
        focus: Math.min(100, current.focus + (perfect ? 30 : 11)),
        enemyCharge: Math.max(0, current.enemyCharge - (perfect ? (skillMods.hasBloodlust ? 34 : 22) : 8)),
        phase: phaseForHp(enemyHp, current.enemyMaxHp),
        flash: perfect ? 'perfect' : 'good',
        hitText: perfect ? `PERFECT +${damage}` : `HIT +${damage}`,
      };
      setView(stateRef.current);
      playSpriteEvent(perfect ? 'crit' : 'attack', 'hunter', 'hunter', perfect ? 'attack_2' : 'attack_1');
      playSpriteEvent('hit', 'enemy', 'knight', 'hurt');
      if (enemyHp <= 0) {
        finishGame(true);
        return;
      }
      setFlash(perfect ? 'perfect' : 'good', perfect ? `PERFECT +${damage}` : `HIT +${damage}`);
      return;
    }

    const playerHp = Math.max(0, current.playerHp - 1);
    stateRef.current = {
      ...current,
      combo: 0,
      playerHp,
      flash: 'miss',
      hitText: 'MISS: cień kontratakuje',
    };
    setView(stateRef.current);
    playSpriteEvent('attack', 'enemy', 'knight', 'attack_1');
    playSpriteEvent('hit', 'hunter', 'hunter', 'hurt');
    if (playerHp <= 0) {
      finishGame(false);
      return;
    }
    setFlash('miss', 'MISS: cień kontratakuje');
  };

  const finisher = () => {
    if (!isPlayingRef.current) return;
    const current = stateRef.current;
    if (!skillMods.hasShadowStrike || current.focus < 100) return;
    const damage = Math.floor(baseDamage * (2.65 + player.stats.INTELLIGENCE * 0.018));
    const enemyHp = Math.max(0, current.enemyHp - damage);
    stateRef.current = {
      ...current,
      focus: 0,
      enemyCharge: Math.max(0, current.enemyCharge - 44),
      enemyHp,
      phase: phaseForHp(enemyHp, current.enemyMaxHp),
      combo: current.combo + 2,
      score: current.score + 240 + current.combo * 25,
      flash: 'perfect',
      hitText: `FINISHER CIENIA +${damage}`,
    };
    setView(stateRef.current);
    playSpriteEvent('crit', 'hunter', 'hunter', 'attack_2');
    playSpriteEvent('hit', 'enemy', 'knight', 'hurt');
    if (enemyHp <= 0) {
      finishGame(true);
      return;
    }
    setFlash('perfect', `FINISHER CIENIA +${damage}`);
  };

  const rulerHand = () => {
    if (!isPlayingRef.current || !skillMods.hasRulerHand) return;
    const current = stateRef.current;
    if (current.focus < 45) return;
    const damage = Math.floor(player.stats.INTELLIGENCE * 1.85 + player.stats.SENSE * 0.8 + level * 3);
    const enemyHp = Math.max(0, current.enemyHp - damage);
    stateRef.current = {
      ...current,
      focus: current.focus - 45,
      enemyCharge: Math.max(0, current.enemyCharge - 48),
      enemyHp,
      phase: phaseForHp(enemyHp, current.enemyMaxHp),
      score: current.score + 120,
      flash: 'perfect',
      hitText: `RĘKA WŁADCY +${damage}`,
    };
    setView(stateRef.current);
    playSpriteEvent('cast', 'hunter', 'hunter', 'cast');
    playSpriteEvent('hit', 'enemy', 'knight', 'hurt');
    if (enemyHp <= 0) {
      finishGame(true);
      return;
    }
    setFlash('perfect', `RĘKA WŁADCY +${damage}`);
  };

  useEffect(() => {
    const down = (event: KeyboardEvent) => {
      if (event.code === 'Space') {
        event.preventDefault();
        strike();
      }
      if (event.code === 'KeyE') {
        event.preventDefault();
        finisher();
      }
      if (event.code === 'KeyQ') {
        event.preventDefault();
        rulerHand();
      }
    };
    window.addEventListener('keydown', down);
    return () => {
      window.removeEventListener('keydown', down);
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
      if (flashTimerRef.current) window.clearTimeout(flashTimerRef.current);
      isPlayingRef.current = false;
    };
  }, [perfectStart, perfectWidth, goodStart, goodWidth]);

  return (
    <PixelFrame title="SHADOW STRIKE" onBack={onExit}>
      {!isPlaying && !gameOver && (
        <Overlay
          title="Shadow Strike"
          tone="text-violet-300"
          body="Trafiaj w szczelinę rytmu, zanim pasek naporu cienia dojdzie do końca. E odpala finisher, Q Rękę Władcy."
          meta={`Lv.${level} · ${skillMods.hasShadowStrike ? 'finisher odblokowany' : 'finisher wymaga Shadow Strike'} · ${skillMods.hasVitalStrike ? 'Zabójczy Cios wzmacnia perfect' : 'Zabójczy Cios zablokowany'}`}
          action="Start"
          onClick={startGame}
        />
      )}

      {gameOver && (
        <Overlay
          title={won ? 'Cień Rozbity' : 'Kontratak'}
          tone={won ? 'text-emerald-300' : 'text-red-300'}
          body={`Wynik ${view.score} · Combo ${view.combo}`}
          meta="System zapisał wynik symulacji."
          action="Wróć"
          onClick={onExit}
        />
      )}

      {isPlaying && <button aria-label="Atak" className="absolute inset-0 z-10 cursor-crosshair" onClick={strike} />}

      <div className={`absolute inset-0 overflow-hidden bg-[#080712] ${view.flash === 'perfect' ? 'shadow-[inset_0_0_100px_rgba(34,211,238,0.45)]' : ''} ${view.flash === 'miss' ? 'shadow-[inset_0_0_100px_rgba(239,68,68,0.45)]' : ''}`}>
        <div className="absolute inset-0 bg-[linear-gradient(rgba(139,92,246,0.07)_1px,transparent_1px),linear-gradient(90deg,rgba(34,211,238,0.04)_1px,transparent_1px)] bg-[size:30px_30px]" />
        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-violet-950/45 to-transparent" />

        <div className="absolute left-4 top-4 z-20 font-mono text-xs font-black uppercase tracking-widest text-cyan-300">
          {phaseLabel} · Combo {view.combo} · Score {view.score}
        </div>
        <div className="absolute right-4 top-4 z-20 flex gap-1">
          {Array.from({ length: view.playerHp }).map((_, index) => (
            <div key={index} className="h-4 w-4 bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.9)] [clip-path:polygon(50%_0%,100%_25%,100%_75%,50%_100%,0%_75%,0%_25%)]" />
          ))}
        </div>

        <div className="absolute left-1/2 top-[18%] z-20 w-48 -translate-x-1/2 text-center">
          <div className="mb-1 font-mono text-[10px] font-black uppercase tracking-widest text-red-400">Dreadwing Knight</div>
          <div className="h-3 border border-red-900 bg-red-950">
            <div className="h-full bg-red-500 transition-all" style={{ width: `${(view.enemyHp / view.enemyMaxHp) * 100}%` }} />
          </div>
          <div className="mt-2 h-1.5 border border-red-950 bg-black">
            <div className="h-full bg-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.9)] transition-all" style={{ width: `${Math.min(100, view.enemyCharge)}%` }} />
          </div>
        </div>

        <PhaserActionStage
          model={{
            sceneId: 'shadow-strike',
            theme: 'violet',
            floorHeight: 0.22,
            actors: [
              {
                id: 'hunter',
                kind: 'hunter',
                animation: hunterPose,
                x: 28,
                y: 83,
                slot: 'combat',
                facing: 'right',
                scale: view.focus >= 100 ? 1.06 : 0.98,
                eventKey: animation.getActiveEvent('hunter')?.id,
              },
              {
                id: 'enemy',
                kind: 'knight',
                animation: enemyPose,
                x: 73,
                y: 81,
                slot: 'combat',
                facing: 'left',
                scale: 0.96,
                eventKey: animation.getActiveEvent('enemy')?.id,
              },
            ],
          }}
        />
        {(view.flash === 'good' || view.flash === 'perfect') && (
          <>
            <SpriteEffect type="slash" size={170} className="left-[38%] top-[41%] -rotate-12" />
            <SpriteEffect type="impact" size={130} className="right-[25%] top-[38%]" />
          </>
        )}
        {view.flash === 'miss' && <SpriteEffect type="slash" size={170} className="left-[34%] top-[42%] rotate-12" />}

        <div className="absolute inset-x-6 bottom-8 z-20">
          <div className="mb-3 text-center font-mono text-sm font-black uppercase tracking-[0.22em] text-cyan-200">{view.hitText}</div>
          <div className="mb-3 grid grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-3">
            <HudMeter label="Focus" value={view.focus} max={100} tone="violet" rightLabel={view.focus >= 100 ? 'MAX' : `${view.focus}%`} />
            <button
              onClick={finisher}
              disabled={!skillMods.hasShadowStrike || view.focus < 100}
              title={!skillMods.hasShadowStrike ? 'Wymaga: Shadow Strike' : undefined}
              className="relative z-30 border border-violet-400 bg-violet-950/70 px-3 py-2 font-mono text-[10px] font-black uppercase tracking-widest text-violet-100 disabled:opacity-35"
            >
              Finisher
            </button>
            <button
              onClick={rulerHand}
              disabled={!skillMods.hasRulerHand || view.focus < 45}
              title={!skillMods.hasRulerHand ? 'Wymaga: Ręka Władcy' : undefined}
              className="relative z-30 border border-cyan-400 bg-cyan-950/70 px-3 py-2 font-mono text-[10px] font-black uppercase tracking-widest text-cyan-100 disabled:opacity-35"
            >
              Ręka
            </button>
          </div>
          <div className="relative h-12 border border-violet-500/45 bg-black/70 shadow-[0_0_20px_rgba(139,92,246,0.25)]">
            <div className="absolute top-0 h-full bg-emerald-500/24" style={{ left: `${goodStart}%`, width: `${goodWidth}%` }} />
            <div className="absolute top-0 h-full bg-cyan-300/70 shadow-[0_0_16px_rgba(34,211,238,0.95)]" style={{ left: `${perfectStart}%`, width: `${perfectWidth}%` }} />
            <div className="absolute top-[-8px] h-16 w-2 bg-white shadow-[0_0_16px_rgba(255,255,255,1)]" style={{ left: `${view.slider}%` }} />
          </div>
        </div>
      </div>
    </PixelFrame>
  );
}

function Overlay({
  title,
  body,
  meta,
  action,
  tone,
  onClick,
}: {
  title: string;
  body: string;
  meta: string;
  action: string;
  tone: string;
  onClick: () => void;
}) {
  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/82 p-4 text-center">
      <div className="max-w-md border border-violet-500/35 bg-slate-950/90 p-6 shadow-[0_0_36px_rgba(139,92,246,0.28)]">
        <h2 className={`mb-4 text-2xl font-black uppercase tracking-[0.28em] ${tone}`}>{title}</h2>
        <p className="mb-3 text-xs uppercase tracking-widest text-zinc-300">{body}</p>
        <p className="mb-7 text-[10px] uppercase tracking-widest text-violet-500">{meta}</p>
        <button onClick={onClick} className="border border-violet-400 bg-violet-950/60 px-8 py-3 text-xs font-black uppercase tracking-widest text-violet-100 hover:bg-violet-700">
          {action}
        </button>
      </div>
    </div>
  );
}
