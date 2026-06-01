import React, { useEffect, useMemo, useRef, useState } from 'react';
import { HudBadge, HudMeter } from './GameHud';
import { PhaserActionStage } from './PhaserActionStage';
import { SpriteEffect } from './SpriteEffect';
import { SpriteActor } from './SpriteActor';
import { usePlayer } from '../context/PlayerContext';
import { Heart, Shield, Skull, Sparkles, Swords } from 'lucide-react';
import { animationEventToSpriteAnimation } from '../game/actionAnimation';
import { getEffectiveStats } from '../game/playerMath';
import {
  CombatAction,
  CombatEncounterState,
  CombatMonster,
  createCombatEncounter,
  createCombatMonster,
  getCombatIntentLabel,
  resolveCombatAction,
} from '../game/combatSystem';
import { getMissingCombatSkill, getSkillName } from '../game/skillSystem';
import { useAnimationQueue } from '../hooks/useAnimationQueue';

type Dungeon = {
  id: string;
  name: string;
  rank: string;
  minLevel: number;
  mood: string;
  rooms: CombatMonster[];
};

const DUNGEONS: Dungeon[] = [
  {
    id: 'double-gate',
    name: 'Podwójna Brama',
    rank: 'E',
    minLevel: 1,
    mood: 'Wilgotny korytarz z pękniętą runą systemu.',
    rooms: [
      createCombatMonster('goblin-scout', 'Łucznik Bramy', 'Komnata I', 70, 12, 4, 32, 10, 'goblin_archer'),
      createCombatMonster('hobgoblin', 'Młody Wilk Cienia', 'Komnata II', 140, 22, 8, 65, 24, 'young_wolf'),
      createCombatMonster('gate-brute', 'Golem Rdzenia', 'Rdzeń Bramy', 220, 32, 12, 120, 45, 'golem'),
    ],
  },
  {
    id: 'metro',
    name: 'Stacja Metra G-Rank',
    rank: 'D',
    minLevel: 5,
    mood: 'Ciemny peron, światła migają jak ostrzeżenie Systemu.',
    rooms: [
      createCombatMonster('dire-wolf', 'Wilkor Torowy', 'Peron', 210, 34, 10, 110, 35, 'wolf'),
      createCombatMonster('slime-alpha', 'Przeklęty Slime', 'Tunel Techniczny', 300, 46, 18, 190, 62, 'slime_cursed'),
      createCombatMonster('station-warden', 'Pająk Szybu', 'Sterownia', 420, 58, 24, 290, 100, 'young_spider'),
    ],
  },
  {
    id: 'red-castle',
    name: 'Czerwony Zamek',
    rank: 'C',
    minLevel: 12,
    mood: 'Sala tronowa pełna popiołu i zimnych czerwonych płomieni.',
    rooms: [
      createCombatMonster('ash-knight', 'Szkielet z Tarczą', 'Dziedziniec', 480, 64, 28, 360, 125, 'skeleton_shield'),
      createCombatMonster('rune-mage', 'Upiór Runiczny', 'Biblioteka', 390, 72, 18, 330, 110, 'wraith'),
      createCombatMonster('blood-commander', 'Dowódca Otchłani', 'Sala Tronu', 620, 82, 34, 520, 180, 'spider'),
    ],
  },
];

