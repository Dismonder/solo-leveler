import { useEffect, useRef, useState } from 'react';
import { HudBadge, HudMeter } from '../components/GameHud';
import { PhaserActionStage } from '../components/PhaserActionStage';
import { usePlayer } from '../context/PlayerContext';
import { getPenaltyEnemyCap, shouldBanishPenaltyEnemy } from '../game/penaltySurvival';
import { getMiniGameSkillModifiers } from '../game/skillSystem';
import type { SpriteActorAnimation } from '../game/spriteAnimation';
import { useAnimationQueue } from '../hooks/useAnimationQueue';
import { PixelFrame } from './PixelFrame';

type HunterState = {
  x: number;
  y: number;
  speed: number;
  stamina: number;
  dashCooldown: number;
  dashTimer: number;
  shieldTimer: number;
  facing: 'left' | 'right';
};

type ShadowBeast = {
  id: number;
  kind: 'chaser' | 'dasher' | 'orbiter';
  x: number;
  y: number;
  size: number;
  speed: number;
  orbit: number;
};

type Hazard = {
  id: number;
  x: number;
  y: number;
  radius: number;
  age: number;
  warning: number;
  duration: number;
  spent: boolean;
};

type SafeZone = {
  x: number;
  y: number;
  radius: number;
};

type PenaltyState = {
  hunter: HunterState;
  enemies: ShadowBeast[];
  hazards: Hazard[];
  safeZone: SafeZone;
  elapsed: number;
  nearMiss: number;
  wave: number;
  pressure: number;
  banished: number;
};

