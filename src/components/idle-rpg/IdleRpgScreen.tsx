import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  ArrowLeft,
  Backpack,
  Clock3,
  Coins,
  Crown,
  Gem,
  Gift,
  Heart,
  Map,
  PackageOpen,
  Shield,
  Sparkles,
  Swords,
  UserRound,
  X,
  Zap,
} from "lucide-react";

import weaponIconUrl from "../../assets/models/equipment/weapons/weapon-00.png";
import {
  createIdleRpgRuntime,
  getRealmForStage,
  getStageDefinition,
  type IdleRpgCommand,
  type IdleRpgEvent,
  type IdleRpgRuntime,
  type IdleRpgSkillId,
  type IdleRpgSnapshot,
} from "../../game/idle-rpg";
import { pushMusicContext } from "../../services/musicService";
import { lockAppPortrait } from "../../services/orientationService";
import { setNativeGameState } from "../../services/performanceService";
import type { PlayerState } from "../../types";
import { IdleBattleStage } from "./IdleBattleStage";
import {
  AfkPanel,
  ArsenalPanel,
  formatIdleNumber,
  HunterPanel,
  MapPanel,
  StatusBar,
} from "./IdleRpgPanels";
import "./idle-rpg.css";

export interface IdleRpgScreenProps {
  profile: Readonly<PlayerState>;
  onClose(): void;
}

type IdleTab = "battle" | "hunter" | "arsenal" | "afk";

const TABS: ReadonlyArray<{ id: IdleTab; label: string; icon: ReactNode }> = [
  { id: "battle", label: "WALKA", icon: <Swords aria-hidden="true" /> },
  { id: "hunter", label: "ŁOWCA", icon: <UserRound aria-hidden="true" /> },
  { id: "arsenal", label: "ARSENAŁ", icon: <Backpack aria-hidden="true" /> },
  { id: "afk", label: "AFK", icon: <Clock3 aria-hidden="true" /> },
];

const SKILL_ICONS: Record<IdleRpgSkillId, ReactNode> = {
  "meridian-rend": <Swords aria-hidden="true" />,
  "seam-step": <Zap aria-hidden="true" />,
  "shard-rain": <Sparkles aria-hidden="true" />,
  "echo-call": <UserRound aria-hidden="true" />,
  "last-meridian": <Crown aria-hidden="true" />,
};

