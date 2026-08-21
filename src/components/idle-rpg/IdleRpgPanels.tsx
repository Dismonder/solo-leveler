import { useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from "react";
import {
  ArrowLeft,
  ArrowUp,
  Backpack,
  BadgeCheck,
  ChevronLeft,
  ChevronRight,
  CircleGauge,
  Clock3,
  Coins,
  Crown,
  Dumbbell,
  Gem,
  Gift,
  Heart,
  LockKeyhole,
  PackageOpen,
  Shield,
  ShieldCheck,
  Sparkles,
  Swords,
  TrendingUp,
  UserRound,
  Zap,
} from "lucide-react";

import ashMapBackdropUrl from "../../assets/idle-rpg/backgrounds/ash-realm-map.webp";
import drownedMapBackdropUrl from "../../assets/idle-rpg/backgrounds/drowned-archive-map.webp";
import duskMapBackdropUrl from "../../assets/idle-rpg/backgrounds/duskless-crown-map.webp";
import thornMapBackdropUrl from "../../assets/idle-rpg/backgrounds/thorn-sky-map.webp";
import ashSummonStripUrl from "../../assets/idle-rpg/actors/ashen-bulwark-atlas-summon-strip.webp";
import coreBattleAtlasUrl from "../../assets/idle-rpg/actors/core-battle-atlas.webp";
import drownedSummonStripUrl from "../../assets/idle-rpg/actors/drowned-archive-atlas-summon-strip.webp";
import dusklessSummonStripUrl from "../../assets/idle-rpg/actors/duskless-crown-atlas-summon-strip.webp";
import thornSummonStripUrl from "../../assets/idle-rpg/actors/thorn-sky-atlas-summon-strip.webp";
import armorIconUrl from "../../assets/models/equipment/armors/armor-00.png";
import bootsIconUrl from "../../assets/models/equipment/armors/armor-02.png";
import glovesIconUrl from "../../assets/models/equipment/armors/armor-01.png";
import relicIconUrl from "../../assets/models/equipment/relics/relic-00.png";
import weaponIconUrl from "../../assets/models/equipment/weapons/weapon-00.png";
import {
  REALMS,
  getAbyssUpgradeCost,
  getStageDefinition,
  getSummonUpgradeCost,
  type AbyssTreeNode,
  type IdleRpgCommand,
  type IdleRpgEquipmentSlot,
  type IdleRpgItem,
  type IdleRpgSnapshot,
  type IdleRpgSummonId,
} from "../../game/idle-rpg";
import { playIdleUpgradeSfx } from "../../utils/idleRpgAudio";

export type IdleRpgDispatch = (command: IdleRpgCommand) => void;

const MAP_NODE_POSITIONS = [
  [35, 84], [51, 77], [68, 70], [53, 63], [67, 56], [47, 50],
  [46, 36], [59, 30], [77, 38], [63, 21], [73, 14], [74, 8],
] as const;

const REALM_MAP_BACKDROPS = [
  ashMapBackdropUrl,
  drownedMapBackdropUrl,
  thornMapBackdropUrl,
  duskMapBackdropUrl,
] as const;

const SUMMON_PORTRAITS: Record<IdleRpgSummonId, { sourceUrl: string; frame: number }> = {
  "meridian-fang": { sourceUrl: coreBattleAtlasUrl, frame: 16 },
  "ember-bastion": { sourceUrl: ashSummonStripUrl, frame: 0 },
  "ink-mora": { sourceUrl: drownedSummonStripUrl, frame: 0 },
  "storm-spire": { sourceUrl: thornSummonStripUrl, frame: 0 },
  "dusk-aureole": { sourceUrl: dusklessSummonStripUrl, frame: 0 },
};

const EQUIPMENT_LABELS: Record<IdleRpgEquipmentSlot, string> = {
  weapon: "Ostrze",
  armor: "Pancerz",
  gloves: "Rękawice",
  boots: "Buty",
  relic: "Relikt",
};

const EQUIPMENT_IMAGES: Record<IdleRpgEquipmentSlot, string> = {
  weapon: weaponIconUrl,
  armor: armorIconUrl,
  gloves: glovesIconUrl,
  boots: bootsIconUrl,
  relic: relicIconUrl,
};

const ABYSS_NODES: ReadonlyArray<{ id: AbyssTreeNode; name: string; description: string; icon: ReactNode }> = [
  { id: "power", name: "Moc", description: "Obrażenia w Otchłani", icon: <Swords aria-hidden="true" /> },
  { id: "protection", name: "Ochrona", description: "Zdrowie i obrona", icon: <ShieldCheck aria-hidden="true" /> },
  { id: "tempo", name: "Tempo", description: "Szybsze ataki", icon: <Zap aria-hidden="true" /> },
  { id: "abundance", name: "Obfitość", description: "Więcej łupów", icon: <Gem aria-hidden="true" /> },
];

function clampPercent(value: number, maximum: number): number {
  if (!Number.isFinite(value) || !Number.isFinite(maximum) || maximum <= 0) return 0;
  return Math.max(0, Math.min(100, (value / maximum) * 100));
}

export function formatIdleNumber(value: number): string {
  if (!Number.isFinite(value)) return "0";
  if (Math.abs(value) >= 1_000_000) return `${(value / 1_000_000).toFixed(value >= 10_000_000 ? 0 : 1)}M`;
  if (Math.abs(value) >= 10_000) return `${(value / 1_000).toFixed(value >= 100_000 ? 0 : 1)}K`;
  return Math.floor(value).toLocaleString("pl-PL");
}

interface AtlasFrameProps {
  frame: number;
  label: string;
  sourceUrl?: string;
  className?: string;
}

export function AtlasFrame({ frame, label, sourceUrl = coreBattleAtlasUrl, className = "" }: AtlasFrameProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let cancelled = false;
    setFailed(false);
    const image = new Image();
    image.decoding = "async";
    image.onload = () => {
      if (cancelled) return;
      const context = canvas.getContext("2d", { alpha: true });
      if (!context) return;
      context.imageSmoothingEnabled = false;
      context.clearRect(0, 0, 192, 256);
      const safeFrame = Math.max(0, Math.min(47, Math.floor(frame)));
      context.drawImage(
        image,
        (safeFrame % 8) * 192,
        Math.floor(safeFrame / 8) * 256,
        192,
        256,
        0,
        0,
        192,
        256,
      );
    };
    image.onerror = () => {
      if (!cancelled) setFailed(true);
    };
    image.src = sourceUrl;
    return () => {
      cancelled = true;
    };
  }, [frame, sourceUrl]);

  if (failed) {
    return <span className={`irpg-atlas-frame irpg-asset-error ${className}`} role="img" aria-label={`${label}: oprawa niedostępna`}><PackageOpen aria-hidden="true" /></span>;
  }

  return (
    <canvas
      ref={canvasRef}
      className={`irpg-atlas-frame ${className}`}
      width={192}
      height={256}
      role="img"
      aria-label={label}
    />
  );
}

