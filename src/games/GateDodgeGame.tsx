import React, { useEffect, useRef, useState } from 'react';
import { HudBadge, HudMeter } from '../components/GameHud';
import { PhaserActionStage } from '../components/PhaserActionStage';
import { usePlayer } from '../context/PlayerContext';
import { getMiniGameSkillModifiers } from '../game/skillSystem';
import type { SpriteActorAnimation } from '../game/spriteAnimation';
import { useAnimationQueue } from '../hooks/useAnimationQueue';
import { PixelFrame } from './PixelFrame';
import { GameResult } from './types';

type Shard = {
  id: number;
  kind: 'shard' | 'spear';
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
};

type GateBeam = {
  id: number;
  axis: 'x' | 'y';
  pos: number;
  age: number;
  warning: number;
  width: number;
  spent: boolean;
};

type ManaOrb = {
  id: number;
  kind: 'shield' | 'surge';
  x: number;
  y: number;
  ttl: number;
};

type GateState = {
  player: {
    x: number;
    y: number;
    hp: number;
    maxHp: number;
    speed: number;
    dashCooldown: number;
    dashTimer: number;
    shieldTimer: number;
    facing: 'left' | 'right';
  };
  shards: Shard[];
  beams: GateBeam[];
  orbs: ManaOrb[];
  elapsed: number;
  score: number;
  combo: number;
  hitStop: number;
};