export function IdleRpgScreen({ profile, onClose }: IdleRpgScreenProps) {
  const profileRef = useRef(profile);
  const [runtime, setRuntime] = useState<IdleRpgRuntime | null>(null);
  const [tab, setTab] = useState<IdleTab>("battle");
  const [mapOpen, setMapOpen] = useState(false);
  const [announcement, setAnnouncement] = useState("Pęknięty Południk jest gotowy.");
  const [nativeReducedMotion, setNativeReducedMotion] = useState(false);
  const navigationRef = useRef({ mapOpen, tab, close: onClose });

  profileRef.current = profile;
  navigationRef.current = { mapOpen, tab, close: onClose };

  useEffect(() => {
    const nextRuntime = createIdleRpgRuntime({
      profile: profileRef.current,
      getProfile: () => profileRef.current,
    });
    setRuntime(nextRuntime);
    return () => {
      nextRuntime.pause("screen-unmount");
      nextRuntime.dispose();
    };
  }, []);

  const snapshot = useThrottledSnapshot(runtime);

  useEffect(() => {
    void lockAppPortrait();
    void setNativeGameState("loading");
    const restoreMusicContext = pushMusicContext("idle-rpg");
    return () => {
      restoreMusicContext();
      void setNativeGameState("app");
      void lockAppPortrait();
    };
  }, []);

  useEffect(() => {
    if (!snapshot) return;
    void setNativeGameState(snapshot.phase === "paused" ? "paused" : "miniGame");
  }, [snapshot?.phase]);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setNativeReducedMotion(media.matches);
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    if (!runtime) return;
    const handleVisibility = () => {
      if (document.hidden) runtime.pause("document-hidden");
      else runtime.resume(Date.now());
    };
    const handlePageHide = () => runtime.pause("page-hide");
    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("pagehide", handlePageHide);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("pagehide", handlePageHide);
    };
  }, [runtime]);

  useEffect(() => {
    if (!runtime) return;
    let lastAnnouncementAt = 0;
    return runtime.subscribeEvents((event) => {
      const next = eventAnnouncement(event);
      if (!next) return;
      const now = Date.now();
      const important = event.type === "death" || event.type === "level-up" || event.type === "save-error";
      if (!important && now - lastAnnouncementAt < 900) return;
      lastAnnouncementAt = now;
      setAnnouncement(next);
    });
  }, [runtime]);

  const dispatch = useCallback((command: IdleRpgCommand) => {
    if (!runtime) return undefined;
    const result = runtime.dispatch(command);
    if (!result.ok) setAnnouncement(result.reason);
    return result;
  }, [runtime]);

  const subscribeBattleEvents = useCallback((listener: (event: IdleRpgEvent) => void) => (
    runtime?.subscribeEvents(listener) ?? (() => undefined)
  ), [runtime]);

  const close = useCallback(() => {
    runtime?.pause("screen-close");
    onClose();
  }, [onClose, runtime]);

  navigationRef.current.close = close;

  useEffect(() => {
    if (!runtime) return;
    let cancelled = false;
    const handles: Array<{ remove(): Promise<void> }> = [];

    void import("@capacitor/app").then(async ({ App }) => {
      const appStateHandle = await App.addListener("appStateChange", ({ isActive }) => {
        if (isActive) runtime.resume(Date.now());
        else runtime.pause("capacitor-app-state");
      });
      if (cancelled) {
        await appStateHandle.remove();
        return;
      }
      handles.push(appStateHandle);

      const pauseHandle = await App.addListener("pause", () => runtime.pause("capacitor-pause"));
      if (cancelled) {
        await pauseHandle.remove();
        return;
      }
      handles.push(pauseHandle);

      const resumeHandle = await App.addListener("resume", () => runtime.resume(Date.now()));
      if (cancelled) {
        await resumeHandle.remove();
        return;
      }
      handles.push(resumeHandle);

      const backHandle = await App.addListener("backButton", () => {
        const navigation = navigationRef.current;
        if (navigation.mapOpen) {
          setMapOpen(false);
        } else if (navigation.tab !== "battle") {
          setTab("battle");
        } else {
          navigation.close();
        }
      });
      if (cancelled) await backHandle.remove();
      else handles.push(backHandle);
    }).catch(() => {
      // Web preview and unsupported shells continue with document lifecycle.
    });

    return () => {
      cancelled = true;
      for (const handle of handles) void handle.remove();
    };
  }, [runtime]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      if (mapOpen) setMapOpen(false);
      else if (tab !== "battle") setTab("battle");
      else close();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [close, mapOpen, tab]);

  if (!snapshot) {
    return (
      <div className="irpg-screen irpg-loading-screen" role="dialog" aria-modal="true" aria-label="Ładowanie Pękniętego Południka">
        <Sparkles aria-hidden="true" />
        <strong>PĘKNIĘTY POŁUDNIK</strong>
        <span>Przywoływanie wyprawy…</span>
      </div>
    );
  }

  const reducedMotion = profile.settings.reducedMotion || nativeReducedMotion;
  const locationTitle = snapshot.location.kind === "campaign"
    ? `${getRealmForStage(snapshot.location.stage).name} ${getStageDefinition(snapshot.location.stage).realmStage}/12`
    : `Otchłań ${snapshot.location.depth}-${snapshot.location.wave}`;

  return (
    <div
      className={`irpg-screen${reducedMotion ? " is-reduced-motion" : ""}`}
      role="dialog"
      aria-modal="true"
      aria-label="Pęknięty Południk, mini Idle RPG"
    >
      <div className="irpg-live-region" aria-live="polite" aria-atomic="true">{announcement}</div>

      {!mapOpen ? (
        <TopHud snapshot={snapshot} locationTitle={locationTitle} onClose={close} />
      ) : null}

      <main className={`irpg-main${mapOpen ? " is-map" : ""}`}>
        {mapOpen ? (
          <MapPanel
            snapshot={snapshot}
            dispatch={(command) => {
              dispatch(command);
              if (command.type === "select-stage") {
                setMapOpen(false);
                setTab("battle");
              }
            }}
            onBack={() => setMapOpen(false)}
          />
        ) : tab === "battle" ? (
          <BattlePanel
            snapshot={snapshot}
            reducedMotion={reducedMotion}
            graphicsQuality={profile.settings.graphicsQuality ?? "balanced"}
            dispatch={dispatch}
            subscribeEvents={subscribeBattleEvents}
            onOpenMap={() => setMapOpen(true)}
          />
        ) : tab === "hunter" ? (
          <HunterPanel snapshot={snapshot} dispatch={dispatch} />
        ) : tab === "arsenal" ? (
          <ArsenalPanel snapshot={snapshot} dispatch={dispatch} />
        ) : (
          <AfkPanel
            snapshot={snapshot}
            dispatch={dispatch}
            onEnterAbyss={() => {
              const result = dispatch({ type: "enter-abyss" });
              if (result?.ok) {
                setMapOpen(false);
                setTab("battle");
              }
            }}
          />
        )}
      </main>

      {!mapOpen ? <BottomTabs active={tab} onChange={setTab} /> : null}
    </div>
  );
}