export function CombatArena() {
  const { player, completeCombat, setPlayer } = usePlayer();
  const [selectedDungeonId, setSelectedDungeonId] = useState(DUNGEONS[0].id);
  const [encounter, setEncounter] = useState<CombatEncounterState | null>(null);
  const [combatLog, setCombatLog] = useState<string[]>(['Wybierz komnatę i rozpocznij rajd.']);
  const [floatingTexts, setFloatingTexts] = useState<Array<{ id: number; text: string; side: 'hunter' | 'enemy' | 'center'; tone: 'cyan' | 'red' | 'gold' }>>([]);
  const [attackCharge, setAttackCharge] = useState(0);
  const floatingIdRef = useRef(0);
  const chargeTimerRef = useRef<number | null>(null);
  const chargeStartedAtRef = useRef<number | null>(null);
  const animation = useAnimationQueue();

  const dungeon = DUNGEONS.find((item) => item.id === selectedDungeonId) || DUNGEONS[0];
  const effectiveStats = useMemo(() => player ? getEffectiveStats(player) : null, [player]);

  if (!player || !effectiveStats) return null;

  const startRoom = (room: CombatMonster) => {
    if (player.hp <= 0) {
      setCombatLog(['HP wynosi 0. Najpierw użyj leczenia lub odpoczynku.']);
      return;
    }
    setEncounter(createCombatEncounter(room, player.hp));
    setCombatLog([`[SYSTEM] Wchodzisz do: ${room.title}.`, `${room.name} blokuje przejście.`]);
  };

  const pushFloatingText = (text: string, side: 'hunter' | 'enemy' | 'center', tone: 'cyan' | 'red' | 'gold') => {
    const id = floatingIdRef.current++;
    setFloatingTexts((items) => [...items.slice(-5), { id, text, side, tone }]);
    window.setTimeout(() => {
      setFloatingTexts((items) => items.filter((item) => item.id !== id));
    }, 920);
  };

  const attack = (mode: CombatAction, chargePercent = 0) => {
    if (!encounter || encounter.playerHp <= 0 || animation.locked) return;
    const weaponBonus = player.equipment.weapon?.durability ? player.equipment.weapon.bonusValue * 2 : 0;
    const resolution = resolveCombatAction({
      state: encounter,
      action: mode,
      stats: effectiveStats,
      weaponBonus,
      now: performance.now(),
      unlockedSkills: player.skills,
      chargePercent,
    });

    setCombatLog([...combatLog, ...resolution.logs].slice(-9));
    if (resolution.events.length > 0) animation.enqueue(resolution.events);
    const playerDamage = resolution.logs
      .filter((line) => /^(Atak|Ladowany Atak|Cios Cienia|Przelamanie|Reka Wladcy|Rozpad pancerza)/.test(line))
      .map((line) => Number(line.match(/-(\d+) HP/)?.[1] ?? 0))
      .reduce((sum, value) => sum + value, 0);
    if (playerDamage > 0) {
      pushFloatingText(`${resolution.logs.some((line) => line.includes('[KRYTYK]')) ? 'CRIT ' : ''}-${playerDamage}`, 'enemy', resolution.logs.some((line) => line.includes('[KRYTYK]')) ? 'gold' : 'cyan');
    }
    const enemyDamageText = resolution.logs.find((line) => line.includes(encounter.monster.name) && /-\d+ HP/.test(line));
    const enemyDamage = Number(enemyDamageText?.match(/-(\d+) HP/)?.[1] ?? 0);
    if (enemyDamage > 0) pushFloatingText(`-${enemyDamage}`, 'hunter', 'red');
    if (resolution.victory) pushFloatingText('REWARD', 'center', 'gold');
    setEncounter(resolution.state);

    if (resolution.victory) {
      window.setTimeout(() => {
        completeCombat(resolution.state.monster.xpReward, resolution.state.monster.goldReward, resolution.state.playerHp, player.equipment);
        setEncounter(null);
      }, 980);
    }

    if (resolution.defeat) {
      window.setTimeout(() => {
        setPlayer({ ...player, hp: 0 });
        setEncounter(null);
      }, 980);
    }
  };

  const flee = () => {
    if (!encounter) return;
    setPlayer({ ...player, hp: encounter.playerHp });
    setEncounter(null);
    setCombatLog(['Wycofujesz się z komnaty. HP zapisane.']);
  };

  const heal = () => {
    if (player.gold < 50 || player.hp >= player.maxHp) return;
    setPlayer({ ...player, hp: player.maxHp, gold: player.gold - 50 });
    if (encounter) setEncounter({ ...encounter, playerHp: player.maxHp });
    setCombatLog(['Użyto leczenia Systemu. HP przywrócone.']);
  };

  const rest = () => {
    if (player.hp > 0) return;
    setPlayer({ ...player, hp: 1 });
    if (encounter) setEncounter({ ...encounter, playerHp: 1 });
    setCombatLog(['Odpoczynek awaryjny: HP ustawione na 1.']);
  };

  const stopChargeTimer = () => {
    if (chargeTimerRef.current) {
      window.clearInterval(chargeTimerRef.current);
      chargeTimerRef.current = null;
    }
  };

  const startAttackCharge = () => {
    if (!encounter || encounter.playerHp <= 0 || animation.locked) return;
    stopChargeTimer();
    chargeStartedAtRef.current = performance.now();
    setAttackCharge(8);
    chargeTimerRef.current = window.setInterval(() => {
      if (!chargeStartedAtRef.current) return;
      setAttackCharge(Math.min(100, Math.floor(((performance.now() - chargeStartedAtRef.current) / 900) * 100)));
    }, 32);
  };

  const releaseAttackCharge = () => {
    if (!chargeStartedAtRef.current) return;
    const charge = Math.min(100, Math.floor(((performance.now() - chargeStartedAtRef.current) / 900) * 100));
    chargeStartedAtRef.current = null;
    stopChargeTimer();
    setAttackCharge(0);
    attack('basic', Math.max(8, charge));
  };

  const cancelAttackCharge = () => {
    chargeStartedAtRef.current = null;
    stopChargeTimer();
    setAttackCharge(0);
  };

  useEffect(() => () => stopChargeTimer(), []);

  const activeEvent = animation.activeEvent;
  const hunterEvent = animation.getActiveEvent('hunter');
  const enemyEvent = animation.getActiveEvent('enemy');
  const hunterOffense = hunterEvent && (hunterEvent.type === 'attack' || hunterEvent.type === 'cast' || hunterEvent.type === 'crit');
  const enemyOffense = enemyEvent && (enemyEvent.type === 'attack' || enemyEvent.type === 'cast' || enemyEvent.type === 'crit');
  const enemyImpact = enemyEvent && (enemyEvent.type === 'hit' || enemyEvent.type === 'crit');
  const hunterImpact = hunterEvent && hunterEvent.type === 'hit';
  const stageImpact = activeEvent?.type === 'hit' || activeEvent?.type === 'crit';
  const activeAction = getEventPayloadString(hunterEvent, 'action');
  const activeIntent = getEventPayloadString(enemyEvent, 'intent');
  const activeCharge = getEventPayloadNumber(hunterEvent, 'charge');
  const shadowLock = getMissingCombatSkill('shadow', player.skills);
  const breakLock = getMissingCombatSkill('break', player.skills);
  const rulerLock = getMissingCombatSkill('ruler', player.skills);
  const hunterAnimation = animationEventToSpriteAnimation(hunterEvent);
  const enemyAnimation = animationEventToSpriteAnimation(enemyEvent);

  return (
    <div className="flex h-full flex-col overflow-y-auto bg-black/40 text-zinc-100">
      <div className="border-b border-blue-500/25 bg-black/55 p-4 md:p-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="font-mono text-[10px] uppercase tracking-[0.28em] text-cyan-600">Dungeon Raid</div>
            <h2 className="mt-1 flex items-center gap-2 text-xl font-black uppercase tracking-[0.16em] text-cyan-100">
              <Swords className="h-5 w-5 text-red-400" /> Lochy
            </h2>
          </div>
          <div className="flex flex-wrap items-center gap-2 font-mono text-[10px] uppercase tracking-widest">
            <span className="border border-yellow-500/40 bg-yellow-950/20 px-3 py-2 text-yellow-300">Gold {player.gold}</span>
            <span className="border border-red-500/40 bg-red-950/20 px-3 py-2 text-red-200">HP {encounter?.playerHp ?? player.hp}/{player.maxHp}</span>
            <button onClick={heal} disabled={player.gold < 50 || player.hp >= player.maxHp} className="border border-red-700 bg-red-950/40 px-3 py-2 text-red-200 disabled:opacity-40">
              <Heart className="mr-1 inline h-3.5 w-3.5" /> Leczenie 50G
            </button>
            {player.hp <= 0 && (
              <button onClick={rest} className="border border-zinc-700 bg-zinc-900 px-3 py-2 text-zinc-200">
                Odpocznij
              </button>
            )}
          </div>
        </div>
      </div>

      {!encounter ? (
        <div className="grid gap-5 p-4 md:grid-cols-[320px_minmax(0,1fr)] md:p-6">
          <div className="sl-frame sl-top-line p-4">
            <div className="mb-4 font-mono text-[10px] uppercase tracking-[0.24em] text-zinc-500">Aktywne Bramy</div>
            <div className="space-y-2">
              {DUNGEONS.map((item) => {
                const locked = player.level < item.minLevel;
                return (
                  <button
                    key={item.id}
                    disabled={locked}
                    onClick={() => setSelectedDungeonId(item.id)}
                    className={`w-full border p-3 text-left transition-colors disabled:opacity-35 ${
                      selectedDungeonId === item.id ? 'border-cyan-400 bg-cyan-950/25 text-cyan-100' : 'border-zinc-800 bg-black/35 text-zinc-400 hover:border-blue-700'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-sm font-black uppercase tracking-widest">{item.name}</span>
                      <span className="font-mono text-[10px]">Ranga {item.rank}</span>
                    </div>
                    <div className="mt-2 font-mono text-[10px] uppercase tracking-widest text-zinc-600">Lv.{item.minLevel}+ · {locked ? 'Zablokowane' : 'Dostępne'}</div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="sl-frame sl-top-line min-h-[520px] overflow-hidden p-4">
            <div className="mb-4 flex flex-col gap-2 border-b border-blue-500/20 pb-4 md:flex-row md:items-end md:justify-between">
              <div>
                <div className="font-mono text-[10px] uppercase tracking-[0.24em] text-cyan-700">Wybrana Brama</div>
                <h3 className="mt-1 text-2xl font-black uppercase tracking-[0.14em] text-white">{dungeon.name}</h3>
                <p className="mt-2 max-w-xl text-xs uppercase tracking-widest text-zinc-500">{dungeon.mood}</p>
              </div>
              <div className="font-mono text-xs uppercase tracking-widest text-cyan-300">CP {Math.floor(effectiveStats.STR * 2.5 + effectiveStats.AGILITY * 2 + player.level * 25)}</div>
            </div>

            <div className="grid gap-3 lg:grid-cols-3">
              {dungeon.rooms.map((room) => (
                <button
                  key={room.id}
                  onClick={() => startRoom(room)}
                  className="sl-card-rise group relative min-h-64 overflow-hidden border border-blue-900/45 bg-[#050816] p-4 text-left transition-all hover:border-cyan-400/70 hover:shadow-[0_0_28px_rgba(34,211,238,0.18)]"
                  style={{ animationDelay: `${dungeon.rooms.indexOf(room) * 70}ms` }}
                >
                  <div className="absolute inset-0 bg-[linear-gradient(rgba(34,211,238,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(34,211,238,0.04)_1px,transparent_1px)] bg-[size:28px_28px]" />
                  <div className="relative z-10 flex h-full flex-col justify-between">
                    <div>
                      <div className="font-mono text-[10px] uppercase tracking-[0.24em] text-cyan-600">{room.title}</div>
                      <div className="mt-2 text-lg font-black uppercase tracking-widest text-zinc-100">{room.name}</div>
                      <div className="mt-3 grid grid-cols-2 gap-2 font-mono text-[10px] uppercase tracking-widest text-zinc-500">
                        <span>HP {room.maxHp}</span>
                        <span>ATK {room.attack}</span>
                        <span>DEF {room.defense}</span>
                        <span>XP {room.xpReward}</span>
                      </div>
                    </div>
                    <div className="mt-6 flex items-end justify-center">
                      <SpriteActor kind={room.element} size="md" slot="card" animation="idle" />
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="grid flex-1 gap-4 p-4 lg:grid-cols-[minmax(0,1fr)_360px] lg:p-6">
          <div className={`sl-frame sl-top-line sl-stage-vignette relative min-h-[560px] overflow-hidden bg-[#070b14] p-4 transition-transform ${activeEvent?.type === 'crit' ? 'scale-[1.01]' : ''} ${stageImpact ? 'sl-stage-hitstop' : ''} ${enemyEvent?.type === 'attack' ? 'sl-battle-shake' : ''}`}>
            <div className="absolute inset-0 bg-[linear-gradient(rgba(34,211,238,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(34,211,238,0.04)_1px,transparent_1px)] bg-[size:34px_34px]" />
            <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-blue-950/40 to-transparent" />
              <div className="relative z-10 flex h-full flex-col">
              <div className="flex items-start justify-between gap-3">
                <StatusBar label={player.name} hp={encounter.playerHp} maxHp={player.maxHp} tone="cyan" />
                <StatusBar label={encounter.monster.name} hp={encounter.monster.hp} maxHp={encounter.monster.maxHp} tone="red" />
              </div>
              <div className="mt-4 grid gap-2 font-mono text-[10px] uppercase tracking-widest text-zinc-400 sm:grid-cols-4">
                <div className="border border-cyan-900 bg-black/55 p-2 text-cyan-200">Tura {encounter.turn}</div>
                <div className="border border-red-900 bg-black/55 p-2 text-red-200">Intencja: {getCombatIntentLabel(encounter.intent)}</div>
                <div className="border border-violet-900 bg-black/55 p-2 text-violet-200">Znak Cienia {encounter.shadowMark}</div>
                <div className="border border-orange-900 bg-black/55 p-2 text-orange-200">Rozpad {encounter.armorBreak}</div>
              </div>
              <div className="mt-3 grid gap-3 md:grid-cols-[1fr_auto] md:items-center">
                <HudMeter label="Focus" value={encounter.focus} max={100} tone="cyan" rightLabel={`${encounter.focus}%`} />
                {animation.locked && <HudBadge tone="violet">Resolve</HudBadge>}
              </div>

              <div className="sl-combat-field relative flex flex-1 items-end justify-around overflow-hidden">
                {enemyEvent?.type === 'windup' && (
                  <div className={`sl-intent-telegraph sl-intent-${encounter.intent}`}>
                    <span>{getCombatIntentLabel(encounter.intent)}</span>
                  </div>
                )}
                {hunterEvent?.type === 'windup' && (
                  <div className="sl-windup-ring left-[24%] top-[42%]" />
                )}
                {attackCharge > 0 && (
                  <div className="sl-charge-aura left-[24%] top-[42%]" style={{ '--charge': `${attackCharge}%` } as React.CSSProperties}>
                    <span>{attackCharge}%</span>
                  </div>
                )}
                {activeEvent?.type === 'phaseChange' && <div className="sl-system-scanline" />}

                <PhaserActionStage
                  model={{
                    sceneId: 'combat',
                    theme: 'combat',
                    floorHeight: 0.24,
                    actors: [
                      {
                        id: 'hunter',
                        kind: 'hunter',
                        animation: hunterAnimation,
                        x: 28,
                        y: 93,
                        slot: 'combat',
                        facing: 'right',
                        scale: 1,
                        eventKey: hunterEvent?.id,
                      },
                      {
                        id: 'enemy',
                        kind: encounter.monster.element,
                        animation: enemyAnimation,
                        x: 73,
                        y: 88,
                        slot: 'combat',
                        facing: 'left',
                        scale: encounter.monster.element === 'wolf' || encounter.monster.element === 'young_wolf' ? 0.92 : 0.98,
                        eventKey: enemyEvent?.id,
                      },
                    ],
                  }}
                />
                {floatingTexts.map((item) => (
                  <div key={item.id} className={`sl-floating-damage sl-floating-${item.side} sl-floating-${item.tone}`}>
                    {item.text}
                  </div>
                ))}
                {hunterOffense && <div className={`sl-motion-afterimage sl-afterimage-hunter ${activeAction ? `sl-afterimage-${activeAction}` : ''}`} />}
                {enemyOffense && <div className={`sl-motion-afterimage sl-afterimage-enemy ${activeIntent ? `sl-afterimage-${activeIntent}` : ''}`} />}
                {hunterOffense && <div className="sl-contact-flash sl-contact-at-enemy" />}
                {enemyOffense && <div className="sl-contact-flash sl-contact-at-hunter" />}
                {hunterOffense && <div className={`sl-weapon-arc sl-weapon-arc-hunter ${activeEvent?.type === 'crit' || activeCharge >= 70 ? 'sl-weapon-arc-crit' : ''} ${activeAction ? `sl-action-${activeAction}` : ''} ${activeCharge >= 70 ? 'sl-action-charged' : ''}`} />}
                {activeAction === 'shadow' && hunterOffense && <div className="sl-special-shadow-cut" />}
                {activeAction === 'shadow' && hunterOffense && <div className="sl-shadow-entry-rift" />}
                {activeAction === 'break' && hunterOffense && <div className="sl-ground-split sl-ground-split-enemy" />}
                {activeAction === 'break' && enemyImpact && <div className="sl-special-break-burst" />}
                {activeAction === 'basic' && hunterOffense && <div className="sl-special-basic-trail" />}
                {enemyOffense && <div className={`sl-weapon-arc sl-weapon-arc-enemy ${activeIntent ? `sl-intent-arc-${activeIntent}` : ''}`} />}
                {activeIntent === 'hex' && enemyOffense && <div className="sl-special-hex-field" />}
                {activeIntent === 'rush' && enemyOffense && <div className="sl-special-rush-lines" />}
                {activeIntent === 'crush' && enemyOffense && <div className="sl-special-crush-zone" />}
                {activeIntent === 'crush' && enemyOffense && <div className="sl-ground-split sl-ground-split-hunter" />}
                {enemyImpact && <SpriteEffect type="impact" size={170} className="sl-impact-at-enemy" />}
                {hunterImpact && <SpriteEffect type="impact" size={150} className="sl-impact-at-hunter" />}
                {activeEvent?.type === 'crit' && <div className="sl-critical-callout">CRIT</div>}
              </div>

              <div className="sl-combat-actions relative z-40 grid gap-2 sm:grid-cols-3 xl:grid-cols-7">
                <ActionButton disabled={animation.locked} label={attackCharge > 0 ? `Ładuj ${attackCharge}%` : 'Atak'} icon={<Swords className="h-4 w-4" />} onPointerDown={startAttackCharge} onPointerUp={releaseAttackCharge} onPointerLeave={cancelAttackCharge} />
                <ActionButton disabled={animation.locked || Boolean(shadowLock) || encounter.focus < 30} label="Cios Cienia" title={shadowLock ? `Wymaga: ${getSkillName(shadowLock)}` : undefined} icon={<Sparkles className="h-4 w-4" />} onClick={() => attack('shadow')} />
                <ActionButton disabled={animation.locked || Boolean(breakLock) || encounter.focus < 55} label="Przełamanie" title={breakLock ? `Wymaga: ${getSkillName(breakLock)}` : undefined} icon={<Sparkles className="h-4 w-4" />} onClick={() => attack('break')} />
                <ActionButton disabled={animation.locked || Boolean(rulerLock) || encounter.focus < 42} label="Ręka Władcy" title={rulerLock ? `Wymaga: ${getSkillName(rulerLock)}` : undefined} icon={<Sparkles className="h-4 w-4" />} onClick={() => attack('ruler')} />
                <ActionButton disabled={animation.locked} label="Analiza" icon={<Shield className="h-4 w-4" />} onClick={() => attack('analyze')} />
                <ActionButton disabled={animation.locked} label="Garda" icon={<Shield className="h-4 w-4" />} onClick={() => attack('guard')} />
                <ActionButton disabled={animation.locked} label="Ucieczka" icon={<Skull className="h-4 w-4" />} onClick={flee} muted />
              </div>
            </div>
          </div>

          <div className="sl-frame sl-top-line flex min-h-[420px] flex-col p-4">
            <div className="mb-3 font-mono text-[10px] uppercase tracking-[0.24em] text-cyan-700">Battle Log</div>
            <div className="flex-1 space-y-2 overflow-y-auto font-mono text-xs uppercase tracking-wider text-zinc-400">
              {combatLog.map((line, index) => (
                <div key={`${line}-${index}`} className={line.includes('SYSTEM') ? 'text-cyan-300' : line.includes('-') ? 'text-red-200' : 'text-zinc-400'}>
                  &gt; {line}
                </div>
              ))}
            </div>
            <div className="mt-4 border-t border-blue-500/20 pt-4 font-mono text-[10px] uppercase tracking-widest text-zinc-500">
              STR {effectiveStats.STR} · AGI {effectiveStats.AGILITY} · SEN {effectiveStats.SENSE} · INT {effectiveStats.INTELLIGENCE}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatusBar({ label, hp, maxHp, tone }: { label: string; hp: number; maxHp: number; tone: 'cyan' | 'red' }) {
  const color = tone === 'cyan' ? 'bg-cyan-400 shadow-[0_0_12px_rgba(34,211,238,0.9)]' : 'bg-red-500 shadow-[0_0_12px_rgba(239,68,68,0.9)]';
  return (
    <div className="w-full max-w-xs">
      <div className="mb-1 flex justify-between font-mono text-[10px] uppercase tracking-widest text-zinc-300">
        <span>{label}</span>
        <span>{Math.max(0, hp)}/{maxHp}</span>
      </div>
      <div className="h-3 border border-blue-900 bg-black">
        <div className={`h-full ${color} transition-all`} style={{ width: `${Math.max(0, Math.min(100, (hp / maxHp) * 100))}%` }} />
      </div>
    </div>
  );
}

function ActionButton({
  label,
  icon,
  onClick,
  onPointerDown,
  onPointerUp,
  onPointerLeave,
  muted = false,
  disabled = false,
  title,
}: {
  label: string;
  icon: React.ReactNode;
  onClick?: () => void;
  onPointerDown?: () => void;
  onPointerUp?: () => void;
  onPointerLeave?: () => void;
  muted?: boolean;
  disabled?: boolean;
  title?: string;
}) {
  return (
    <button
      onClick={onClick}
      onPointerDown={onPointerDown}
      onPointerUp={onPointerUp}
      onPointerLeave={onPointerLeave}
      disabled={disabled}
      title={title}
      className={`flex items-center justify-center gap-2 border px-3 py-3 text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 disabled:cursor-not-allowed disabled:opacity-35 ${
        muted ? 'border-zinc-700 bg-zinc-950 text-zinc-400 hover:bg-zinc-900' : 'border-cyan-700 bg-cyan-950/35 text-cyan-100 hover:bg-cyan-800'
      }`}
    >
      {icon} {label}
    </button>
  );
}

function getActorMotionClass(event: ReturnType<typeof useAnimationQueue>['activeEvent'], actor: 'hunter' | 'enemy') {
  if (!event || event.actor !== actor) return '';
  if (event.type === 'windup') return actor === 'hunter' ? 'sl-motion-windup-right' : 'sl-motion-windup-left';
  if (event.type === 'dash') return actor === 'hunter' ? 'sl-motion-dash-right' : 'sl-motion-dash-left';
  if (event.type === 'attack' || event.type === 'crit' || event.type === 'cast') {
    const action = getEventPayloadString(event, 'action');
    const intent = getEventPayloadString(event, 'intent');
    if (actor === 'hunter') {
      if (action === 'shadow') return 'sl-motion-shadow-step-right';
      if (action === 'break') return 'sl-motion-break-leap-right';
      if (event.type === 'cast') return 'sl-motion-cast-right';
      return 'sl-motion-basic-step-right';
    }
    if (intent === 'rush') return 'sl-motion-rush-left';
    if (intent === 'hex') return 'sl-motion-hex-left';
    if (intent === 'crush') return 'sl-motion-crush-left';
    return 'sl-motion-strike-left';
  }
  if (event.type === 'hit') return actor === 'hunter' ? 'sl-motion-hit-left' : 'sl-motion-hit-right';
  if (event.type === 'guard') return 'sl-motion-guard';
  if (event.type === 'death') return 'sl-motion-death';
  return '';
}

function getEventPayloadString(event: ReturnType<typeof useAnimationQueue>['activeEvent'], key: string) {
  const value = event?.payload?.[key];
  return typeof value === 'string' ? value : null;
}

function getEventPayloadNumber(event: ReturnType<typeof useAnimationQueue>['activeEvent'], key: string) {
  const value = event?.payload?.[key];
  return typeof value === 'number' ? value : 0;
}