export function GateDodgeGame({ onComplete, onExit }: { onComplete: (r: GameResult) => void; onExit: () => void }) {
  const { player } = usePlayer();
  const [isPlaying, setIsPlaying] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [won, setWon] = useState(false);
  const [view, setView] = useState<GateState>(() => createInitialState(1, 10, 10));
  const animation = useAnimationQueue();

  const keysRef = useRef<Record<string, boolean>>({});
  const stateRef = useRef(view);
  const requestRef = useRef<number | null>(null);
  const lastTimeRef = useRef(0);
  const isPlayingRef = useRef(false);
  const shardIdRef = useRef(0);
  const joystickRef = useRef({ active: false, startX: 0, startY: 0 });

  if (!player) return null;

  const level = player.miniGames?.["gate-dodge"]?.level || 1;
  const skillMods = getMiniGameSkillModifiers(player.skills);
  const targetSeconds = Math.min(60, 30 + level * 2);
  const hunterMoving = Boolean(keysRef.current.ArrowUp || keysRef.current.ArrowDown || keysRef.current.ArrowLeft || keysRef.current.ArrowRight || keysRef.current.w || keysRef.current.a || keysRef.current.s || keysRef.current.d);
  const hunterPose: SpriteActorAnimation = view.player.dashTimer > 0 ? 'dash' : animation.activeEvent?.actor === 'hunter' && animation.activeEvent.type === 'hit' ? 'hurt' : hunterMoving ? 'run' : 'idle';

  function createInitialState(difficulty: number, agility: number, vitality: number, mods = getMiniGameSkillModifiers(undefined)): GateState {
    const maxHp = 1 + Math.floor(vitality / 12);
    return {
      player: {
        x: 50,
        y: 74,
        hp: maxHp,
        maxHp,
        speed: 24 + agility * 0.28 + Math.min(8, difficulty * 0.3) + (mods.hasSprint ? 5 : 0),
        dashCooldown: 0,
        dashTimer: 0,
        shieldTimer: mods.hasStealth ? 1800 : 0,
        facing: 'right',
      },
      shards: [],
      beams: [],
      orbs: [],
      elapsed: 0,
      score: 0,
      combo: 0,
      hitStop: 0,
    };
  }

  const finishGame = (success: boolean) => {
    if (!isPlayingRef.current) return;
    isPlayingRef.current = false;
    setIsPlaying(false);
    setGameOver(true);
    setWon(success);
    if (requestRef.current) cancelAnimationFrame(requestRef.current);

    onComplete({
      gameId: 'gate-dodge',
      score: stateRef.current.score,
      survivedSeconds: Math.floor(stateRef.current.elapsed / 1000),
      won: success,
      statHint: 'AGILITY',
    });
  };

  const spawnShard = (difficulty: number) => {
    const side = Math.floor(Math.random() * 4);
    const speed = 12 + Math.random() * 22 + difficulty * 1.2;
    const kind: Shard['kind'] = Math.random() < Math.min(0.42, 0.12 + difficulty * 0.018) ? 'spear' : 'shard';
    let x = 50;
    let y = 0;
    let vx = 0;
    let vy = speed;

    if (side === 0) {
      x = Math.random() * 100;
      y = -6;
      vx = (Math.random() - 0.5) * 16;
      vy = speed;
    } else if (side === 1) {
      x = 106;
      y = Math.random() * 100;
      vx = -speed;
      vy = (Math.random() - 0.5) * 16;
    } else if (side === 2) {
      x = Math.random() * 100;
      y = 106;
      vx = (Math.random() - 0.5) * 16;
      vy = -speed;
    } else {
      x = -6;
      y = Math.random() * 100;
      vx = speed;
      vy = (Math.random() - 0.5) * 16;
    }

    return {
      id: shardIdRef.current++,
      kind,
      x,
      y,
      vx: kind === 'spear' ? vx * 1.32 : vx,
      vy: kind === 'spear' ? vy * 1.32 : vy,
      size: kind === 'spear' ? 3.4 + Math.random() * 2 : 2.3 + Math.random() * 2.5,
    };
  };

  const spawnBeam = (difficulty: number): GateBeam => ({
    id: shardIdRef.current++,
    axis: Math.random() > 0.5 ? 'x' : 'y',
    pos: 12 + Math.random() * 76,
    age: 0,
    warning: Math.max(560, 1350 - difficulty * 48),
    width: Math.max(3.6, 5.8 - difficulty * 0.035),
    spent: false,
  });

  const spawnOrb = (): ManaOrb => ({
    id: shardIdRef.current++,
    kind: Math.random() > 0.48 ? 'shield' : 'surge',
    x: 12 + Math.random() * 76,
    y: 18 + Math.random() * 70,
    ttl: 6200,
  });

  const triggerDash = () => {
    if (!isPlayingRef.current) return;
    const current = stateRef.current;
    if (current.player.dashCooldown > 0) return;
    stateRef.current = {
      ...current,
      player: {
        ...current.player,
        dashTimer: skillMods.hasSprint ? 260 : 190,
        dashCooldown: Math.max(skillMods.hasSprint ? 520 : 740, 1450 - player.stats.AGILITY * (skillMods.hasSprint ? 11 : 8)),
      },
      score: current.score + (skillMods.hasSprint ? 14 : 8),
    };
    setView(stateRef.current);
    animation.play('dash', 'hunter');
  };

  const tick = (time: number) => {
    if (!isPlayingRef.current) return;
    const deltaSeconds = Math.min(0.034, (time - lastTimeRef.current) / 1000 || 0.016);
    const deltaMs = deltaSeconds * 1000;
    lastTimeRef.current = time;

    if (stateRef.current.hitStop > 0) {
      const frozen = { ...stateRef.current, hitStop: Math.max(0, stateRef.current.hitStop - deltaMs) };
      stateRef.current = frozen;
      setView(frozen);
      requestRef.current = requestAnimationFrame(tick);
      return;
    }

    const current = stateRef.current;
    const next: GateState = {
      ...current,
      player: { ...current.player },
      shards: current.shards.map((shard) => ({ ...shard })),
      beams: current.beams.map((beam) => ({ ...beam })),
      orbs: current.orbs.map((orb) => ({ ...orb })),
      elapsed: current.elapsed + deltaSeconds * 1000,
    };
    next.player.dashCooldown = Math.max(0, next.player.dashCooldown - deltaMs);
    next.player.dashTimer = Math.max(0, next.player.dashTimer - deltaMs);
    next.player.shieldTimer = Math.max(0, next.player.shieldTimer - deltaMs);

    if (next.elapsed >= targetSeconds * 1000) {
      stateRef.current = next;
      setView(next);
      finishGame(true);
      return;
    }

    let dx = 0;
    let dy = 0;
    if (keysRef.current.ArrowUp || keysRef.current.w) dy -= 1;
    if (keysRef.current.ArrowDown || keysRef.current.s) dy += 1;
    if (keysRef.current.ArrowLeft || keysRef.current.a) dx -= 1;
    if (keysRef.current.ArrowRight || keysRef.current.d) dx += 1;
    if (dx !== 0 && dy !== 0) {
      const length = Math.hypot(dx, dy);
      dx /= length;
      dy /= length;
    }
    if (dx < -0.05) next.player.facing = 'left';
    if (dx > 0.05) next.player.facing = 'right';

    const dashBoost = next.player.dashTimer > 0 ? 3.1 : 1;
    next.player.x = Math.max(6, Math.min(94, next.player.x + dx * next.player.speed * dashBoost * deltaSeconds));
    next.player.y = Math.max(14, Math.min(91, next.player.y + dy * next.player.speed * dashBoost * deltaSeconds));

    const spawnChance = (0.65 + level * 0.08 + next.elapsed / 42_000) * deltaSeconds;
    if (Math.random() < spawnChance) next.shards.push(spawnShard(level));
    if (Math.random() < (0.045 + level * 0.004) * deltaSeconds) next.beams.push(spawnBeam(level));
    if (Math.random() < 0.035 * deltaSeconds && next.orbs.length < 2) next.orbs.push(spawnOrb());

    const invulnerable = next.player.dashTimer > 0 || next.player.shieldTimer > 0;
    const remaining: Shard[] = [];
    for (const shard of next.shards) {
      shard.x += shard.vx * deltaSeconds;
      shard.y += shard.vy * deltaSeconds;
      const hit = Math.hypot(next.player.x - shard.x, next.player.y - shard.y) < 4.8 + shard.size;
      const nearMiss = !hit && Math.hypot(next.player.x - shard.x, next.player.y - shard.y) < 9.8 + shard.size;
      if (hit && invulnerable) {
        next.score += shard.kind === 'spear' ? 28 : 16;
        next.combo += 1;
      } else if (hit) {
        next.player.hp -= 1;
        next.combo = 0;
        next.hitStop = 130;
        animation.play('hit', 'hunter');
        if (next.player.hp <= 0) {
          stateRef.current = next;
          setView(next);
          finishGame(false);
          return;
        }
      } else if (shard.x < -12 || shard.x > 112 || shard.y < -12 || shard.y > 112) {
        next.score += 10 + Math.min(50, next.combo * 2);
      } else {
        if (nearMiss) next.score += 1;
        remaining.push(shard);
      }
    }
    next.shards = remaining;

    const remainingBeams: GateBeam[] = [];
    for (const beam of next.beams) {
      beam.age += deltaMs;
      const active = beam.age >= beam.warning;
      const expired = beam.age > beam.warning + 520;
      const distance = beam.axis === 'x' ? Math.abs(next.player.x - beam.pos) : Math.abs(next.player.y - beam.pos);
      if (active && !beam.spent && distance < beam.width) {
        if (invulnerable) {
          next.score += 45;
          next.combo += 2;
        } else {
          next.player.hp -= 1;
          next.combo = 0;
          next.hitStop = 150;
          animation.play('hit', 'hunter');
          beam.spent = true;
          if (next.player.hp <= 0) {
            stateRef.current = next;
            setView(next);
            finishGame(false);
            return;
          }
        }
      }
      if (!expired) remainingBeams.push(beam);
    }
    next.beams = remainingBeams;

    const remainingOrbs: ManaOrb[] = [];
    for (const orb of next.orbs) {
      orb.ttl -= deltaMs;
      const picked = Math.hypot(next.player.x - orb.x, next.player.y - orb.y) < 7;
      if (picked) {
        if (orb.kind === 'shield') {
          next.player.shieldTimer = Math.max(next.player.shieldTimer, 3600);
        } else {
          next.player.dashCooldown = 0;
          next.combo += 3;
        }
        next.score += orb.kind === 'shield' ? 90 : 70;
      } else if (orb.ttl > 0) {
        remainingOrbs.push(orb);
      }
    }
    next.orbs = remainingOrbs;

    stateRef.current = next;
    setView(next);
    requestRef.current = requestAnimationFrame(tick);
  };

  const startGame = () => {
    const initial = createInitialState(level, player.stats.AGILITY, player.stats.VITALITY, skillMods);
    stateRef.current = initial;
    setView(initial);
    setGameOver(false);
    setWon(false);
    setIsPlaying(true);
    isPlayingRef.current = true;
    shardIdRef.current = 0;
    lastTimeRef.current = performance.now();
    requestRef.current = requestAnimationFrame(tick);
  };

  useEffect(() => {
    const down = (event: KeyboardEvent) => {
      keysRef.current[event.key] = true;
      if (event.code === 'Space' || event.code === 'ShiftLeft' || event.code === 'ShiftRight') {
        event.preventDefault();
        triggerDash();
      }
    };
    const up = (event: KeyboardEvent) => {
      keysRef.current[event.key] = false;
    };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
      isPlayingRef.current = false;
    };
  }, []);

  return (
    <PixelFrame title="GATE DODGE" onBack={onExit}>
      {!isPlaying && !gameOver && (
        <GameOverlay
          title="Gate Dodge"
          tone="text-cyan-300"
          body={`Unikaj odłamków i promieni bramy przez ${targetSeconds} sekund. Spacja/Shift = dash przez zagrożenia.`}
          meta={`Lv.${level} · ${skillMods.hasSprint ? 'Zryw aktywny: szybszy dash' : 'Zryw zablokowany: podstawowy unik'} · ${skillMods.hasStealth ? 'Ukrycie daje startową osłonę' : 'Ukrycie zablokowane'}`}
          action="Start"
          onClick={startGame}
        />
      )}

      {gameOver && (
        <GameOverlay
          title={won ? 'Brama Ominięta' : 'Trafiony'}
          tone={won ? 'text-emerald-300' : 'text-red-300'}
          body={`Czas ${Math.floor(view.elapsed / 1000)}s / ${targetSeconds}s · Wynik ${view.score}`}
          meta="Nagroda została naliczona przez System."
          action="Wróć"
          onClick={onExit}
        />
      )}

      <div
        className="absolute inset-0 z-10 md:hidden"
        onTouchStart={(event) => {
          const touch = event.touches[0];
          if (event.touches.length > 1) triggerDash();
          joystickRef.current = { active: true, startX: touch.clientX, startY: touch.clientY };
        }}
        onTouchMove={(event) => {
          event.preventDefault();
          if (!joystickRef.current.active) return;
          const touch = event.touches[0];
          const dx = touch.clientX - joystickRef.current.startX;
          const dy = touch.clientY - joystickRef.current.startY;
          keysRef.current.ArrowUp = dy < -20;
          keysRef.current.ArrowDown = dy > 20;
          keysRef.current.ArrowLeft = dx < -20;
          keysRef.current.ArrowRight = dx > 20;
        }}
        onTouchEnd={() => {
          joystickRef.current.active = false;
          keysRef.current.ArrowUp = false;
          keysRef.current.ArrowDown = false;
          keysRef.current.ArrowLeft = false;
          keysRef.current.ArrowRight = false;
        }}
      />

      <PixelArena>
        <div className="absolute left-4 top-4 z-20 font-mono text-xs font-black uppercase tracking-widest text-cyan-300">
          {Math.floor(view.elapsed / 1000)}s · Score {view.score} · Combo {view.combo}
        </div>
        <div className="absolute right-4 top-4 z-20 flex w-44 flex-col items-end gap-2">
          <div className="flex gap-1">
            {Array.from({ length: Math.max(0, view.player.hp) }).map((_, index) => (
              <div key={index} className="h-4 w-4 bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.9)] [clip-path:polygon(50%_0%,100%_25%,100%_75%,50%_100%,0%_75%,0%_25%)]" />
            ))}
          </div>
          <div className="w-full">
            <HudMeter label="Dash" value={view.player.dashCooldown > 0 ? Math.max(0, 1450 - view.player.dashCooldown) : 1450} max={1450} tone="cyan" rightLabel={view.player.dashCooldown > 0 ? 'CD' : 'Ready'} />
          </div>
          {view.player.shieldTimer > 0 && <HudBadge tone="cyan">Tarcza</HudBadge>}
        </div>

        <PhaserActionStage
          model={{
            sceneId: 'gate-dodge',
            theme: 'cyan',
            portal: true,
            floorHeight: 0.15,
            actors: [
              {
                id: 'hunter',
                kind: 'hunter',
                animation: hunterPose,
                x: view.player.x,
                y: view.player.y,
                slot: 'gameplay',
                facing: view.player.facing,
                scale: 0.88,
                eventKey: animation.getActiveEvent('hunter')?.id,
              },
            ],
            shards: view.shards,
            beams: view.beams,
            orbs: view.orbs,
          }}
        />
        <div className="absolute inset-x-0 bottom-0 h-24 bg-[linear-gradient(to_top,rgba(8,47,73,0.42),transparent)]" />
        {isPlaying && (
          <button
            onClick={triggerDash}
            className="absolute bottom-4 right-4 z-30 border border-cyan-400/60 bg-cyan-950/70 px-4 py-3 font-mono text-[10px] font-black uppercase tracking-widest text-cyan-100 md:hidden"
          >
            Dash
          </button>
        )}
      </PixelArena>
    </PixelFrame>
  );
}