function TopHud({ snapshot, locationTitle, onClose }: {
  snapshot: IdleRpgSnapshot;
  locationTitle: string;
  onClose(): void;
}) {
  return (
    <header className="irpg-top-hud">
      <button type="button" className="irpg-icon-button" onClick={onClose} aria-label="Zamknij Idle RPG">
        <X aria-hidden="true" />
      </button>
      <div className="irpg-location-title">
        <span className="irpg-eyebrow">PĘKNIĘTY POŁUDNIK</span>
        <strong>{locationTitle}</strong>
      </div>
      <div className="irpg-wallet" aria-label="Portfel Idle RPG">
        <span className="irpg-wallet-health"><Heart aria-hidden="true" /> {formatIdleNumber(snapshot.hero.hp)} / {formatIdleNumber(snapshot.hero.maxHp)}</span>
        <span><Coins aria-hidden="true" /> {formatIdleNumber(snapshot.wallet.gold)}</span>
        <span><Gem aria-hidden="true" /> {formatIdleNumber(snapshot.wallet.materials)}</span>
      </div>
    </header>
  );
}

function BattlePanel({ snapshot, reducedMotion, graphicsQuality, dispatch, subscribeEvents, onOpenMap }: {
  snapshot: IdleRpgSnapshot;
  reducedMotion: boolean;
  graphicsQuality: PlayerState["settings"]["graphicsQuality"];
  dispatch(command: IdleRpgCommand): void;
  subscribeEvents(listener: (event: IdleRpgEvent) => void): () => void;
  onOpenMap(): void;
}) {
  const location = snapshot.location;
  const stageDefinition = location.kind === "campaign" ? getStageDefinition(location.stage) : null;
  const realmStage = location.kind === "campaign" ? getStageDefinition(location.stage).realmStage : location.wave;
  const realmIndex = location.kind === "campaign"
    ? getStageDefinition(location.stage).realmIndex
    : ((Math.max(1, location.depth) - 1) % 4) as 0 | 1 | 2 | 3;
  const bossDistance = location.kind === "campaign" ? Math.max(0, 12 - realmStage) : Math.max(0, 10 - location.wave);
  const weapon = snapshot.inventory.find((item) => item.id === snapshot.equipped.weapon)
    ?? snapshot.inventory.find((item) => item.slot === "weapon")
    ?? null;
  const enemy = snapshot.encounter.enemy;
  const combatActive = snapshot.phase === "fighting" || snapshot.phase === "enemy-entering";

  return (
    <section className="irpg-battle-panel" aria-labelledby="irpg-battle-title">
      <div className="irpg-progress-rail">
        <ProgressMilestone
          active={enemy.kind === "normal"}
          icon={<Swords />}
          label={`WALKA ${realmStage}`}
          tone="cyan"
        />
        <ProgressMilestone
          active={Boolean(stageDefinition?.hasChest)}
          icon={<Gift />}
          label={stageDefinition?.hasChest ? "SKRZYNIA" : "ŁUP"}
          tone="gold"
        />
        <ProgressMilestone
          active={enemy.kind === "boss"}
          icon={<Crown />}
          label={`BOSS ${location.kind === "campaign" ? 12 : 10}`}
          tone="red"
        />
        <button type="button" className="irpg-map-button" onClick={onOpenMap}>
          <Map aria-hidden="true" /> MAPA
        </button>
        <span className="irpg-boss-distance">{bossDistance === 0 ? "WALKA Z BOSSEM" : `BOSS ZA ${bossDistance} ${bossDistance === 1 ? "ETAP" : "ETAPY"}`}</span>
      </div>

      <div className="irpg-stage-wrap">
        <IdleBattleStage
          model={{
            phase: snapshot.phase,
            encounterSerial: snapshot.encounter.serial,
            enemyTier: enemy.kind,
            enemyVariant: ((realmStage - 1) % 3) as 0 | 1 | 2,
            enemyHp: enemy.hp,
            enemyMaxHp: enemy.maxHp,
            heroHp: snapshot.hero.hp,
            heroMaxHp: snapshot.hero.maxHp,
            realmIndex,
            activeSummons: snapshot.summons.filter((summon) => summon.active).slice(0, 3).map((summon) => summon.id),
            graphicsQuality,
            reducedMotion,
          }}
          subscribeEvents={subscribeEvents}
        />
        <div className="irpg-battle-controls" aria-label="Sterowanie walką">
          <button
            type="button"
            className={snapshot.settings.autoBattle ? "is-active" : ""}
            aria-pressed={snapshot.settings.autoBattle}
            onClick={() => dispatch({ type: "toggle-auto" })}
            title="Automatyczne używanie umiejętności"
          >
            AUTO
          </button>
          <button
            type="button"
            className={snapshot.settings.battleSpeed === 2 ? "is-active" : ""}
            aria-pressed={snapshot.settings.battleSpeed === 2}
            onClick={() => dispatch({ type: "set-speed", speed: snapshot.settings.battleSpeed === 2 ? 1 : 2 })}
            title="Prędkość walki"
          >
            ×{snapshot.settings.battleSpeed}
          </button>
          {location.kind === "campaign" ? (
            <button
              type="button"
              className={snapshot.campaign.farmingStage !== null ? "is-farming" : "is-active"}
              onClick={() => dispatch({ type: "toggle-farm" })}
              title={snapshot.campaign.farmingStage !== null ? "Tryb powtarzania etapu (Farma). Kliknij, aby postępować dalej." : "Automatyczny postęp etapów. Kliknij, aby farmować ten etap."}
            >
              {snapshot.campaign.farmingStage !== null ? "FARMA" : "POSTĘP"}
            </button>
          ) : null}
        </div>
        <div className="irpg-enemy-hud" aria-label="Zdrowie przeciwnika">
          <div className="irpg-enemy-hud-top">
            <span className={`irpg-enemy-kind is-${enemy.kind}`}>
              {enemy.kind === "boss" ? "BOSS" : enemy.kind === "elite" ? "ELITA" : "PRZECIWNIK"}
            </span>
            <strong className="irpg-enemy-name">{enemy.name}</strong>
          </div>
          <StatusBar label="Życie wroga" value={enemy.hp} max={enemy.maxHp} tone="health" />
        </div>
        <div className="irpg-mana-readout" aria-label={`Mana ${formatIdleNumber(snapshot.hero.mp)} z ${formatIdleNumber(snapshot.hero.maxMp)}`}>
          <Zap aria-hidden="true" /> MP {formatIdleNumber(snapshot.hero.mp)} / {formatIdleNumber(snapshot.hero.maxMp)}
        </div>
        <span className="irpg-phase-label" id="irpg-battle-title">{phaseLabel(snapshot.phase)}</span>
      </div>

      <div className="irpg-skill-dock" aria-label="Umiejętności bojowe">
        {snapshot.skills.map((skill, index) => {
          const coolingDown = skill.cooldownRemainingMs > 0;
          const disabled = !skill.unlocked || coolingDown || snapshot.hero.mp < skill.manaCost || !combatActive;
          return (
            <button
              key={skill.id}
              type="button"
              className={skill.isUltimate ? "is-ultimate" : ""}
              disabled={disabled}
              onClick={() => dispatch({ type: "use-skill", skillId: skill.id })}
              aria-label={`${skill.name}, koszt ${skill.manaCost} many${coolingDown ? `, odnowienie ${Math.ceil(skill.cooldownRemainingMs / 1000)} sekund` : ""}`}
            >
              {SKILL_ICONS[skill.id]}
              <span>{index + 1}</span>
              {coolingDown ? <b>{Math.ceil(skill.cooldownRemainingMs / 1000)}</b> : null}
              <small>{skill.unlocked ? `${skill.manaCost} MP` : `ETAP ${skill.unlockStage}`}</small>
            </button>
          );
        })}
      </div>

      <article className="irpg-quick-upgrade">
        {weapon ? (
          <>
            <img src={weaponIconUrl} alt={weapon.name} />
            <div>
              <span className="irpg-eyebrow">ULEPSZ OSTRZE</span>
              <strong>{weapon.name} +{weapon.upgradeLevel}</strong>
              <small>ATK {formatIdleNumber(weapon.attack)} · MAX +10</small>
            </div>
            <button
              type="button"
              className="irpg-primary-button"
              disabled={weapon.upgradeLevel >= 10}
              onClick={() => dispatch({ type: "upgrade-item", itemId: weapon.id })}
            >
              <Sparkles aria-hidden="true" /> {weapon.upgradeLevel >= 10 ? "MAX" : "ULEPSZ"}
            </button>
          </>
        ) : (
          <>
            <div className="irpg-quick-empty"><PackageOpen aria-hidden="true" /></div>
            <div><span className="irpg-eyebrow">ARSENAŁ</span><strong>Pierwsze ostrze czeka w kampanii</strong><small>Pokonuj przeciwników, aby zdobyć sprzęt.</small></div>
          </>
        )}
      </article>
    </section>
  );
}