interface MapPanelProps {
  snapshot: IdleRpgSnapshot;
  dispatch: IdleRpgDispatch;
  onBack(): void;
}

export function MapPanel({ snapshot, dispatch, onBack }: MapPanelProps) {
  const locationStage = snapshot.location.kind === "campaign"
    ? snapshot.location.stage
    : snapshot.campaign.currentStage;
  const initialRealm = Math.max(0, Math.min(3, Math.floor((locationStage - 1) / 12)));
  const [realmIndex, setRealmIndex] = useState(initialRealm);
  const realm = REALMS[realmIndex];
  const realmStages = useMemo(
    () => Array.from({ length: 12 }, (_, index) => getStageDefinition(realm.stageFrom + index)),
    [realm.stageFrom],
  );
  const [selectedStage, setSelectedStage] = useState(() => Math.max(realm.stageFrom, Math.min(realm.stageTo, locationStage)));

  useEffect(() => {
    if (selectedStage < realm.stageFrom || selectedStage > realm.stageTo) {
      setSelectedStage(Math.min(realm.stageTo, Math.max(realm.stageFrom, snapshot.campaign.highestUnlockedStage)));
    }
  }, [realm.stageFrom, realm.stageTo, selectedStage, snapshot.campaign.highestUnlockedStage]);

  const selected = getStageDefinition(selectedStage);
  const selectedUnlocked = selected.stage <= snapshot.campaign.highestUnlockedStage;
  const isFarm = selected.stage < snapshot.campaign.highestUnlockedStage || snapshot.campaign.completed;

  return (
    <section className="irpg-map-screen" aria-labelledby="irpg-map-title">
      <header className="irpg-map-header">
        <button type="button" className="irpg-icon-button" onClick={onBack} aria-label="Wróć do walki">
          <ArrowLeft aria-hidden="true" />
        </button>
        <div>
          <span className="irpg-eyebrow">MAPA OTCHŁANI</span>
          <h2 id="irpg-map-title">{realm.name}</h2>
        </div>
        <div className="irpg-map-meta">
          <span className="irpg-realm-counter">KRAINA {realm.index + 1}/4</span>
          <span><Coins aria-hidden="true" /> {formatIdleNumber(snapshot.wallet.gold)}</span>
          <span><Gem aria-hidden="true" /> {formatIdleNumber(snapshot.wallet.materials)}</span>
        </div>
      </header>

      <div className="irpg-realm-switcher" aria-label="Wybór krainy">
        <button
          type="button"
          className="irpg-icon-button"
          onClick={() => setRealmIndex((value) => Math.max(0, value - 1))}
          disabled={realmIndex === 0}
          aria-label="Poprzednia kraina"
        >
          <ChevronLeft aria-hidden="true" />
        </button>
        <div className="irpg-realm-dots">
          {REALMS.map((candidate) => {
            const unlocked = candidate.stageFrom <= snapshot.campaign.highestUnlockedStage;
            return (
              <button
                key={candidate.id}
                type="button"
                className={candidate.index === realmIndex ? "is-active" : ""}
                onClick={() => unlocked && setRealmIndex(candidate.index)}
                disabled={!unlocked}
                aria-label={`${candidate.name}${unlocked ? "" : ", zablokowana"}`}
                aria-pressed={candidate.index === realmIndex}
              >
                {unlocked ? <Crown aria-hidden="true" /> : <LockKeyhole aria-hidden="true" />}
              </button>
            );
          })}
        </div>
        <button
          type="button"
          className="irpg-icon-button"
          onClick={() => setRealmIndex((value) => Math.min(3, value + 1))}
          disabled={realmIndex === 3 || REALMS[realmIndex + 1].stageFrom > snapshot.campaign.highestUnlockedStage}
          aria-label="Następna kraina"
        >
          <ChevronRight aria-hidden="true" />
        </button>
      </div>

      <div
        className="irpg-map-board"
        style={{ "--irpg-map-image": `url(${REALM_MAP_BACKDROPS[realm.index]})` } as CSSProperties}
      >
        <svg className="irpg-map-paths-layer" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
          <defs>
            <filter id="irpg-path-glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="0.8" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          {realmStages.slice(0, 11).map((fromStage, i) => {
            const toStage = realmStages[i + 1];
            const p1 = MAP_NODE_POSITIONS[i];
            const p2 = MAP_NODE_POSITIONS[i + 1];
            const isCompletedPath = toStage.stage <= snapshot.campaign.highestUnlockedStage;
            const isActivePath = fromStage.stage <= snapshot.campaign.highestUnlockedStage && toStage.stage === snapshot.campaign.highestUnlockedStage;
            const pathClass = isCompletedPath ? "is-completed" : isActivePath ? "is-active" : "is-locked";
            const mx = (p1[0] + p2[0]) / 2 + (i % 2 === 0 ? 1.5 : -1.5);
            const my = (p1[1] + p2[1]) / 2;
            const d = `M ${p1[0]} ${p1[1]} Q ${mx} ${my} ${p2[0]} ${p2[1]}`;
            return (
              <path
                key={`path-${fromStage.stage}-${toStage.stage}`}
                d={d}
                className={`irpg-map-path ${pathClass}`}
                filter={isCompletedPath || isActivePath ? "url(#irpg-path-glow)" : undefined}
              />
            );
          })}
        </svg>

        <div className="irpg-map-nodes">
          {realmStages.map((stage, index) => {
            const unlocked = stage.stage <= snapshot.campaign.highestUnlockedStage;
            const completed = stage.stage < snapshot.campaign.highestUnlockedStage || snapshot.campaign.completed;
            const current = stage.stage === snapshot.campaign.currentStage && !snapshot.campaign.completed;
            const selectedNode = stage.stage === selectedStage;
            return (
              <button
                key={stage.stage}
                type="button"
                className={`irpg-map-node is-${stage.kind}${completed ? " is-completed" : ""}${current ? " is-current" : ""}${selectedNode ? " is-selected" : ""}`}
                style={{ left: `${MAP_NODE_POSITIONS[index][0]}%`, top: `${MAP_NODE_POSITIONS[index][1]}%` }}
                onClick={() => unlocked && setSelectedStage(stage.stage)}
                disabled={!unlocked}
                aria-label={`Etap ${index + 1}: ${stage.enemyName}${unlocked ? "" : ", zablokowany"}`}
                aria-current={current ? "step" : undefined}
              >
                {current ? <span className="irpg-map-node-pulse" aria-hidden="true" /> : null}
                <span className="irpg-map-node-icon">
                  {unlocked ? (
                    stage.kind === "boss" ? <Crown aria-hidden="true" />
                      : stage.kind === "elite" ? <SkullNodeIcon />
                        : stage.hasChest ? <Gift aria-hidden="true" />
                          : <Swords aria-hidden="true" />
                  ) : <LockKeyhole aria-hidden="true" />}
                </span>
                <span className="irpg-map-node-badge">{index + 1}</span>
              </button>
            );
          })}
        </div>
      </div>

      <article className="irpg-stage-detail">
        <div className={`irpg-stage-emblem is-${selected.kind}`} aria-hidden="true">
          {selected.kind === "boss" ? <Crown /> : selected.kind === "elite" ? <Shield /> : selected.hasChest ? <Gift /> : <Swords />}
        </div>
        <div className="irpg-stage-copy">
          <span className="irpg-eyebrow">ETAP {selected.realmStage}</span>
          <h3>{selected.enemyName}</h3>
          <p>{selected.kind === "boss" ? "Władca krainy" : selected.kind === "elite" ? "Elitarny strażnik" : selected.hasChest ? "Etap ze skrzynią" : "Szlak kampanii"}</p>
        </div>
        <div className="irpg-stage-actions">
          <button
            type="button"
            className="irpg-primary-button"
            disabled={!selectedUnlocked}
            onClick={() => dispatch({ type: "select-stage", stage: selected.stage, mode: "advance" })}
            title="Rozpocznij od tego etapu i kontynuuj postęp"
          >
            <Swords aria-hidden="true" />
            WEJDŹ
          </button>
          {selectedUnlocked ? (
            <button
              type="button"
              className="irpg-secondary-button"
              onClick={() => dispatch({ type: "select-stage", stage: selected.stage, mode: "farm" })}
              title="Farmuj i powtarzaj ten etap"
            >
              FARMUJ
            </button>
          ) : null}
        </div>
      </article>
    </section>
  );
}