export function PenaltySurvivalGame({ onComplete }: { onComplete: () => void }) {
  const { player } = usePlayer();
  const [isPlaying, setIsPlaying] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [won, setWon] = useState(false);
  const [view, setView] = useState<PenaltyState>(() => createInitialState(10));
  const animation = useAnimationQueue();

  const keysRef = useRef<Record<string, boolean>>({});
  const stateRef = useRef(view);
  const requestRef = useRef<number | null>(null);
  const lastTimeRef = useRef(0);
  const enemyIdRef = useRef(0);
  const isPlayingRef = useRef(false);
  const hazardIdRef = useRef(0);
  const joystickRef = useRef({ active: false, startX: 0, startY: 0 });

  if (!player) return null;
  const skillMods = getMiniGameSkillModifiers(player.skills);
  const hunterMoving = Boolean(keysRef.current.ArrowUp || keysRef.current.ArrowDown || keysRef.current.ArrowLeft || keysRef.current.ArrowRight || keysRef.current.w || keysRef.current.a || keysRef.current.s || keysRef.current.d);
  const hunterPose: SpriteActorAnimation = view.hunter.dashTimer > 0 ? 'dash' : hunterMoving ? 'run' : view.hunter.shieldTimer > 0 ? 'guard' : 'idle';

  function createInitialState(agility: number, mods = getMiniGameSkillModifiers(undefined)): PenaltyState {
    return {
      hunter: {
        x: 50,
        y: 76,
        speed: 25 + agility * 0.25 + (mods.hasSprint ? 4.5 : 0),
        stamina: 100,
        dashCooldown: 0,
        dashTimer: 0,
        shieldTimer: mods.hasStealth ? 1800 : 0,
        facing: 'right',
      },
      enemies: [],
      hazards: [],
      safeZone: { x: 50, y: 50, radius: 9 },
      elapsed: 0,
      nearMiss: 0,
      wave: 1,
      pressure: 0,
      banished: 0,
    };
  }

  const finishGame = (success: boolean) => {
    if (!isPlayingRef.current) return;
    isPlayingRef.current = false;
    setIsPlaying(false);
    setGameOver(true);
    setWon(success);
    if (requestRef.current) cancelAnimationFrame(requestRef.current);
  };

  const spawnEnemy = (elapsed: number): ShadowBeast => {
    const edge = Math.floor(Math.random() * 4);
    const roll = Math.random();
    const kind: ShadowBeast['kind'] = roll > 0.76 ? 'dasher' : roll > 0.52 ? 'orbiter' : 'chaser';
    let x = 50;
    let y = 0;
    if (edge === 0) {
      x = Math.random() * 100;
      y = -8;
    } else if (edge === 1) {
      x = 108;
      y = Math.random() * 100;
    } else if (edge === 2) {
      x = Math.random() * 100;
      y = 108;
    } else {
      x = -8;
      y = Math.random() * 100;
    }

    return {
      id: enemyIdRef.current++,
      kind,
      x,
      y,
      size: kind === 'dasher' ? 3.8 + Math.random() * 1.6 : 4 + Math.random() * 2.8,
      speed: (kind === 'orbiter' ? 8 : kind === 'dasher' ? 10 : 9) + elapsed / 6500 + Math.random() * 5,
      orbit: Math.random() * Math.PI * 2,
    };
  };

  const spawnHazard = (elapsed: number): Hazard => ({
    id: hazardIdRef.current++,
    x: 10 + Math.random() * 80,
    y: 14 + Math.random() * 74,
    radius: Math.min(12, 6 + elapsed / 18_000 + Math.random() * 3),
    age: 0,
    warning: 820,
    duration: 1100,
    spent: false,
  });

  const triggerDash = () => {
    if (!isPlayingRef.current) return;
    const current = stateRef.current;
    if (current.hunter.dashCooldown > 0 || current.hunter.stamina < 34) return;
    stateRef.current = {
      ...current,
      hunter: {
        ...current.hunter,
        dashCooldown: skillMods.hasSprint ? 650 : 920,
        dashTimer: skillMods.hasSprint ? 240 : 170,
        stamina: current.hunter.stamina - (skillMods.hasSprint ? 24 : 34),
      },
    };
    setView(stateRef.current);
    animation.play('dash', 'hunter');
  };

  const tick = (time: number) => {
    if (!isPlayingRef.current) return;
    const deltaSeconds = Math.min(0.034, (time - lastTimeRef.current) / 1000 || 0.016);
    lastTimeRef.current = time;

    const current = stateRef.current;
    const next: PenaltyState = {
      ...current,
      hunter: { ...current.hunter },
      enemies: current.enemies.map((enemy) => ({ ...enemy })),
      hazards: current.hazards.map((hazard) => ({ ...hazard })),
      elapsed: current.elapsed + deltaSeconds * 1000,
    };
    const deltaMs = deltaSeconds * 1000;
    next.wave = Math.floor(next.elapsed / 15_000) + 1;
    next.pressure = Math.min(100, next.elapsed / 600);
    next.safeZone = {
      x: 50 + Math.sin(next.elapsed / 3400) * 25,
      y: 52 + Math.cos(next.elapsed / 4200) * 18,
      radius: Math.max(6.2, 10 - next.wave * 0.55),
    };
    next.hunter.dashCooldown = Math.max(0, next.hunter.dashCooldown - deltaMs);
    next.hunter.dashTimer = Math.max(0, next.hunter.dashTimer - deltaMs);
    next.hunter.shieldTimer = Math.max(0, next.hunter.shieldTimer - deltaMs);
    next.hunter.stamina = Math.min(100, next.hunter.stamina + deltaSeconds * (13 + player.stats.VITALITY * 0.18));

    if (next.elapsed >= 60_000) {
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
    if (dx < -0.05) next.hunter.facing = 'left';
    if (dx > 0.05) next.hunter.facing = 'right';

    const dashBoost = next.hunter.dashTimer > 0 ? 3.05 : 1;
    next.hunter.x = Math.max(6, Math.min(94, next.hunter.x + dx * next.hunter.speed * dashBoost * deltaSeconds));
    next.hunter.y = Math.max(14, Math.min(91, next.hunter.y + dy * next.hunter.speed * dashBoost * deltaSeconds));

    const inSafeZone = Math.hypot(next.hunter.x - next.safeZone.x, next.hunter.y - next.safeZone.y) < next.safeZone.radius;
    if (inSafeZone) {
      next.hunter.shieldTimer = Math.max(next.hunter.shieldTimer, 420);
      next.nearMiss += deltaSeconds * 0.35;
    }

    const enemyCap = getPenaltyEnemyCap(next.wave);
    if (next.enemies.length < enemyCap && Math.random() < (0.55 + next.elapsed / 20_000 + next.wave * 0.055) * deltaSeconds) {
      next.enemies.push(spawnEnemy(next.elapsed));
    }
    if (Math.random() < (0.05 + next.wave * 0.012) * deltaSeconds) {
      next.hazards.push(spawnHazard(next.elapsed));
    }

    const invulnerable = next.hunter.dashTimer > 0 || next.hunter.shieldTimer > 0;

    const remainingHazards: Hazard[] = [];
    for (const hazard of next.hazards) {
      hazard.age += deltaMs;
      const active = hazard.age >= hazard.warning;
      const expired = hazard.age > hazard.warning + hazard.duration;
      const distance = Math.hypot(next.hunter.x - hazard.x, next.hunter.y - hazard.y);
      if (active && !hazard.spent && distance < hazard.radius) {
        if (!invulnerable) {
          animation.play('hit', 'hunter');
          stateRef.current = next;
          setView(next);
          finishGame(false);
          return;
        }
        hazard.spent = true;
        next.nearMiss += 2;
      }
      if (!expired) remainingHazards.push(hazard);
    }
    next.hazards = remainingHazards;

    const remainingEnemies: ShadowBeast[] = [];
    for (const enemy of next.enemies) {
      const vx = next.hunter.x - enemy.x;
      const vy = next.hunter.y - enemy.y;
      const distance = Math.max(0.1, Math.hypot(vx, vy));
      const dashPulse = enemy.kind === 'dasher' && Math.sin((next.elapsed + enemy.id * 211) / 620) > 0.52 ? 2.5 : 1;
      const orbitOffset = enemy.kind === 'orbiter' ? Math.sin(next.elapsed / 520 + enemy.orbit) * 0.75 : 0;
      const moveX = vx / distance + (-vy / distance) * orbitOffset;
      const moveY = vy / distance + (vx / distance) * orbitOffset;
      const moveLength = Math.max(0.1, Math.hypot(moveX, moveY));
      enemy.x += (moveX / moveLength) * enemy.speed * dashPulse * deltaSeconds;
      enemy.y += (moveY / moveLength) * enemy.speed * dashPulse * deltaSeconds;

      if (shouldBanishPenaltyEnemy({ enemy, hunter: next.hunter, safeZone: next.safeZone })) {
        next.nearMiss += enemy.kind === 'dasher' ? 3.2 : 2.2;
        next.banished += 1;
        continue;
      }

      if (distance < enemy.size + 4.2 && !invulnerable) {
        animation.play('hit', 'hunter');
        stateRef.current = next;
        setView(next);
        finishGame(false);
        return;
      }

      if (distance < enemy.size + 9) {
        next.nearMiss += deltaSeconds * (enemy.kind === 'dasher' ? 1.8 : 1);
      }

      if (enemy.x > -18 && enemy.x < 118 && enemy.y > -18 && enemy.y < 118) {
        remainingEnemies.push(enemy);
      }
    }

    next.enemies = remainingEnemies.slice(-enemyCap);
    stateRef.current = next;
    setView(next);
    requestRef.current = requestAnimationFrame(tick);
  };

  const startGame = () => {
    const initial = createInitialState(player.stats.AGILITY, skillMods);
    stateRef.current = initial;
    setView(initial);
    setIsPlaying(true);
    setGameOver(false);
    setWon(false);
    enemyIdRef.current = 0;
    hazardIdRef.current = 0;
    isPlayingRef.current = true;
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
    <PixelFrame title="STREFA KARY">
      {!isPlaying && !gameOver && (
        <Overlay
          title="Strefa Kary"
          body={`Przetrwaj 60 sekund. ${skillMods.hasSprint ? 'Zryw skraca dash cooldown.' : 'Bez Zrywu dash jest wolniejszy.'} ${skillMods.hasStealth ? 'Ukrycie daje startową barierę.' : 'Ukrycie zablokowane.'}`}
          action="Wejdź do strefy"
          tone="text-orange-300"
          onClick={startGame}
        />
      )}

      {gameOver && (
        <Overlay
          title={won ? 'Ocalenie' : 'Pochłonięty'}
          body={`Czas ${Math.floor(view.elapsed / 1000)}s / 60s · Fala ${view.wave} · Uniki ${Math.floor(view.nearMiss * 10)}`}
          action={won ? 'Wróć, wolny od kary' : 'Spróbuj ponownie'}
          tone={won ? 'text-emerald-300' : 'text-red-300'}
          onClick={won ? onComplete : startGame}
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

      <div className="absolute inset-0 overflow-hidden bg-[#1b0d08]">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(251,146,60,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(251,146,60,0.04)_1px,transparent_1px)] bg-[size:34px_34px]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,rgba(251,146,60,0.22),transparent_38%),linear-gradient(to_bottom,rgba(69,26,3,0.25),rgba(2,6,23,0.95))]" />
        <div className="absolute inset-x-0 bottom-0 h-28 bg-orange-950/35" />

        <div className="absolute left-4 top-4 z-20 font-mono text-xs font-black uppercase tracking-widest text-orange-300">
          {Math.floor(view.elapsed / 1000)}s / 60s · Fala {view.wave} · Cienie {view.enemies.length}/{getPenaltyEnemyCap(view.wave)}
          <div className="mt-2 w-44"><HudMeter label="Stamina" value={view.hunter.stamina} max={100} tone="orange" rightLabel={`${Math.floor(view.hunter.stamina)}%`} /></div>
          {view.hunter.shieldTimer > 0 && <div className="mt-2"><HudBadge tone="cyan">Bariera · ban {view.banished}</HudBadge></div>}
        </div>

        <PhaserActionStage
          model={{
            sceneId: 'penalty',
            theme: 'orange',
            floorHeight: 0.18,
            safeZone: { ...view.safeZone, active: view.hunter.shieldTimer > 0 },
            hazards: view.hazards,
            actors: [
              {
                id: 'hunter',
                kind: 'hunter',
                animation: hunterPose,
                x: view.hunter.x,
                y: view.hunter.y,
                slot: 'gameplay',
                facing: view.hunter.facing,
                scale: 0.86,
                eventKey: animation.getActiveEvent('hunter')?.id,
              },
              ...view.enemies.map((enemy) => ({
                id: `worm-${enemy.id}`,
                kind: 'worm' as const,
                animation: (enemy.kind === 'dasher' ? 'dash' : 'run') as SpriteActorAnimation,
                x: enemy.x,
                y: enemy.y,
                slot: 'gameplay' as const,
                facing: enemy.x < view.hunter.x ? 'right' as const : 'left' as const,
                scale: Math.max(0.48, Math.min(0.72, enemy.size / 7)),
              })),
            ],
          }}
        />
        {isPlaying && (
          <button
            onClick={triggerDash}
            className="absolute bottom-4 right-4 z-30 border border-orange-400/60 bg-orange-950/70 px-4 py-3 font-mono text-[10px] font-black uppercase tracking-widest text-orange-100 md:hidden"
          >
            Dash
          </button>
        )}
      </div>
    </PixelFrame>
  );
}

function Overlay({
  title,
  body,
  action,
  tone,
  onClick,
}: {
  title: string;
  body: string;
  action: string;
  tone: string;
  onClick: () => void;
}) {
  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/85 backdrop-blur-xl p-4 text-center">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-black/60 backdrop-blur-xl" />
      <div className="max-w-md border border-orange-500/40 bg-slate-950/90 p-6 shadow-[0_0_40px_rgba(194,65,12,0.3)]">
        <h2 className={`mb-4 text-2xl font-black uppercase tracking-[0.28em] ${tone}`}>{title}</h2>
        <p className="mb-7 text-xs uppercase tracking-widest text-zinc-300">{body}</p>
        <button onClick={onClick} className="border border-orange-400 bg-orange-950/70 px-8 py-3 text-xs font-black uppercase tracking-widest text-orange-100 hover:bg-orange-700">
          {action}
        </button>
      </div>
    </div>
  );
}