function ProgressMilestone({ active, icon, label, tone }: { active: boolean; icon: ReactNode; label: string; tone: "cyan" | "gold" | "red" }) {
  return <div className={`irpg-milestone is-${tone}${active ? " is-active" : ""}`}><span>{icon}</span><strong>{label}</strong></div>;
}

function BottomTabs({ active, onChange }: { active: IdleTab; onChange(tab: IdleTab): void }) {
  return (
    <nav className="irpg-bottom-tabs" aria-label="Sekcje Idle RPG">
      {TABS.map((tab) => (
        <button
          key={tab.id}
          type="button"
          className={active === tab.id ? "is-active" : ""}
          aria-current={active === tab.id ? "page" : undefined}
          onClick={() => onChange(tab.id)}
        >
          {tab.icon}
          <span>{tab.label}</span>
        </button>
      ))}
    </nav>
  );
}

function useThrottledSnapshot(runtime: IdleRpgRuntime | null): IdleRpgSnapshot | null {
  const [snapshot, setSnapshot] = useState<IdleRpgSnapshot | null>(() => runtime?.getSnapshot() ?? null);

  useEffect(() => {
    if (!runtime) {
      setSnapshot(null);
      return;
    }

    let timer: number | null = null;
    let lastCommit = 0;
    const commit = () => {
      timer = null;
      lastCommit = performance.now();
      setSnapshot(runtime.getSnapshot());
    };
    const schedule = () => {
      const elapsed = performance.now() - lastCommit;
      if (elapsed >= 100) commit();
      else if (timer === null) timer = window.setTimeout(commit, 100 - elapsed);
    };

    commit();
    const unsubscribe = runtime.subscribe(schedule);
    return () => {
      unsubscribe();
      if (timer !== null) window.clearTimeout(timer);
    };
  }, [runtime]);

  return snapshot;
}