function PixelArena({ children }: { children: React.ReactNode }) {
  return (
    <div className="absolute inset-0 overflow-hidden bg-[#07101f]">
      <div className="absolute inset-0 bg-[linear-gradient(rgba(34,211,238,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(34,211,238,0.06)_1px,transparent_1px)] bg-[size:32px_32px]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(14,165,233,0.2),transparent_42%),linear-gradient(to_bottom,rgba(15,23,42,0.2),rgba(2,6,23,0.94))]" />
      <div className="absolute inset-x-0 bottom-0 h-20 bg-cyan-950/20" />
      {children}
    </div>
  );
}

function GameOverlay({
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
    <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/85 backdrop-blur-xl p-4 text-center">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-black/60 backdrop-blur-xl" />
      <div className="max-w-md border border-cyan-500/35 bg-slate-950/90 p-6 shadow-[0_0_36px_rgba(37,99,235,0.28)]">
        <h2 className={`mb-4 text-2xl font-black uppercase tracking-[0.28em] ${tone}`}>{title}</h2>
        <p className="mb-3 text-xs uppercase tracking-widest text-zinc-300">{body}</p>
        <p className="mb-7 text-[10px] uppercase tracking-widest text-cyan-600">{meta}</p>
        <button onClick={onClick} className="border border-cyan-400 bg-cyan-950/60 px-8 py-3 text-xs font-black uppercase tracking-widest text-cyan-100 hover:bg-cyan-700">
          {action}
        </button>
      </div>
    </div>
  );
}