function SkullNodeIcon() {
  return <Shield aria-hidden="true" />;
}

interface HunterPanelProps {
  snapshot: IdleRpgSnapshot;
  dispatch: IdleRpgDispatch;
}

export function HunterPanel({ snapshot, dispatch }: HunterPanelProps) {
  const activeSummons = snapshot.summons.filter((summon) => summon.active).map((summon) => summon.id);

  const toggleSummon = (summonId: IdleRpgSummonId, active: boolean) => {
    const next = active
      ? activeSummons.filter((id) => id !== summonId)
      : [...activeSummons, summonId];
    if (next.length <= 3) dispatch({ type: "set-active-summons", summonIds: next });
  };

  return (
    <section className="irpg-panel-scroll" aria-labelledby="irpg-hunter-title">
      <article className="irpg-hunter-card">
        <AtlasFrame
          frame={0}
          label="Wędrowiec Południka"
          className="irpg-hunter-portrait"
        />
        <div className="irpg-hunter-summary">
          <span className="irpg-eyebrow">WĘDROWIEC POŁUDNIKA</span>
          <h2 id="irpg-hunter-title">Poziom {snapshot.hero.level}</h2>
          <p>Moc bojowa {formatIdleNumber(snapshot.hero.attack + snapshot.hero.defense + snapshot.hero.maxHp / 10)}</p>
          <div className="irpg-inline-bars">
            <StatusBar label="Punkty życia" value={snapshot.hero.hp} max={snapshot.hero.maxHp} tone="health" />
            <StatusBar label="Mana" value={snapshot.hero.mp} max={snapshot.hero.maxMp} tone="mana" />
          </div>
        </div>
      </article>

      <div className="irpg-section-heading">
        <div><span className="irpg-eyebrow">SYNCHRONIZACJA FITNESS</span><h3>Impuls treningowy</h3></div>
        <strong>{Math.round(snapshot.fitness.momentum * 100)}%</strong>
      </div>
      <div className="irpg-stat-grid">
        <StatTile icon={<Swords />} label="Atak" value={formatIdleNumber(snapshot.hero.attack)} />
        <StatTile icon={<Shield />} label="Obrona" value={formatIdleNumber(snapshot.hero.defense)} />
        <StatTile icon={<Heart />} label="Życie" value={formatIdleNumber(snapshot.hero.maxHp)} />
        <StatTile icon={<CircleGauge />} label="Kryt." value={`${Math.round(snapshot.hero.critChance * 100)}%`} />
        <StatTile icon={<Dumbbell />} label="Obciążenie" value={`${Math.round(snapshot.fitness.weeklyLoad * 100)}%`} />
        <StatTile icon={<TrendingUp />} label="Tempo" value={`${Math.round(snapshot.fitness.hastePct * 100)}%`} />
      </div>

      <div className="irpg-section-heading">
        <div><span className="irpg-eyebrow">UMIEJĘTNOŚCI</span><h3>Runiczne techniki ({snapshot.skills.filter((s) => s.unlocked).length}/{snapshot.skills.length})</h3></div>
        <Zap aria-hidden="true" />
      </div>
      <div className="irpg-list-stack">
        {snapshot.skills.map((skill, index) => {
          const canAfford = snapshot.wallet.gold >= skill.upgradeCost.gold && snapshot.wallet.materials >= skill.upgradeCost.materials;
          const nextMultiplier = Number((skill.multiplier * (1 + skill.level * 0.12)).toFixed(2));
          return (
            <article key={skill.id} className={`irpg-list-row irpg-skill-row${skill.unlocked ? "" : " is-locked"}`}>
              <div className="irpg-list-icon"><SkillGlyph index={index} /></div>
              <div className="irpg-list-copy">
                <div className="irpg-skill-header">
                  <strong>{skill.name}</strong>
                  <span className="irpg-level-pill">LV {skill.level}</span>
                </div>
                <span>{skill.description}</span>
                <div className="irpg-skill-chips">
                  {skill.unlocked ? (
                    <>
                      <span className="irpg-chip is-mana">⚡ {skill.manaCost} MP</span>
                      <span className="irpg-chip is-cd">⏱ {skill.cooldownMs / 1000}s</span>
                      <span className="irpg-chip is-dmg" title={`Następny poziom: x${nextMultiplier} DMG`}>⚔ x{skill.effectiveMultiplier} DMG</span>
                    </>
                  ) : (
                    <span className="irpg-chip is-locked">🔒 Odblokowanie: Etap {skill.unlockStage}</span>
                  )}
                </div>
              </div>
              {skill.unlocked ? (
                <div className="irpg-skill-upgrade-box">
                  <div className="irpg-upgrade-cost-preview">
                    <span>🪙 {formatIdleNumber(skill.upgradeCost.gold)}</span>
                    <span>🧱 {skill.upgradeCost.materials}</span>
                  </div>
                  <button
                    type="button"
                    className="irpg-upgrade-button"
                    disabled={!canAfford}
                    onClick={() => {
                      dispatch({ type: "upgrade-skill", skillId: skill.id });
                      playIdleUpgradeSfx();
                    }}
                    title={`Ulepsz do poziomu ${skill.level + 1} (DMG: x${nextMultiplier})`}
                  >
                    <ArrowUp aria-hidden="true" />
                    ULEPSZ
                  </button>
                </div>
              ) : null}
            </article>
          );
        })}
      </div>

      <div className="irpg-section-heading">
        <div><span className="irpg-eyebrow">ECHA</span><h3>Aktywne przywołania {activeSummons.length}/3</h3></div>
        <Sparkles aria-hidden="true" />
      </div>
      <div className="irpg-summon-grid">
        {snapshot.summons.map((summon) => {
          const full = activeSummons.length >= 3 && !summon.active;
          const portrait = SUMMON_PORTRAITS[summon.id];
          const upgradeCost = getSummonUpgradeCost(summon.id, summon.level);
          const canAfford = snapshot.wallet.gold >= upgradeCost.gold && snapshot.wallet.materials >= upgradeCost.materials;
          return (
            <article key={summon.id} className={`irpg-summon-card${summon.active ? " is-active" : ""}${summon.unlocked ? "" : " is-locked"}`}>
              <AtlasFrame
                frame={portrait.frame}
                sourceUrl={portrait.sourceUrl}
                label={summon.name}
              />
              <div className="irpg-summon-info">
                <strong>{summon.name}</strong>
                <span>Poziom {summon.level}</span>
                <small className="irpg-summon-stats">
                  ⚔ {formatIdleNumber(summon.baseAttack * (1 + (summon.level - 1) * 0.15))} • {(summon.attackIntervalMs / 1000).toFixed(1)}s
                </small>
              </div>
              <div className="irpg-summon-actions">
                <button
                  type="button"
                  className="irpg-secondary-button"
                  disabled={!summon.unlocked || full}
                  aria-pressed={summon.active}
                  onClick={() => toggleSummon(summon.id, summon.active)}
                >
                  {summon.unlocked ? summon.active ? "ODWOŁAJ" : "PRZYWOŁAJ" : `ETAP ${summon.unlockStage}`}
                </button>
                {summon.unlocked && (
                  <button
                    type="button"
                    className="irpg-summon-upgrade-button"
                    disabled={!canAfford}
                    onClick={() => {
                      dispatch({ type: "upgrade-summon", summonId: summon.id });
                      playIdleUpgradeSfx();
                    }}
                    aria-label={`Ulepsz ${summon.name} za ${upgradeCost.gold} złota i ${upgradeCost.materials} materiałów`}
                  >
                    <span>💰 {formatIdleNumber(upgradeCost.gold)} 💎 {upgradeCost.materials}</span>
                    <TrendingUp aria-hidden="true" />
                  </button>
                )}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

interface ArsenalPanelProps {
  snapshot: IdleRpgSnapshot;
  dispatch: IdleRpgDispatch;
}

export function ArsenalPanel({ snapshot, dispatch }: ArsenalPanelProps) {
  const [selectedId, setSelectedId] = useState<string | null>(() => snapshot.inventory[0]?.id ?? null);
  const selected = snapshot.inventory.find((item) => item.id === selectedId) ?? snapshot.inventory[0] ?? null;
  const equippedIds = new Set(Object.values(snapshot.equipped).filter(Boolean));

  return (
    <section className="irpg-panel-scroll" aria-labelledby="irpg-arsenal-title">
      <div className="irpg-section-heading">
        <div><span className="irpg-eyebrow">ARSENAŁ</span><h2 id="irpg-arsenal-title">Wyposażenie</h2></div>
        <span className="irpg-capacity"><Backpack aria-hidden="true" /> {snapshot.inventory.length}/100</span>
      </div>

      <div className="irpg-equipment-grid">
        {(Object.keys(EQUIPMENT_LABELS) as IdleRpgEquipmentSlot[]).map((slot) => {
          const itemId = snapshot.equipped[slot];
          const item = itemId ? snapshot.inventory.find((candidate) => candidate.id === itemId) : null;
          return (
            <article key={slot} className={`irpg-equipment-slot${item ? " is-equipped" : ""}`}>
              <img src={EQUIPMENT_IMAGES[slot]} alt="" aria-hidden="true" />
              <span>{EQUIPMENT_LABELS[slot]}</span>
              <strong>{item?.name ?? "Pusty slot"}</strong>
              {item ? <small>+{item.upgradeLevel}</small> : null}
            </article>
          );
        })}
      </div>

      {selected ? (
        <article className="irpg-upgrade-card">
          <img src={EQUIPMENT_IMAGES[selected.slot]} alt={selected.name} />
          <div className="irpg-upgrade-copy">
            <span className={`irpg-rarity is-${selected.rarity}`}>{selected.rarity}</span>
            <h3>{selected.name}</h3>
            <p>ATK {formatIdleNumber(selected.attack)} · OBR {formatIdleNumber(selected.defense)} · HP {formatIdleNumber(selected.hp)}</p>
          </div>
          <button
            type="button"
            className="irpg-primary-button"
            disabled={selected.upgradeLevel >= 10}
            onClick={() => {
              dispatch({ type: "upgrade-item", itemId: selected.id });
              playIdleUpgradeSfx();
            }}
          >
            <TrendingUp aria-hidden="true" />
            {selected.upgradeLevel >= 10 ? "MAX" : "ULEPSZ"}
          </button>
        </article>
      ) : (
        <article className="irpg-empty-state">
          <PackageOpen aria-hidden="true" />
          <h3>Arsenał czeka na pierwszy łup</h3>
          <p>Sprzęt wypada podczas walk kampanii.</p>
        </article>
      )}

      <div className="irpg-section-heading irpg-arsenal-actions-bar">
        <div><span className="irpg-eyebrow">PLECAK</span><h3>Zdobyty sprzęt ({snapshot.inventory.length}/100)</h3></div>
        <div className="irpg-bulk-actions">
          <button
            type="button"
            className="irpg-bulk-button is-equip"
            onClick={() => {
              const slots: IdleRpgEquipmentSlot[] = ["weapon", "armor", "gloves", "boots", "relic"];
              slots.forEach((slot) => {
                const slotItems = snapshot.inventory.filter((it) => it.slot === slot);
                if (slotItems.length === 0) return;
                const best = slotItems.reduce((prev, curr) => {
                  const pScore = prev.attack * 3 + prev.defense * 2 + prev.hp;
                  const cScore = curr.attack * 3 + curr.defense * 2 + curr.hp;
                  return cScore > pScore ? curr : prev;
                });
                if (snapshot.equipped[slot] !== best.id) {
                  dispatch({ type: "equip-item", itemId: best.id });
                }
              });
            }}
          >
            ZAŁÓŻ NAJLEPSZE
          </button>
          <button
            type="button"
            className="irpg-bulk-button is-sell"
            disabled={!snapshot.inventory.some((it) => it.rarity === "common" && !equippedIds.has(it.id))}
            onClick={() => {
              const toSell = snapshot.inventory.filter((it) => it.rarity === "common" && !equippedIds.has(it.id));
              toSell.forEach((it) => dispatch({ type: "sell-item", itemId: it.id }));
            }}
          >
            SPRZEDAJ ZWYKŁE
          </button>
        </div>
      </div>
      <div className="irpg-inventory-list">
        {snapshot.inventory.map((item) => (
          <InventoryRow
            key={item.id}
            item={item}
            selected={item.id === selected?.id}
            equipped={equippedIds.has(item.id)}
            onSelect={() => setSelectedId(item.id)}
            onEquip={() => dispatch({ type: "equip-item", itemId: item.id })}
            onSell={() => dispatch({ type: "sell-item", itemId: item.id })}
          />
        ))}
      </div>
    </section>
  );
}

function InventoryRow({ item, selected, equipped, onSelect, onEquip, onSell }: {
  key?: string;
  item: Readonly<IdleRpgItem>;
  selected: boolean;
  equipped: boolean;
  onSelect(): void;
  onEquip(): void;
  onSell(): void;
}) {
  return (
    <article className={`irpg-inventory-row is-${item.rarity}${selected ? " is-selected" : ""}${equipped ? " is-equipped" : ""}`}>
      <button type="button" className="irpg-item-main" onClick={onSelect} aria-pressed={selected}>
        <div className="irpg-item-icon-wrap">
          <img src={EQUIPMENT_IMAGES[item.slot]} alt="" aria-hidden="true" />
          {item.upgradeLevel > 0 ? <span className="irpg-item-level-tag">+{item.upgradeLevel}</span> : null}
        </div>
        <div className="irpg-item-details">
          <div className="irpg-item-name-row">
            <strong>{item.name}</strong>
            <span className={`irpg-item-rarity-badge is-${item.rarity}`}>{item.rarity}</span>
          </div>
          <div className="irpg-item-stat-chips">
            {item.attack > 0 ? <span>ATK +{formatIdleNumber(item.attack)}</span> : null}
            {item.defense > 0 ? <span>OBR +{formatIdleNumber(item.defense)}</span> : null}
            {item.hp > 0 ? <span>HP +{formatIdleNumber(item.hp)}</span> : null}
          </div>
        </div>
        {equipped ? <BadgeCheck aria-label="Założony" className="irpg-equipped-check" /> : null}
      </button>
      <div className="irpg-item-row-buttons">
        <button type="button" className="irpg-secondary-button is-small" onClick={onEquip} disabled={equipped}>ZAŁÓŻ</button>
        <button type="button" className="irpg-text-button is-danger is-small" onClick={onSell} disabled={equipped}>SPRZEDAJ</button>
      </div>
    </article>
  );
}

interface AfkPanelProps {
  snapshot: IdleRpgSnapshot;
  dispatch: IdleRpgDispatch;
  onEnterAbyss(): void;
}

export function AfkPanel({ snapshot, dispatch, onEnterAbyss }: AfkPanelProps) {
  const grant = snapshot.offline.pendingGrant;
  const elapsedLabel = grant ? formatDuration(grant.cappedSeconds) : "00:00";

  return (
    <section className="irpg-panel-scroll" aria-labelledby="irpg-afk-title">
      <article className="irpg-afk-hero">
        <div className="irpg-afk-visual"><Clock3 aria-hidden="true" /></div>
        <div>
          <span className="irpg-eyebrow">NAGRODY AFK</span>
          <h2 id="irpg-afk-title">Wyprawa trwa bez Ciebie</h2>
          <p>Limit naliczania: 12 godzin. Postęp Otchłani nie rośnie offline.</p>
        </div>
        <strong>{elapsedLabel}</strong>
      </article>

      <div className="irpg-reward-grid">
        <RewardTile icon={<Coins />} label="Złoto" value={formatIdleNumber(grant?.gold ?? 0)} />
        <RewardTile icon={<Sparkles />} label="Doświadczenie" value={formatIdleNumber(grant?.experience ?? 0)} />
        <RewardTile icon={<Gem />} label="Materiał" value={formatIdleNumber(grant?.materials ?? 0)} />
      </div>
      <button
        type="button"
        className="irpg-primary-button irpg-claim-button"
        disabled={!grant}
        onClick={() => dispatch({ type: "claim-offline", grantId: grant?.id })}
      >
        <Gift aria-hidden="true" />
        {grant ? "ODBIERZ NAGRODY" : "BRAK NAGRÓD"}
      </button>

      <article className={`irpg-abyss-card${snapshot.abyss.unlocked ? " is-unlocked" : ""}`}>
        <div className="irpg-section-heading">
          <div><span className="irpg-eyebrow">ENDGAME</span><h3>Wieczna Otchłań</h3></div>
          <Crown aria-hidden="true" />
        </div>
        {snapshot.abyss.unlocked ? (
          <>
            <div className="irpg-abyss-summary">
              <div><span>Głębokość</span><strong>{snapshot.abyss.currentDepth}</strong></div>
              <div><span>Rekord</span><strong>{snapshot.abyss.highestCompletedDepth}</strong></div>
              <div><span>Odłamki</span><strong>{formatIdleNumber(snapshot.wallet.abyssShards)}</strong></div>
            </div>
            <div className="irpg-mode-toggle" aria-label="Tryb Wiecznej Otchłani">
              <button
                type="button"
                className={snapshot.abyss.mode === "push" ? "is-active" : ""}
                aria-pressed={snapshot.abyss.mode === "push"}
                onClick={() => dispatch({ type: "set-abyss-mode", mode: "push" })}
              >PUSH</button>
              <button
                type="button"
                className={snapshot.abyss.mode === "harvest" ? "is-active" : ""}
                aria-pressed={snapshot.abyss.mode === "harvest"}
                onClick={() => dispatch({ type: "set-abyss-mode", mode: "harvest" })}
              >FARM</button>
            </div>
            <button type="button" className="irpg-primary-button" onClick={onEnterAbyss}>
              <Swords aria-hidden="true" /> WEJDŹ DO OTCHŁANI
            </button>
          </>
        ) : (
          <div className="irpg-abyss-locked">
            <LockKeyhole aria-hidden="true" />
            <div><strong>Pieczęć pozostaje zamknięta</strong><span>Ukończ etap 48 kampanii.</span></div>
          </div>
        )}
      </article>

      <div className="irpg-section-heading">
        <div><span className="irpg-eyebrow">DRZEWKO OTCHŁANI</span><h3>Stałe wzmocnienia</h3></div>
      </div>
      <div className="irpg-abyss-tree">
        {ABYSS_NODES.map((node) => {
          const cost = getAbyssUpgradeCost(snapshot.abyss.tree[node.id]);
          const canAfford = snapshot.abyss.unlocked && snapshot.wallet.abyssShards >= cost;
          return (
            <article key={node.id} className={snapshot.abyss.unlocked ? "" : "is-locked"}>
              <div className="irpg-list-icon">{node.icon}</div>
              <div className="irpg-abyss-copy">
                <strong>{node.name}</strong>
                <span>{node.description}</span>
              </div>
              <div className="irpg-abyss-action">
                <b className="irpg-level-badge">LV {snapshot.abyss.tree[node.id]}</b>
                {snapshot.abyss.unlocked && (
                  <button
                    type="button"
                    className="irpg-abyss-upgrade-button"
                    disabled={!canAfford}
                    onClick={() => {
                      dispatch({ type: "upgrade-abyss", node: node.id });
                      playIdleUpgradeSfx();
                    }}
                    aria-label={`Ulepsz: ${node.name} za ${cost} Odłamków Otchłani`}
                  >
                    <span>{cost} 💠</span>
                    <TrendingUp aria-hidden="true" />
                  </button>
                )}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

export function StatusBar({ label, value, max, tone }: { label: string; value: number; max: number; tone: "health" | "mana" | "experience" }) {
  return (
    <div className={`irpg-status-bar is-${tone}`}>
      <div><span>{label}</span><strong>{formatIdleNumber(value)} / {formatIdleNumber(max)}</strong></div>
      <progress value={clampPercent(value, max)} max={100} aria-label={`${label}: ${Math.round(clampPercent(value, max))}%`} />
    </div>
  );
}

function StatTile({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return <article className="irpg-stat-tile"><span>{icon}</span><small>{label}</small><strong>{value}</strong></article>;
}

function RewardTile({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return <article className="irpg-reward-tile"><span>{icon}</span><small>{label}</small><strong>{value}</strong></article>;
}

function SkillGlyph({ index }: { index: number }) {
  const icons = [<Swords />, <Zap />, <Sparkles />, <UserRound />, <Crown />];
  return icons[index % icons.length];
}

function formatDuration(seconds: number): string {
  const safeSeconds = Math.max(0, Math.floor(seconds));
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const remaining = safeSeconds % 60;
  return hours > 0
    ? `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`
    : `${minutes.toString().padStart(2, "0")}:${remaining.toString().padStart(2, "0")}`;
}