function phaseLabel(phase: IdleRpgSnapshot["phase"]): string {
  const labels: Record<IdleRpgSnapshot["phase"], string> = {
    loading: "ŁADOWANIE WYPRAWY",
    "enemy-entering": "NADCHODZI PRZECIWNIK",
    fighting: "AUTOMATYCZNA WALKA",
    "enemy-dying": "ZWYCIĘSTWO",
    marching: "MARSZ DO KOLEJNEGO ETAPU",
    "realm-clear": "KRAINA UKOŃCZONA",
    "hero-dying": "WĘDROWIEC UPADA",
    respawning: "ODRODZENIE",
    "campaign-complete": "KAMPANIA UKOŃCZONA",
    "abyss-depth-clear": "GŁĘBOKOŚĆ ZDOBYTA",
    paused: "WYPRAWA WSTRZYMANA",
  };
  return labels[phase];
}

function eventAnnouncement(event: IdleRpgEvent): string | null {
  switch (event.type) {
    case "hit": return event.critical ? `Cios krytyczny: ${formatIdleNumber(event.damage)} obrażeń.` : null;
    case "death": return event.actor === "enemy" ? "Przeciwnik pokonany." : "Wędrowiec został pokonany.";
    case "encounter-settled": return `Zdobyto ${formatIdleNumber(event.gold)} złota i ${formatIdleNumber(event.experience)} doświadczenia.`;
    case "loot": return event.item ? `Zdobyto przedmiot: ${event.item.name}.` : event.salvagedMaterials > 0 ? `Nadmiarowy łup rozłożono na ${event.salvagedMaterials} materiałów.` : null;
    case "level-up": return `Nowy poziom bohatera: ${event.level}.`;
    case "realm-unlocked": return `Odblokowano krainę ${event.realmIndex + 1}.`;
    case "abyss-unlocked": return "Odblokowano Wieczną Otchłań.";
    case "offline-claimed": return "Nagrody AFK zostały odebrane.";
    case "save-error": return `Błąd zapisu wyprawy: ${event.message}`;
    case "asset-error": return "Nie udało się załadować jednego z elementów oprawy.";
    default: return null;
  }
}
