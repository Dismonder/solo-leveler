import { Fragment, memo, useCallback, useEffect, useMemo, useRef, useState, type PointerEvent, type ReactNode } from "react";
import { App as CapacitorApp } from "@capacitor/app";
import type { PluginListenerHandle } from "@capacitor/core";
import { AnimatePresence, motion } from "motion/react";
import { Bomb, Brain, Clock3, Coins, Crosshair, Gamepad2, Grid2X2, HeartPulse, KeyRound, Music2, RotateCw, ShoppingBag, Shuffle, Sparkles, Swords, Target, Trophy, Volume2, VolumeX, X } from "lucide-react";
import { MINI_GAME_CATALOG, canUseMiniGameRank, type MiniGameDefinition } from "../game/miniGameCatalog";
import { XP_REQUIRED } from "../game/gameConfig";
import {
  getExtractionSignalWindowMs,
  getMemoryStepMs,
  getMiniGameDifficulty,
  getRuneLockWindowMs,
  getStrikeWindow,
  getStrikeZoneWidth,
} from "../game/miniGameDifficulty";
import {
  createDefaultMiniGameProgress,
  type MiniGameCompletionInput,
  type MiniGameId,
  type MiniGameProgress,
} from "../game/miniGameProgress";
import {
  applyCappedTimeBonus,
  pathBoundsCouldIntersectCircle,
  randomPointAwayFrom,
  slicePathIntersectsTarget,
  spawnNonOverlappingObjects,
  type SegmentPoint,
  type SpawnCircle,
} from "../game/miniGameGeometry";
import {
  getShadowExtractionEffect,
  normalizeShadowExtractionUpgrades,
  type ShadowExtractionEffectId,
  type ShadowExtractionUpgradeId,
  type ShadowExtractionUpgrades,
} from "../game/shadowExtractionUpgrades";
import {
  MINI_GAME_SHOP_BOOSTERS,
  MINI_GAME_SHOP_EFFECTS,
  MINI_GAME_SHOP_UPGRADES,
  getMiniGameShopBonuses,
  getNextMiniGameUpgradeCost,
  getSelectedMiniGameShopEffect,
  normalizeMiniGameShop,
  type MiniGameShopBonusSummary,
  type MiniGameShopBoosterId,
  type MiniGameShopEffectDefinition,
  type MiniGameShopEffectId,
  type MiniGameShopState,
  type MiniGameShopUpgradeId,
} from "../game/miniGameShop";
import {
  getEquippedMiniGameBonuses,
  type MiniGameRelicBonusSummary,
} from "../game/equipment";
import {
  getAvailableBackgroundsForGame,
  getSelectedBackgroundForGame,
  isMiniGameBackgroundOwned,
  normalizeMiniGameBackgrounds,
  type MiniGameBackgroundDefinition,
} from "../game/miniGameBackgrounds";
import { isMiniGameGridEnabled } from "../game/miniGameGrid";
import { isNativeOrientationAvailable, lockAppLandscape, lockAppPortrait } from "../services/orientationService";
import { getSmoothUiIntervalMs, setNativeGameState } from "../services/performanceService";
import { MOBILE_THEME_ASSETS, getMiniGameThemeAsset } from "../services/mobileThemeAssets";
import { getRankForLevel, type RankLetter } from "../services/systemLogic";
import {
  getShadowExtractionImpactBudget,
  getShadowExtractionImpactLifetimeMs,
  getShadowExtractionObjectBudget,
} from "../gameRuntime/miniGamePerformance";
import type { MiniGameBackgroundsState, MiniGameSettlement, PlayerState } from "../types";
import {
  playGameFailSound,
  playGateSound,
  playMiniGameComboSound,
  playMiniGameHitSound,
  playMiniGamePenaltySound,
  playRewardSound,
} from "../utils/audio";

type BonusMiniGamesPanelProps = {
  player: PlayerState;
  dailyUnlocked: boolean;
  unlockAll: boolean;
  progressPercent: number;
  onLaunchGame: (gameId: MiniGameId) => void;
};

type GameRuntimeScreenProps = {
  gameId: MiniGameId;
  player: PlayerState;
  onComplete: (result: MiniGameCompletionInput) => MiniGameSettlement | null;
  onExit: () => void;
  onBuyShadowExtractionEffect: (effectId: ShadowExtractionEffectId) => void;
  onBuyShadowExtractionUpgrade: (upgradeId: ShadowExtractionUpgradeId) => void;
  onSelectShadowExtractionEffect: (effectId: ShadowExtractionEffectId) => void;
  onBuyMiniGameEffect: (gameId: MiniGameId, effectId: MiniGameShopEffectId) => void;
  onSelectMiniGameEffect: (gameId: MiniGameId, effectId: MiniGameShopEffectId) => void;
  onBuyMiniGameUpgrade: (gameId: MiniGameId, upgradeId: MiniGameShopUpgradeId) => void;
  onBuyMiniGameBooster: (gameId: MiniGameId, boosterId: MiniGameShopBoosterId) => void;
  onActivateMiniGameBooster: (gameId: MiniGameId, boosterId: MiniGameShopBoosterId) => void;
  onConsumeMiniGameBooster: (gameId: MiniGameId) => void;
  backgroundMusicEnabled: boolean;
  systemAudioEnabled: boolean;
  onToggleBackgroundMusic: (enabled: boolean) => void;
  onToggleSystemAudio: (enabled: boolean) => void;
  onRandomizeMusicTrack: () => void;
  miniGameBackgrounds: MiniGameBackgroundsState;
  onBuyMiniGameBackground: (gameId: MiniGameId, backgroundId: string) => void;
  onSelectMiniGameBackground: (gameId: MiniGameId, backgroundId: string) => void;
  onImportMiniGameBackground: (gameId: MiniGameId, file: File) => Promise<void>;
  onToggleMiniGameGrid: (gameId: MiniGameId, enabled: boolean) => void;
};

type ActiveGameProps = {
  definition: MiniGameDefinition;
  progress: MiniGameProgress;
  onComplete: (result: MiniGameCompletionInput) => void;
  onRuntimeStateChange?: (state: MiniGameRuntimeState) => void;
  onExit?: () => void;
  paused?: boolean;
  orientationMode?: MiniGameOrientationMode;
  stageBackground: MiniGameBackgroundDefinition;
  relicBonuses: MiniGameRelicBonusSummary;
  stageEffect: MiniGameShopEffectDefinition;
  showGrid: boolean;
  graphicsQuality: PlayerState["settings"]["graphicsQuality"];
};

type ActiveMiniGameProps = ActiveGameProps & {
  player: PlayerState;
  onBuyShadowExtractionEffect: (effectId: ShadowExtractionEffectId) => void;
  onBuyShadowExtractionUpgrade: (upgradeId: ShadowExtractionUpgradeId) => void;
  onSelectShadowExtractionEffect: (effectId: ShadowExtractionEffectId) => void;
  stageBackground: MiniGameBackgroundDefinition;
};

type ScorePopupState = { id: number; value: number } | null;
type MiniGameOrientationMode = "landscape" | "portrait";
type MiniGameRuntimeState = "ready" | "running" | "finished";
type PlayfieldSize = { width: number; height: number };
const SHADOW_HEART_HEAL_RATIO = 0.05;
const SHADOW_HEART_CHANCE = 0.0045;
const SHADOW_LAST_CHANCE_HEART_CHANCE = 0.018;
const SHADOW_TIME_BUBBLE_CHANCE = 0.006;
const SHADOW_TIME_BUBBLE_BONUS_MS = 4_800;

const GAME_SECONDS = 30;
const MAX_REMAINING_TIME_MS = 42_000;
const GATE_TIME_CAP_MS = 28_000;
const RUNES = ["I", "II", "III", "IV"];
const PLAYFIELD_BOUNDS = { minX: 8, maxX: 92, minY: 12, maxY: 86 };
const SHADOW_EXTRACTION_TRAIL_INTERVAL_MS: Record<PlayerState["settings"]["graphicsQuality"], number> = {
  performance: 24,
  balanced: 16,
  cinematic: 8,
};
const SHADOW_EXTRACTION_OBJECT_RENDER_INTERVAL_MS: Record<PlayerState["settings"]["graphicsQuality"], number> = {
  performance: 24,
  balanced: 16,
  cinematic: 16,
};
const SHADOW_EXTRACTION_STUTTER_MS = 22;
const SHADOW_EXTRACTION_HARD_STUTTER_MS = 28;
const SHADOW_EXTRACTION_PRESSURE_MS = 1400;
const SHADOW_EXTRACTION_PRESSURE_RENDER_INTERVAL_MS = 24;
const SHADOW_EXTRACTION_PRESSURE_TRAIL_INTERVAL_MS = 16;

function playMiniGameStartCue() {
  playGateSound();
}

function playMiniGameFinishCue(finalScore: number, definition: MiniGameDefinition) {
  if (finalScore >= definition.winScore) {
    playRewardSound();
  } else {
    playGameFailSound();
  }
}

function useRotatingTip(tips: string[], intervalMs = 4600) {
  const cleanTips = tips.filter(Boolean);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    setIndex(0);
    if (cleanTips.length <= 1) return;
    const timer = window.setInterval(() => {
      setIndex((current) => (current + 1) % cleanTips.length);
    }, intervalMs);
    return () => window.clearInterval(timer);
  }, [cleanTips.join("|"), cleanTips.length, intervalMs]);

  return cleanTips[index] ?? "";
}

export function BonusMiniGamesPanel({
  player,
  dailyUnlocked,
  unlockAll,
  progressPercent,
  onLaunchGame,
}: BonusMiniGamesPanelProps) {
  const rank = getRankForLevel(player.level);
  const [blockedNotice, setBlockedNotice] = useState<string | null>(null);

  const unlockedCount = useMemo(
    () => unlockAll ? MINI_GAME_CATALOG.length : MINI_GAME_CATALOG.filter((game) => canUseMiniGameRank(rank, game.requiredRank)).length,
    [rank, unlockAll]
  );

  const launchGame = (game: MiniGameDefinition) => {
    const rankUnlocked = unlockAll || canUseMiniGameRank(rank, game.requiredRank);
    const gameUnlocked = unlockAll || dailyUnlocked;
    if (!rankUnlocked) {
      setBlockedNotice(`Wymagana ranga ${game.requiredRank}.`);
      return;
    }
    if (player.hp <= 0 && game.id !== "shadow-extraction") {
      setBlockedNotice("Brak HP. Odzyskaj zdrowie ćwiczeniem albo poszukaj legendarnej bańki serca w Ekstrakcji Cienia.");
      return;
    }
    if (!gameUnlocked) {
      setBlockedNotice(`Osiągnij 50% dzisiejszego treningu. Teraz: ${Math.floor(progressPercent)}%.`);
      return;
    }
    setBlockedNotice(null);
    onLaunchGame(game.id);
  };

  return (
    <div className="space-y-2.5">
      <div className="sl-section relative overflow-hidden rounded-[22px] px-3 py-2.5">
        <img
          src={MOBILE_THEME_ASSETS.hubCards.gateDodge}
          alt=""
          loading="eager"
          decoding="async"
          className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-[0.13] mix-blend-screen"
        />
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(100deg,var(--theme-panel),color-mix(in_srgb,var(--theme-panel)_72%,transparent))]" />
        <div className="relative flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="sl-kicker font-mono text-[9px] font-black uppercase tracking-[0.26em]">System Gates</p>
            <h2 className="mt-0.5 text-xl font-black uppercase tracking-[0.05em] text-[var(--theme-text-strong)]">Gry systemu</h2>
          </div>
          <div className="sl-chip-active shrink-0 rounded-2xl px-3 py-1.5 text-right">
            <p className="font-mono text-[8px] font-black uppercase tracking-widest">Dostępne</p>
            <p className="font-mono text-base font-black leading-none">{unlockedCount}/{MINI_GAME_CATALOG.length}</p>
          </div>
        </div>
        {blockedNotice && (
          <div className="sl-alert-warning relative mt-2 rounded-2xl px-3 py-2 text-[10px] font-black uppercase tracking-widest text-[var(--theme-warning-text)]">
            {blockedNotice}
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2">
        {MINI_GAME_CATALOG.map((game) => {
          const progress = player.miniGames?.[game.id] ?? createDefaultMiniGameProgress(game.id);
          const canLaunch = unlockAll || (dailyUnlocked && canUseMiniGameRank(rank, game.requiredRank));
          const lockedReason = !canUseMiniGameRank(rank, game.requiredRank)
            ? `Ranga ${game.requiredRank}`
            : !dailyUnlocked
              ? "50% treningu"
              : null;
          return (
            <div key={game.id}>
              <MiniGameCard
                definition={game}
                progress={progress}
                canLaunch={canLaunch}
                lockedReason={lockedReason}
                onLaunch={() => launchGame(game)}
              />
            </div>
          );
        })}
        <ComingSoonMiniGameCard />
      </div>
    </div>
  );
}

export function GameRuntimeScreen({
  gameId,
  player,
  onComplete,
  onExit,
  onBuyShadowExtractionEffect,
  onBuyShadowExtractionUpgrade,
  onSelectShadowExtractionEffect,
  onBuyMiniGameEffect,
  onSelectMiniGameEffect,
  onBuyMiniGameUpgrade,
  onBuyMiniGameBooster,
  onActivateMiniGameBooster,
  onConsumeMiniGameBooster,
  backgroundMusicEnabled,
  systemAudioEnabled,
  onToggleBackgroundMusic,
  onToggleSystemAudio,
  onRandomizeMusicTrack,
  miniGameBackgrounds,
  onBuyMiniGameBackground,
  onSelectMiniGameBackground,
  onImportMiniGameBackground,
  onToggleMiniGameGrid,
}: GameRuntimeScreenProps) {
  const definition = MINI_GAME_CATALOG.find((game) => game.id === gameId) ?? MINI_GAME_CATALOG[0];
  const progress = player.miniGames?.[definition.id] ?? createDefaultMiniGameProgress(definition.id);
  const nativeOrientation = useMemo(() => isNativeOrientationAvailable(), []);
  const [orientationMode, setOrientationMode] = useState<MiniGameOrientationMode>(definition.preferredOrientation);
  const [paused, setPaused] = useState(false);
  const [runtimeState, setRuntimeState] = useState<MiniGameRuntimeState>("ready");
  const [runtimeShopOpen, setRuntimeShopOpen] = useState(false);
  const [runtimeShopTab, setRuntimeShopTab] = useState<"effects" | "upgrades" | "boosters" | "backgrounds">("effects");
  const [roundBoosterBonuses, setRoundBoosterBonuses] = useState<MiniGameShopBonusSummary | null>(null);
  const [settlement, setSettlement] = useState<MiniGameSettlement | null>(null);
  const [roundKey, setRoundKey] = useState(0);
  const runtimeStateRef = useRef<MiniGameRuntimeState>("ready");
  const roundXpMultiplierRef = useRef(1);
  const normalizedBackgrounds = useMemo(() => normalizeMiniGameBackgrounds(miniGameBackgrounds), [miniGameBackgrounds]);
  const stageBackground = useMemo(
    () => getSelectedBackgroundForGame(definition.id, normalizedBackgrounds),
    [definition.id, normalizedBackgrounds]
  );
  const pauseTip = useRotatingTip(definition.pauseTips, 5200);
  const miniGameShop = useMemo(
    () => normalizeMiniGameShop(player.miniGameUpgrades?.shop),
    [player.miniGameUpgrades?.shop]
  );
  const selectedStageEffect = useMemo(
    () => getSelectedMiniGameShopEffect(miniGameShop, definition.id),
    [definition.id, miniGameShop]
  );
  const shopBonuses = useMemo(
    () => getMiniGameShopBonuses(miniGameShop, definition.id),
    [definition.id, miniGameShop]
  );
  const relicBonuses = useMemo(
    () => getEquippedMiniGameBonuses(player, definition.id),
    [definition.id, player.equipment]
  );
  const runtimeBonuses = useMemo(
    () => combineMiniGameRuntimeBonuses(relicBonuses, roundBoosterBonuses || shopBonuses),
    [relicBonuses, roundBoosterBonuses, shopBonuses]
  );
  const showGrid = isMiniGameGridEnabled(player.settings.miniGameGridByGame, definition.id);
  const utilityControlsVisible = runtimeState !== "running" && runtimeState !== "finished";
  const gameShopAvailable = runtimeState === "ready" || runtimeState === "finished" || paused;
  const runtimeGraphicsQuality = player.settings.graphicsQuality ?? "balanced";

  useEffect(() => {
    if (!nativeOrientation) return;
    void (definition.preferredOrientation === "landscape" ? lockAppLandscape() : lockAppPortrait());
    void setNativeGameState("loading");

    return () => {
      void setNativeGameState("app");
      void lockAppPortrait();
    };
  }, [definition.preferredOrientation, nativeOrientation]);

  useEffect(() => {
    if (runtimeState === "running" && !paused) {
      void setNativeGameState("miniGame");
    } else if (runtimeState === "ready") {
      void setNativeGameState("loading");
    } else if (paused) {
      void setNativeGameState("paused");
    } else {
      void setNativeGameState("app");
    }
  }, [paused, runtimeState]);

  const exit = useCallback(() => {
    if (nativeOrientation) void lockAppPortrait();
    onExit();
  }, [nativeOrientation, onExit]);

  const handleRuntimeStateChange = useCallback((state: MiniGameRuntimeState) => {
    const previous = runtimeStateRef.current;
    runtimeStateRef.current = state;
    setRuntimeState(state);
    if (state === "ready") {
      setSettlement(null);
    }
    if (state === "running" || state === "finished") {
      setRuntimeShopOpen(false);
    }
    if (state === "running") {
      if (previous !== "running") {
        const activeBonuses = getMiniGameShopBonuses(miniGameShop, definition.id);
        setRoundBoosterBonuses(activeBonuses.activeBoosterId ? activeBonuses : null);
        roundXpMultiplierRef.current = activeBonuses.xpMultiplier;
        if (activeBonuses.activeBoosterId) {
          onConsumeMiniGameBooster(definition.id);
        }
      }
      setPaused(false);
    }
    if (state === "ready" || state === "finished") {
      setRoundBoosterBonuses(null);
      roundXpMultiplierRef.current = 1;
    }
  }, [definition.id, miniGameShop, onConsumeMiniGameBooster]);

  const handleComplete = useCallback((result: MiniGameCompletionInput) => {
    setRuntimeState("finished");
    runtimeStateRef.current = "finished";
    setPaused(false);
    const completedSettlement = onComplete({ ...result, xpMultiplier: roundXpMultiplierRef.current });
    setSettlement(completedSettlement);
    setRoundBoosterBonuses(null);
    roundXpMultiplierRef.current = 1;
  }, [onComplete]);

  const replayRound = useCallback(() => {
    setSettlement(null);
    setPaused(false);
    setRuntimeShopOpen(false);
    setRuntimeState("ready");
    runtimeStateRef.current = "ready";
    setRoundKey((key) => key + 1);
  }, []);

  useEffect(() => {
    if (!nativeOrientation) return;
    let listener: PluginListenerHandle | null = null;
    void CapacitorApp.addListener("backButton", () => {
      if (paused) {
        exit();
        return;
      }
      setPaused(true);
    }).then((handle) => {
      listener = handle;
    });

    return () => {
      void listener?.remove();
    };
  }, [exit, nativeOrientation, paused]);

  const toggleOrientation = async () => {
    const nextMode: MiniGameOrientationMode = orientationMode === "landscape" ? "portrait" : "landscape";
    setOrientationMode(nextMode);
    if (nextMode === "landscape") {
      await lockAppLandscape();
    } else {
      await lockAppPortrait();
    }
  };

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    const previousOverscroll = document.body.style.overscrollBehavior;
    document.body.style.overflow = "hidden";
    document.body.style.overscrollBehavior = "none";
    return () => {
      document.body.style.overflow = previousOverflow;
      document.body.style.overscrollBehavior = previousOverscroll;
    };
  }, []);

  return (
    <motion.div
      className="fixed inset-0 z-[999] h-[100dvh] w-screen overflow-hidden bg-[var(--theme-game-bg)] text-[var(--theme-text)]"
      data-mini-game-runtime="true"
      data-graphics-quality={runtimeGraphicsQuality}
      data-gpu-layer="true"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.18 }}
      role="dialog"
      aria-modal="true"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_18%,rgba(34,211,238,0.22),transparent_34%),linear-gradient(180deg,#061328,#020617)]" />
      <div
        className="pointer-events-none absolute inset-0 z-40"
        style={{
          paddingTop: "max(12px, env(safe-area-inset-top))",
          paddingRight: "max(12px, env(safe-area-inset-right))",
          paddingLeft: "max(12px, env(safe-area-inset-left))",
        }}
      >
        <div className="flex items-center justify-end gap-2">
          {utilityControlsVisible && (
            <div className="pointer-events-auto flex h-10 items-center gap-1.5 rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-game-hud)] p-1 shadow-[0_0_18px_var(--theme-shadow)]">
              {gameShopAvailable && (
                <MiniGameAudioButton label="Sklep mini-gry" onClick={() => setRuntimeShopOpen(true)}>
                  <ShoppingBag className="h-4 w-4" />
                </MiniGameAudioButton>
              )}
              <MiniGameAudioButton
                label={showGrid ? "Ukryj siatkę" : "Pokaż siatkę"}
                onClick={() => onToggleMiniGameGrid(definition.id, !showGrid)}
              >
                <Grid2X2 className={`h-4 w-4 ${showGrid ? "" : "opacity-45"}`} />
              </MiniGameAudioButton>
              <MiniGameAudioButton
                label={backgroundMusicEnabled ? "Wycisz muzykę" : "Włącz muzykę"}
                onClick={() => onToggleBackgroundMusic(!backgroundMusicEnabled)}
              >
                {backgroundMusicEnabled ? <Music2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
              </MiniGameAudioButton>
              <MiniGameAudioButton
                label={systemAudioEnabled ? "Wycisz efekty" : "Włącz efekty"}
                onClick={() => onToggleSystemAudio(!systemAudioEnabled)}
              >
                {systemAudioEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
              </MiniGameAudioButton>
              <MiniGameAudioButton label="Losuj utwór" onClick={onRandomizeMusicTrack}>
                <Shuffle className="h-4 w-4" />
              </MiniGameAudioButton>
            </div>
          )}
          {definition.allowPortraitFallback && (
            <button
              type="button"
              onClick={toggleOrientation}
              className="pointer-events-auto grid h-10 w-10 place-items-center rounded-xl border border-[var(--theme-border)] bg-[var(--theme-game-hud)] text-[var(--theme-text-strong)] shadow-[0_0_18px_var(--theme-shadow)] active:scale-95"
              title={orientationMode === "landscape" ? "Zmień na pion (Portrait)" : "Zmień na poziom (Landscape)"}
              aria-label="Obróć ekran"
            >
              <RotateCw className="h-4 w-4" />
            </button>
          )}
          {runtimeState === "ready" && (
            <button
              type="button"
              onClick={exit}
              className="pointer-events-auto grid h-10 w-10 place-items-center rounded-xl border border-[var(--theme-border)] bg-[var(--theme-game-hud)] text-[var(--theme-text-strong)] shadow-[0_0_18px_var(--theme-shadow)] active:scale-95"
              aria-label="Zamknij mini-grę"
            >
              <X className="h-4 w-4" />
            </button>
          )}
          {runtimeState === "running" && (
            <button
              type="button"
              onClick={() => setPaused(true)}
              className="pointer-events-auto h-10 rounded-xl border border-[color-mix(in_srgb,var(--theme-danger)_42%,transparent)] bg-[var(--theme-danger-soft)] px-3 py-1.5 font-mono text-[9px] font-black uppercase tracking-[0.2em] text-[var(--theme-danger-text)] shadow-[0_0_18px_color-mix(in_srgb,var(--theme-danger)_16%,transparent)] active:scale-95"
              aria-label="Pauza mini-gry"
            >
              Stop
            </button>
          )}
        </div>
      </div>

      <main className="absolute inset-0 z-10 flex min-h-0 w-full" data-gpu-layer="true">
        <Fragment key={`${definition.id}-${roundKey}`}>
          <ActiveMiniGame
            definition={definition}
            progress={progress}
            player={player}
            paused={paused}
            orientationMode={orientationMode}
            onComplete={handleComplete}
            onRuntimeStateChange={handleRuntimeStateChange}
            onExit={exit}
            onBuyShadowExtractionEffect={onBuyShadowExtractionEffect}
            onBuyShadowExtractionUpgrade={onBuyShadowExtractionUpgrade}
            onSelectShadowExtractionEffect={onSelectShadowExtractionEffect}
            stageBackground={stageBackground}
            relicBonuses={runtimeBonuses}
            stageEffect={selectedStageEffect}
            showGrid={showGrid}
            graphicsQuality={runtimeGraphicsQuality}
          />
        </Fragment>
      </main>
      <AnimatePresence>
        {runtimeState === "finished" && settlement && (
          <MiniGameResultScreen
            settlement={settlement}
            definition={definition}
            onReplay={replayRound}
            onOpenShop={() => {
              setRuntimeShopTab("boosters");
              setRuntimeShopOpen(true);
            }}
            onExit={exit}
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {paused && (
          <motion.div
            className="sl-modal-backdrop absolute inset-0 z-50 flex items-end justify-center p-4 sm:items-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.16 }}
          >
            <div className="pointer-events-none absolute left-4 top-1/2 hidden max-w-[240px] -translate-y-1/2 rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-input)] p-4 text-left text-sm leading-relaxed text-[var(--theme-text)] md:block">
              {pauseTip}
            </div>
            <div className="sl-modal sl-mini-pause-modal flex w-[min(360px,calc(100vw-28px))] flex-col overflow-hidden rounded-[24px] border text-center shadow-[0_0_44px_color-mix(in_srgb,var(--theme-accent)_18%,transparent)]">
              <div className="p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="text-left">
                    <h3 className="text-xl font-black uppercase tracking-[0.08em] text-[var(--theme-text-strong)]">Pauza</h3>
                    <p className="sl-muted mt-1 text-[9px] font-black uppercase tracking-[0.2em]">
                      Efekt: {selectedStageEffect.name}
                    </p>
                  </div>
                  {runtimeState !== "finished" && (
                    <div className={`grid shrink-0 gap-1.5 ${gameShopAvailable ? "grid-cols-5" : "grid-cols-4"}`}>
                      {gameShopAvailable && (
                        <MiniGameAudioButton label="Sklep mini-gry" onClick={() => setRuntimeShopOpen(true)}>
                          <ShoppingBag className="h-4 w-4" />
                        </MiniGameAudioButton>
                      )}
                      <MiniGameAudioButton
                        label={showGrid ? "Ukryj siatkę" : "Pokaż siatkę"}
                        onClick={() => onToggleMiniGameGrid(definition.id, !showGrid)}
                      >
                        <Grid2X2 className={`h-4 w-4 ${showGrid ? "" : "opacity-45"}`} />
                      </MiniGameAudioButton>
                      <MiniGameAudioButton
                        label={backgroundMusicEnabled ? "Wycisz muzykę" : "Włącz muzykę"}
                        onClick={() => onToggleBackgroundMusic(!backgroundMusicEnabled)}
                      >
                        {backgroundMusicEnabled ? <Music2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
                      </MiniGameAudioButton>
                      <MiniGameAudioButton
                        label={systemAudioEnabled ? "Wycisz efekty" : "Włącz efekty"}
                        onClick={() => onToggleSystemAudio(!systemAudioEnabled)}
                      >
                        {systemAudioEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
                      </MiniGameAudioButton>
                      <MiniGameAudioButton label="Losuj utwór" onClick={onRandomizeMusicTrack}>
                        <Shuffle className="h-4 w-4" />
                      </MiniGameAudioButton>
                    </div>
                  )}
                </div>
                <div className="sl-input mt-3 rounded-2xl px-3 py-2 text-left md:hidden">
                  <p className="sl-kicker font-mono text-[9px] font-black uppercase tracking-[0.2em]">Protip</p>
                  <p className="mt-1 text-xs leading-relaxed text-[var(--theme-text)]">{pauseTip}</p>
                </div>
              </div>
              <div className="grid gap-2 border-t border-[var(--theme-border)] bg-[var(--theme-input)] p-3">
                <button type="button" onClick={() => setPaused(false)} className="sl-button-primary min-h-[52px] rounded-2xl px-5 py-3 text-sm font-black uppercase tracking-widest active:scale-[0.98]">
                  Kontynuuj
                </button>
                {definition.allowPortraitFallback && (
                  <button type="button" onClick={toggleOrientation} className="sl-button-secondary flex min-h-11 items-center justify-center gap-2 rounded-2xl px-5 py-2 text-xs font-black uppercase tracking-widest active:scale-[0.98]">
                    <RotateCw className="h-4 w-4" />
                    {orientationMode === "landscape" ? "Zmień na pion" : "Zmień na poziom"}
                  </button>
                )}
                <button type="button" onClick={exit} className="min-h-11 rounded-2xl border border-[color-mix(in_srgb,var(--theme-danger)_40%,transparent)] bg-[var(--theme-danger-soft)] px-5 py-2 text-xs font-black uppercase tracking-widest text-[var(--theme-danger-text)] active:scale-[0.98]">
                  Wyjdź
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {runtimeShopOpen && gameShopAvailable && (
          <MiniGameShopSheet
            playerGold={player.gold}
            shop={miniGameShop}
            selectedStageEffect={selectedStageEffect.id}
            activeTab={runtimeShopTab}
            onTabChange={setRuntimeShopTab}
            onClose={() => setRuntimeShopOpen(false)}
            gameId={definition.id}
            onBuyEffect={onBuyMiniGameEffect}
            onSelectEffect={onSelectMiniGameEffect}
            onBuyUpgrade={onBuyMiniGameUpgrade}
            onBuyBooster={onBuyMiniGameBooster}
            onActivateBooster={onActivateMiniGameBooster}
            backgrounds={normalizedBackgrounds}
            activeBackground={stageBackground.id}
            onBuyBackground={onBuyMiniGameBackground}
            onSelectBackground={onSelectMiniGameBackground}
            onImportBackground={onImportMiniGameBackground}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function MiniGameResultScreen({
  settlement,
  definition,
  onReplay,
  onOpenShop,
  onExit,
}: {
  settlement: MiniGameSettlement;
  definition: MiniGameDefinition;
  onReplay: () => void;
  onOpenShop: () => void;
  onExit: () => void;
}) {
  const xpTargetBefore = XP_REQUIRED(settlement.playerLevelBefore);
  const xpTargetAfter = XP_REQUIRED(settlement.playerLevelAfter);
  const xpBeforePercent = Math.min(100, Math.max(0, (settlement.xpBefore / Math.max(1, xpTargetBefore)) * 100));
  const xpAfterPercent = Math.min(100, Math.max(0, (settlement.xpAfter / Math.max(1, xpTargetAfter)) * 100));
  const goldDelta = Math.max(0, settlement.goldAfter - settlement.goldBefore);
  const leveledUp = settlement.playerLevelAfter > settlement.playerLevelBefore;
  const bestAfter = Math.max(settlement.previousBest, settlement.score);
  const gameLevelValue =
    settlement.nextGameLevel > settlement.previousGameLevel
      ? `${settlement.previousGameLevel} -> ${settlement.nextGameLevel}`
      : `Lv.${settlement.nextGameLevel}`;

  return (
    <motion.div
      className="absolute inset-0 z-45 flex items-center justify-center p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.18 }}
    >
      <div className="absolute inset-0 bg-[color-mix(in_srgb,var(--theme-bg)_78%,transparent)] backdrop-blur-sm" />
      <motion.div
        className="sl-modal sl-mini-result-modal relative flex flex-col overflow-hidden rounded-[26px] border shadow-[0_0_44px_color-mix(in_srgb,var(--theme-accent)_22%,transparent)]"
        initial={{ y: 22, scale: 0.98 }}
        animate={{ y: 0, scale: 1 }}
        exit={{ y: 18, scale: 0.98 }}
        transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="sl-mini-result-body min-h-0 flex-1 overflow-hidden">
          <div className="sl-mini-result-header flex items-start justify-between gap-3">
            <div>
              <p className="sl-kicker text-[10px] font-black uppercase tracking-[0.28em]">Raport rundy</p>
              <h2 className="sl-mini-result-title mt-1 font-black uppercase tracking-[0.06em] text-[var(--theme-text-strong)]">
                {definition.title}
              </h2>
            </div>
            <div className={`sl-chip-active sl-mini-result-record rounded-2xl text-right ${settlement.newBest ? "" : "opacity-80"}`}>
              <p className="font-mono text-[9px] font-black uppercase tracking-widest">
                {settlement.newBest ? "Nowy rekord" : "Najlepszy"}
              </p>
              <p className="font-mono font-black">{bestAfter}</p>
            </div>
          </div>

          <div className="sl-mini-result-stat-grid grid grid-cols-3 gap-2">
            <MiniGameResultStat label="Poprzedni rekord" value={settlement.previousBest > 0 ? String(settlement.previousBest) : "--"} />
            <MiniGameResultStat label="Wynik" value={String(settlement.score)} active={settlement.newBest} />
            <MiniGameResultStat label="Gra Lv." value={gameLevelValue} />
          </div>

          <div className="sl-card sl-mini-result-xp rounded-2xl">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="sl-muted text-[10px] font-black uppercase tracking-widest">Poziom łowcy</p>
                <p className="sl-mini-result-level font-black text-[var(--theme-text-strong)]">
                  Lv.{settlement.playerLevelBefore}
                  {leveledUp ? ` -> Lv.${settlement.playerLevelAfter}` : ""}
                </p>
              </div>
              {leveledUp && (
                <span className="sl-chip-active rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-widest">
                  Awans
                </span>
              )}
            </div>
            <div className="sl-progress-track mt-3 h-2 overflow-hidden rounded-full">
              <motion.div
                className="sl-progress-fill h-full rounded-full"
                initial={{ width: `${xpBeforePercent}%` }}
                animate={{
                  width: leveledUp
                    ? [`${xpBeforePercent}%`, "100%", "0%", `${xpAfterPercent}%`]
                    : `${xpAfterPercent}%`,
                }}
                transition={{
                  delay: 0.45,
                  duration: leveledUp ? 6.2 : 4.2,
                  ease: [0.22, 1, 0.36, 1],
                  times: leveledUp ? [0, 0.46, 0.55, 1] : undefined,
                }}
              />
            </div>
            <div className="mt-2 flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-[var(--theme-muted)]">
              <span>+{settlement.xpReward} XP</span>
              <span>{settlement.xpAfter} / {xpTargetAfter}</span>
            </div>
          </div>

          <div className="sl-mini-result-rewards grid grid-cols-2 gap-2">
            <div className="sl-stat-tile rounded-2xl p-3">
              <div className="mb-2 text-[var(--theme-warning-text)]"><Coins className="h-4 w-4" /></div>
              <p className="text-[9px] font-black uppercase tracking-widest text-[var(--theme-muted)]">Gold</p>
              <p className="sl-mini-result-number mt-1 font-mono font-black text-[var(--theme-text-strong)]">
                {settlement.goldBefore} {"->"} {settlement.goldAfter}
              </p>
              <p className="mt-1 text-[10px] font-black uppercase tracking-widest text-[var(--theme-warning-text)]">+{goldDelta}</p>
            </div>
            <div className="sl-stat-tile rounded-2xl p-3">
              <div className="mb-2 text-[var(--theme-icon)]"><HeartPulse className="h-4 w-4" /></div>
              <p className="text-[9px] font-black uppercase tracking-widest text-[var(--theme-muted)]">HP</p>
              <p className="sl-mini-result-number mt-1 font-mono font-black text-[var(--theme-text-strong)]">
                {settlement.hpBefore} {"->"} {settlement.hpAfter}
              </p>
              <p className={`mt-1 text-[10px] font-black uppercase tracking-widest ${settlement.hpLoss > 0 ? "text-[var(--theme-danger-text)]" : "text-[var(--theme-success-text)]"}`}>
                {settlement.hpLoss > 0 ? `-${settlement.hpLoss}` : settlement.hpRestored > 0 ? `+${settlement.hpRestored}` : "bez zmian"}
              </p>
            </div>
          </div>

          {settlement.loot && (
            <div className="sl-card sl-mini-result-loot rounded-2xl">
              <p className="sl-kicker text-[10px] font-black uppercase tracking-[0.22em]">Loot</p>
              <div className="mt-2 flex items-center gap-3">
                <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl border border-[var(--theme-border)] bg-[var(--theme-input)]">
                  <Sparkles className="h-5 w-5 text-[var(--theme-icon)]" />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-black uppercase tracking-[0.08em] text-[var(--theme-text-strong)]">{settlement.loot.name}</p>
                  <p className="sl-muted mt-1 text-[10px] font-black uppercase tracking-widest">
                    {settlement.loot.rarity} · +{settlement.loot.bonusValue} {settlement.loot.bonusType}
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="sl-input sl-mini-result-difficulty rounded-2xl">
            <p className="sl-kicker text-[10px] font-black uppercase tracking-[0.22em]">Trudność</p>
            <p className="mt-1 text-sm font-bold leading-relaxed text-[var(--theme-text)]">
              Lv.{settlement.nextGameLevel} · stadium {settlement.difficultyLevel} · nagroda x{settlement.rewardMultiplier.toFixed(2)}
            </p>
            {(settlement.penaltyApplied || settlement.boosterApplied) && (
              <p className="sl-muted mt-2 text-xs font-bold">
                {settlement.penaltyApplied ? "Kara obniżyła nagrodę. " : ""}
                {settlement.boosterApplied ? `Booster XP x${settlement.xpMultiplier.toFixed(2)} został użyty.` : ""}
              </p>
            )}
          </div>
        </div>

        <div className="sl-mini-result-actions grid gap-2 border-t border-[var(--theme-border)] bg-[var(--theme-input)]">
          <button type="button" onClick={onReplay} className="sl-button-primary min-h-12 rounded-2xl px-4 py-3 text-sm font-black uppercase tracking-widest active:scale-[0.98]">
            Zagraj ponownie
          </button>
          <div className="grid grid-cols-2 gap-2">
            <button type="button" onClick={onOpenShop} className="sl-button-secondary min-h-11 rounded-2xl px-4 py-2 text-xs font-black uppercase tracking-widest active:scale-[0.98]">
              Sklep
            </button>
            <button type="button" onClick={onExit} className="min-h-11 rounded-2xl border border-[color-mix(in_srgb,var(--theme-danger)_36%,transparent)] bg-[var(--theme-danger-soft)] px-4 py-2 text-xs font-black uppercase tracking-widest text-[var(--theme-danger-text)] active:scale-[0.98]">
              Wyjdź
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

function MiniGameResultStat({ label, value, active = false }: { label: string; value: string; active?: boolean }) {
  return (
    <div className={`${active ? "sl-chip-active" : "sl-stat-tile"} rounded-2xl p-3`}>
      <p className="text-[9px] font-black uppercase tracking-widest text-[var(--theme-muted)]">{label}</p>
      <p className="mt-1 font-mono text-base font-black text-[var(--theme-text-strong)]">{value}</p>
    </div>
  );
}

function MiniGameAudioButton({ label, onClick, children }: { label: string; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="sl-icon-button flex h-9 w-9 items-center justify-center rounded-xl shadow-[0_0_16px_color-mix(in_srgb,var(--theme-accent)_10%,transparent)] active:scale-95"
    >
      {children}
    </button>
  );
}

function MiniGameCard({
  definition,
  progress,
  canLaunch,
  lockedReason,
  onLaunch,
}: {
  definition: MiniGameDefinition;
  progress: MiniGameProgress;
  canLaunch: boolean;
  lockedReason: string | null;
  onLaunch: () => void;
}) {
  const themeAsset = getMiniGameThemeAsset(definition.id);

  return (
    <button
      type="button"
      onClick={onLaunch}
      aria-label={canLaunch ? `Uruchom mini-grę ${definition.title}` : `${definition.title} zablokowana`}
      className={`sl-mini-game-card group relative min-h-[126px] w-full overflow-hidden rounded-[18px] border p-2 text-left transition active:scale-[0.99] ${
        canLaunch
          ? "sl-card hover:shadow-[0_0_26px_color-mix(in_srgb,var(--theme-accent)_14%,transparent)]"
          : "sl-input opacity-70"
      }`}
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[56%] opacity-48">
        <img src={themeAsset.image} alt="" loading="eager" decoding="async" className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent,color-mix(in_srgb,var(--theme-card)_84%,transparent),var(--theme-card))]" />
      </div>
      <div className="relative flex min-h-[110px] flex-col justify-between gap-1.5">
        <div className="flex items-start justify-between gap-2">
          <div className={`grid h-9 w-9 shrink-0 place-items-center rounded-2xl border ${canLaunch ? "sl-chip-active" : "sl-chip"}`}>
            {getMiniGameIcon(definition.id)}
          </div>
          <span className={`shrink-0 rounded-full border px-2 py-1 font-mono text-[9px] font-black uppercase tracking-widest ${canLaunch ? "sl-chip-active" : "sl-chip"}`}>
            {canLaunch ? `Lv.${progress.level}` : lockedReason}
          </span>
        </div>
        <div className="min-w-0">
          <h3 className="line-clamp-2 text-[13px] font-black uppercase leading-tight tracking-[0.04em] text-[var(--theme-text-strong)]">{definition.title}</h3>
          <p className="sl-muted mt-1 line-clamp-1 text-[10px] leading-relaxed">{definition.mechanic}</p>
          <p className="sl-muted mt-0.5 truncate font-mono text-[9px] uppercase tracking-widest">Rekord {progress.bestScore}</p>
        </div>
        <div className="grid gap-1.5">
          <div className="sl-progress-track h-1.5 overflow-hidden rounded-full">
            <div className="sl-progress-fill h-full rounded-full" style={{ width: `${Math.min(100, progress.level * 8)}%` }} />
          </div>
          <span className={`w-fit rounded-full px-2.5 py-1 font-mono text-[9px] font-black uppercase tracking-[0.16em] ${canLaunch ? "sl-chip-active" : "sl-chip"}`}>
            {canLaunch ? "Start" : "Blokada"}
          </span>
        </div>
      </div>
    </button>
  );
}

function ComingSoonMiniGameCard() {
  return (
    <div className="sl-input sl-mini-game-card flex min-h-[126px] flex-col justify-between gap-2 rounded-[18px] border border-dashed p-2 text-left opacity-80">
      <div className="flex items-start justify-between gap-2">
        <div className="sl-chip grid h-9 w-9 shrink-0 place-items-center rounded-2xl border">
          <Sparkles className="h-5 w-5" />
        </div>
        <span className="sl-chip shrink-0 rounded-full border px-2 py-1 font-mono text-[9px] font-black uppercase tracking-widest">Soon</span>
      </div> 
      <div className="min-w-0 flex-1">
        <h3 className="line-clamp-2 text-[13px] font-black uppercase leading-tight tracking-[0.04em] text-[var(--theme-text-strong)]">Nowa symulacja</h3>
        <p className="sl-muted mt-1 line-clamp-2 text-[10px] leading-relaxed">Wkrótce kolejne próby Systemu.</p>
      </div>
      <div className="sl-progress-track h-1.5 overflow-hidden rounded-full">
        <div className="h-full w-1/3 rounded-full bg-[var(--theme-disabled-text)]" />
      </div>
    </div>
  );
}

function ActiveMiniGame({
  definition,
  progress,
  player,
  paused,
  orientationMode,
  onComplete,
  onRuntimeStateChange,
  onExit,
  onBuyShadowExtractionEffect,
  onBuyShadowExtractionUpgrade,
  onSelectShadowExtractionEffect,
  stageBackground,
  relicBonuses,
  stageEffect,
  showGrid,
  graphicsQuality,
}: ActiveMiniGameProps) {
  switch (definition.id) {
    case "mana-memory":
      return <ManaMemoryGame definition={definition} progress={progress} paused={paused} stageBackground={stageBackground} relicBonuses={relicBonuses} stageEffect={stageEffect} showGrid={showGrid} graphicsQuality={graphicsQuality} onComplete={onComplete} onRuntimeStateChange={onRuntimeStateChange} onExit={onExit} />;
    case "shadow-strike":
      return <ShadowStrikeGame definition={definition} progress={progress} paused={paused} stageBackground={stageBackground} relicBonuses={relicBonuses} stageEffect={stageEffect} showGrid={showGrid} graphicsQuality={graphicsQuality} onComplete={onComplete} onRuntimeStateChange={onRuntimeStateChange} onExit={onExit} />;
    case "rune-lock":
      return <RuneLockGame definition={definition} progress={progress} paused={paused} stageBackground={stageBackground} relicBonuses={relicBonuses} stageEffect={stageEffect} showGrid={showGrid} graphicsQuality={graphicsQuality} onComplete={onComplete} onRuntimeStateChange={onRuntimeStateChange} onExit={onExit} />;
    case "shadow-extraction":
      return (
        <ShadowExtractionGame
          definition={definition}
          progress={progress}
          player={player}
          paused={paused}
          orientationMode={orientationMode}
          onComplete={onComplete}
          onRuntimeStateChange={onRuntimeStateChange}
          onExit={onExit}
          onBuyEffect={onBuyShadowExtractionEffect}
          onBuyUpgrade={onBuyShadowExtractionUpgrade}
          onSelectEffect={onSelectShadowExtractionEffect}
          stageBackground={stageBackground}
          relicBonuses={relicBonuses}
          stageEffect={stageEffect}
          showGrid={showGrid}
          graphicsQuality={graphicsQuality}
        />
      );
    case "gate-dodge":
    default:
      return <GateReflexGame definition={definition} progress={progress} paused={paused} stageBackground={stageBackground} relicBonuses={relicBonuses} stageEffect={stageEffect} showGrid={showGrid} graphicsQuality={graphicsQuality} onComplete={onComplete} onRuntimeStateChange={onRuntimeStateChange} onExit={onExit} />;
  }
}

function GateReflexGame({ definition, progress, paused = false, stageBackground, relicBonuses, stageEffect, showGrid, graphicsQuality, onComplete, onRuntimeStateChange, onExit }: ActiveGameProps) {
  const [running, setRunning] = useState(false);
  const [finished, setFinished] = useState(false);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [remaining, setRemaining] = useState(GAME_SECONDS);
  const [target, setTarget] = useState(() => randomGateTarget());
  const [hazards, setHazards] = useState(() => randomHazards(1));
  const scoreRef = useRef(0);
  const comboRef = useRef(0);
  const deadlineRef = useRef(0);
  const roundStartedAtRef = useRef(0);
  const roundEndsAtRef = useRef(0);
  const committedRef = useRef(false);
  const pauseStartedAtRef = useRef<number | null>(null);
  const { feedback, showFeedback } = useFeedback();
  const { scorePopup, showScorePopup } = useScorePopup();

  const spawnRound = useCallback((nextScore = scoreRef.current) => {
    const difficulty = getMiniGameDifficulty(nextScore, progress.level, 170, 6, 7);
    const nextTarget = randomGateTarget(difficulty);
    const hazardCount = Math.min(8, 1 + Math.floor(difficulty * 0.82) + (nextScore > 650 ? 1 : 0));
    const lifetimeMs = Math.max(360, 1160 - difficulty * 92 - Math.min(210, comboRef.current * 13) + relicBonuses.targetLifetime);
    setTarget(nextTarget);
    setHazards(randomHazards(hazardCount, nextTarget, difficulty));
    const now = Date.now();
    roundStartedAtRef.current = now;
    roundEndsAtRef.current = now + lifetimeMs;
  }, [progress.level, relicBonuses.targetLifetime]);

  const finish = useCallback((finalScore: number) => {
    if (committedRef.current) return;
    committedRef.current = true;
    playMiniGameFinishCue(finalScore, definition);
    setRunning(false);
    setFinished(true);
    onRuntimeStateChange?.("finished");
    onComplete({
      gameId: definition.id,
      score: finalScore,
      survivedSeconds: GAME_SECONDS,
      won: finalScore >= definition.winScore,
      statHint: definition.statHint,
    });
  }, [definition, onComplete, onRuntimeStateChange]);

  useEffect(() => {
    if (!running || paused) return;
    const timer = window.setInterval(() => {
      const now = Date.now();
      if (now >= roundEndsAtRef.current) {
        const difficulty = getMiniGameDifficulty(scoreRef.current, progress.level, 170, 6, 7);
        comboRef.current = 0;
        setCombo(0);
        deadlineRef.current -= 850 + difficulty * 90;
        showFeedback("-czas za spóźnienie");
        spawnRound();
      }

      const left = Math.max(0, Math.ceil((deadlineRef.current - now) / 1000));
      setRemaining(left);
      if (left <= 0) {
        window.clearInterval(timer);
        finish(scoreRef.current);
      }
    }, 100);
    return () => window.clearInterval(timer);
  }, [finish, paused, progress.level, running, showFeedback, spawnRound]);

  useEffect(() => {
    if (!running) {
      pauseStartedAtRef.current = null;
      return;
    }
    if (paused) {
      if (pauseStartedAtRef.current === null) pauseStartedAtRef.current = Date.now();
      return;
    }
    if (pauseStartedAtRef.current !== null) {
      const pausedFor = Date.now() - pauseStartedAtRef.current;
      deadlineRef.current += pausedFor;
      roundStartedAtRef.current += pausedFor;
      roundEndsAtRef.current += pausedFor;
      pauseStartedAtRef.current = null;
    }
  }, [paused, running]);

  const start = () => {
    playMiniGameStartCue();
    committedRef.current = false;
    scoreRef.current = 0;
    comboRef.current = 0;
    deadlineRef.current = Date.now() + GAME_SECONDS * 1000;
    setScore(0);
    setCombo(0);
    setRemaining(GAME_SECONDS);
    setFinished(false);
    spawnRound(0);
    onRuntimeStateChange?.("running");
    setRunning(true);
  };

  const hit = () => {
    if (!running || paused) return;
    const now = Date.now();
    const nextCombo = comboRef.current + 1;
    const reward = getReactionReward(now, roundStartedAtRef.current, roundEndsAtRef.current, nextCombo);
    const pointGain = Math.round((10 + Math.min(35, nextCombo * 2) + reward.points) * (1 + relicBonuses.scoreBonus));
    const nextScore = scoreRef.current + pointGain;
    const difficulty = getMiniGameDifficulty(nextScore, progress.level, 170, 6, 7);
    const diminishingFactor = Math.max(0.32, 1 - nextCombo * 0.035 - difficulty * 0.025);
    comboRef.current = nextCombo;
    scoreRef.current = nextScore;
    deadlineRef.current = applyCappedTimeBonus({
      deadline: deadlineRef.current,
      now,
      bonusMs: reward.timeMs,
      capMs: GATE_TIME_CAP_MS,
      diminishingFactor,
    });
    setScore(nextScore);
    setCombo(nextCombo);
    setRemaining(Math.max(0, Math.ceil((deadlineRef.current - now) / 1000)));
    showScorePopup(pointGain);
    playMiniGameHitSound();
    showFeedback(`+${pointGain} pkt · +${formatBonusSeconds(reward.timeMs)}`);
    spawnRound(nextScore);
  };

  const miss = () => {
    if (!running || paused) return;
    playMiniGamePenaltySound();
    const difficulty = getMiniGameDifficulty(scoreRef.current, progress.level, 170, 6, 7);
    comboRef.current = 0;
    deadlineRef.current -= Math.round((900 + difficulty * 100) * (1 - relicBonuses.timePenaltyResist));
    setCombo(0);
    showFeedback("-czas za pudło");
  };

  const hitHazard = () => {
    if (!running || paused) return;
    playMiniGamePenaltySound();
    const difficulty = getMiniGameDifficulty(scoreRef.current, progress.level, 170, 6, 7);
    const scorePenalty = 45 + difficulty * 6;
    const timePenalty = Math.round((2600 + difficulty * 220) * (1 - relicBonuses.timePenaltyResist));
    comboRef.current = 0;
    scoreRef.current = Math.max(0, scoreRef.current - scorePenalty);
    deadlineRef.current -= timePenalty;
    setCombo(0);
    setScore(scoreRef.current);
    showScorePopup(-scorePenalty);
    showFeedback("-pułapka bramy");
    spawnRound(scoreRef.current);
  };

  return (
    <MiniGameFrame definition={definition} score={score} combo={combo} remaining={remaining} scorePopup={scorePopup} finished={finished} showHud={running} stageBackground={stageBackground} stageEffect={stageEffect} showGrid={showGrid} graphicsQuality={graphicsQuality}>
      <div className="relative h-full min-h-[360px] overflow-hidden" onClick={miss}>
        {running && hazards.map((hazard) => (
          <button
            key={hazard.id}
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              hitHazard();
            }}
            className="sl-reflex-trap absolute flex -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-red-200/80 bg-red-500/25 text-red-50 shadow-[0_0_34px_rgba(248,113,113,0.65)] transition-transform active:scale-90"
            style={{ left: `${hazard.x}%`, top: `${hazard.y}%`, width: hazard.sizePx, height: hazard.sizePx }}
            aria-label="Pułapka bramy"
          >
            <span className="h-1/2 w-1/2 rounded-full bg-red-400 shadow-[0_0_24px_rgba(248,113,113,0.9)]" />
          </button>
        ))}
        {running && (
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              hit();
            }}
            className="sl-reflex-target absolute flex -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-cyan-200 bg-cyan-400/20 text-cyan-50 shadow-[0_0_42px_rgba(34,211,238,0.55)] transition-transform active:scale-90"
            style={{ left: `${target.x}%`, top: `${target.y}%`, width: target.sizePx, height: target.sizePx }}
            aria-label="Rdzeń bramy"
          >
            <img src={MOBILE_THEME_ASSETS.miniGames.portal} alt="" className="absolute h-[140%] w-[140%] animate-spin object-contain opacity-50 [animation-duration:5s]" />
            <span className="relative h-9 w-9 rounded-full bg-cyan-200 shadow-[0_0_28px_rgba(165,243,252,0.85)]" />
          </button>
        )}
        <Feedback text={feedback} />
        {!running && <StartOverlay finished={finished} score={score} title={finished ? "Wynik zapisany" : definition.title} text={definition.shortGoal} tips={definition.readyTips} relicBonuses={relicBonuses} onStart={start} onExit={onExit} />}
      </div>
    </MiniGameFrame>
  );
}

function ShadowStrikeGame({ definition, progress, paused = false, stageBackground, relicBonuses, stageEffect, showGrid, graphicsQuality, onComplete, onRuntimeStateChange, onExit }: ActiveGameProps) {
  const [running, setRunning] = useState(false);
  const [finished, setFinished] = useState(false);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [remaining, setRemaining] = useState(GAME_SECONDS);
  const [cursor, setCursor] = useState(0);
  const [zone, setZone] = useState(50);
  const scoreRef = useRef(0);
  const comboRef = useRef(0);
  const cursorRef = useRef(0);
  const zoneRef = useRef(50);
  const deadlineRef = useRef(0);
  const startRef = useRef(0);
  const committedRef = useRef(false);
  const animationRef = useRef<number | null>(null);
  const pauseStartedAtRef = useRef<number | null>(null);
  const { feedback, showFeedback } = useFeedback();
  const { scorePopup, showScorePopup } = useScorePopup();

  const finish = useCallback((finalScore: number) => {
    if (committedRef.current) return;
    committedRef.current = true;
    playMiniGameFinishCue(finalScore, definition);
    setRunning(false);
    setFinished(true);
    onRuntimeStateChange?.("finished");
    onComplete({
      gameId: definition.id,
      score: finalScore,
      survivedSeconds: GAME_SECONDS,
      won: finalScore >= definition.winScore,
      statHint: definition.statHint,
    });
  }, [definition, onComplete, onRuntimeStateChange]);

  useEffect(() => {
    if (!running || paused) return;
    const tick = () => {
      const now = Date.now();
      const elapsed = now - startRef.current;
      const difficulty = getMiniGameDifficulty(scoreRef.current, progress.level, 120, 4, 12);
      const cycleMs = Math.max(360, 1120 - difficulty * 65);
      const driftMs = Math.max(420, 850 - difficulty * 35);
      const nextCursor = ((elapsed % cycleMs) / cycleMs) * 100;
      const nextZone = 50 + Math.sin(elapsed / driftMs) * Math.min(26, 9 + difficulty * 1.4);
      cursorRef.current = nextCursor;
      zoneRef.current = nextZone;
      setCursor(nextCursor);
      setZone(nextZone);

      const left = Math.max(0, Math.ceil((deadlineRef.current - now) / 1000));
      setRemaining(left);
      if (left <= 0) {
        finish(scoreRef.current);
        return;
      }
      animationRef.current = window.requestAnimationFrame(tick);
    };
    animationRef.current = window.requestAnimationFrame(tick);
    return () => {
      if (animationRef.current) window.cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    };
  }, [finish, paused, progress.level, running]);

  useEffect(() => {
    if (!running) {
      pauseStartedAtRef.current = null;
      return;
    }
    if (paused) {
      if (pauseStartedAtRef.current === null) pauseStartedAtRef.current = Date.now();
      return;
    }
    if (pauseStartedAtRef.current !== null) {
      const pausedFor = Date.now() - pauseStartedAtRef.current;
      deadlineRef.current += pausedFor;
      startRef.current += pausedFor;
      pauseStartedAtRef.current = null;
    }
  }, [paused, running]);

  const start = () => {
    playMiniGameStartCue();
    committedRef.current = false;
    scoreRef.current = 0;
    comboRef.current = 0;
    startRef.current = Date.now();
    deadlineRef.current = startRef.current + GAME_SECONDS * 1000;
    setScore(0);
    setCombo(0);
    setRemaining(GAME_SECONDS);
    setFinished(false);
    onRuntimeStateChange?.("running");
    setRunning(true);
  };

  const strike = () => {
    if (!running || paused) return;
    const now = Date.now();
    const difficulty = getMiniGameDifficulty(scoreRef.current, progress.level, 120, 4, 12);
    const window = getStrikeWindow(zoneRef.current, getStrikeZoneWidth(scoreRef.current, progress.level) * (1 + relicBonuses.hitWindow));
    const cursorPosition = cursorRef.current;
    const nextCombo = comboRef.current + 1;

    if (cursorPosition >= window.perfectLeft && cursorPosition <= window.perfectRight) {
      const gain = Math.round((70 + Math.min(90, nextCombo * 8)) * (1 + relicBonuses.scoreBonus));
      comboRef.current = nextCombo;
      scoreRef.current += gain;
      deadlineRef.current = addGameTime(deadlineRef.current, now, 1350 + nextCombo * 70);
      setCombo(nextCombo);
      setScore(scoreRef.current);
      showScorePopup(gain);
      playMiniGameComboSound();
      showFeedback("Perfekcyjne cięcie");
      return;
    }

    if (cursorPosition >= window.left && cursorPosition <= window.right) {
      const gain = Math.round((34 + Math.min(50, nextCombo * 5)) * (1 + relicBonuses.scoreBonus));
      comboRef.current = nextCombo;
      scoreRef.current += gain;
      deadlineRef.current = addGameTime(deadlineRef.current, now, 550);
      setCombo(nextCombo);
      setScore(scoreRef.current);
      showScorePopup(gain);
      playMiniGameHitSound();
      showFeedback("Trafienie");
      return;
    }

    comboRef.current = 0;
    deadlineRef.current -= Math.round((1800 + difficulty * 130) * (1 - relicBonuses.timePenaltyResist));
    setCombo(0);
    playMiniGamePenaltySound();
    showFeedback("-2s spóźniony zamach");
  };

  const strikeZone = getStrikeWindow(zone, getStrikeZoneWidth(score, progress.level) * (1 + relicBonuses.hitWindow));

  return (
    <MiniGameFrame definition={definition} score={score} combo={combo} remaining={remaining} scorePopup={scorePopup} finished={finished} showHud={running} stageBackground={stageBackground} stageEffect={stageEffect} showGrid={showGrid} graphicsQuality={graphicsQuality}>
      <div className="relative h-full min-h-[360px] overflow-hidden p-5">
        <div className="relative z-10 flex h-full flex-col justify-center gap-8">
          <div className="sl-input rounded-[24px] p-5 shadow-inner">
            <div className="sl-progress-track relative h-16 rounded-full border border-[var(--theme-border)]">
              <div
                className="absolute top-1/2 h-12 -translate-y-1/2 rounded-full border border-[color-mix(in_srgb,var(--theme-accent)_70%,white)] bg-[var(--theme-accent-soft)] shadow-[0_0_30px_color-mix(in_srgb,var(--theme-accent)_35%,transparent)]"
                style={{ left: `${strikeZone.left}%`, width: `${strikeZone.width}%` }}
              />
              <div
                className="absolute top-1/2 h-8 -translate-y-1/2 rounded-full border border-[color-mix(in_srgb,var(--theme-text)_40%,transparent)] bg-[color-mix(in_srgb,var(--theme-text)_10%,transparent)]"
                style={{ left: `${strikeZone.perfectLeft}%`, width: `${strikeZone.perfectRight - strikeZone.perfectLeft}%` }}
              />
              <div className="absolute top-1/2 h-14 w-1 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[var(--theme-text-strong)] shadow-[0_0_22px_color-mix(in_srgb,var(--theme-text)_55%,transparent)]" style={{ left: `${cursor}%` }} />
            </div>
            <p className="sl-muted mt-3 text-center font-mono text-[10px] uppercase tracking-[0.24em]">Uderz, gdy wskaźnik przejdzie przez słaby punkt</p>
          </div>
          <button type="button" onClick={strike} className="sl-button-primary min-h-16 rounded-3xl px-6 text-base font-black uppercase tracking-[0.16em] active:scale-[0.98]">
            Cięcie
          </button>
        </div>
        <Feedback text={feedback} />
        {!running && <StartOverlay finished={finished} score={score} title={finished ? "Wynik zapisany" : definition.title} text={definition.shortGoal} tips={definition.readyTips} relicBonuses={relicBonuses} onStart={start} onExit={onExit} />}
      </div>
    </MiniGameFrame>
  );
}

function ManaMemoryGame({ definition, progress, paused = false, stageBackground, relicBonuses, stageEffect, showGrid, graphicsQuality, onComplete, onRuntimeStateChange, onExit }: ActiveGameProps) {
  const [running, setRunning] = useState(false);
  const [finished, setFinished] = useState(false);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [remaining, setRemaining] = useState(36);
  const [sequence, setSequence] = useState<string[]>([]);
  const [inputIndex, setInputIndex] = useState(0);
  const [phase, setPhase] = useState<"idle" | "showing" | "input">("idle");
  const [activeRune, setActiveRune] = useState<string | null>(null);
  const timersRef = useRef<number[]>([]);
  const scoreRef = useRef(0);
  const comboRef = useRef(0);
  const deadlineRef = useRef(0);
  const committedRef = useRef(false);
  const pauseStartedAtRef = useRef<number | null>(null);
  const { feedback, showFeedback } = useFeedback();
  const { scorePopup, showScorePopup } = useScorePopup();

  const clearTimers = useCallback(() => {
    timersRef.current.forEach((timer) => window.clearTimeout(timer));
    timersRef.current = [];
  }, []);

  const playSequence = useCallback((nextSequence: string[]) => {
    clearTimers();
    setPhase("showing");
    setInputIndex(0);
    const stepMs = getMemoryStepMs(scoreRef.current, progress.level) + relicBonuses.targetLifetime + Math.round(relicBonuses.hitWindow * 1000);
    const flashMs = Math.max(180, stepMs - 170);
    nextSequence.forEach((rune, index) => {
      timersRef.current.push(window.setTimeout(() => setActiveRune(rune), index * stepMs));
      timersRef.current.push(window.setTimeout(() => setActiveRune(null), index * stepMs + flashMs));
    });
    timersRef.current.push(window.setTimeout(() => setPhase("input"), nextSequence.length * stepMs + 160));
  }, [clearTimers, progress.level, relicBonuses.hitWindow, relicBonuses.targetLifetime]);

  const finish = useCallback((finalScore: number) => {
    if (committedRef.current) return;
    committedRef.current = true;
    clearTimers();
    playMiniGameFinishCue(finalScore, definition);
    setRunning(false);
    setFinished(true);
    setPhase("idle");
    onRuntimeStateChange?.("finished");
    onComplete({
      gameId: definition.id,
      score: finalScore,
      survivedSeconds: 36,
      won: finalScore >= definition.winScore,
      statHint: definition.statHint,
    });
  }, [clearTimers, definition, onComplete, onRuntimeStateChange]);

  useEffect(() => {
    if (!running || paused) return;
    const timer = window.setInterval(() => {
      const now = Date.now();
      const left = Math.max(0, Math.ceil((deadlineRef.current - now) / 1000));
      setRemaining(left);
      if (left <= 0) {
        window.clearInterval(timer);
        finish(scoreRef.current);
      }
    }, 100);
    return () => window.clearInterval(timer);
  }, [finish, paused, running]);

  useEffect(() => {
    if (!running) {
      pauseStartedAtRef.current = null;
      return;
    }
    if (paused) {
      if (pauseStartedAtRef.current === null) pauseStartedAtRef.current = Date.now();
      clearTimers();
      setActiveRune(null);
      return;
    }
    if (pauseStartedAtRef.current !== null) {
      const pausedFor = Date.now() - pauseStartedAtRef.current;
      deadlineRef.current += pausedFor;
      pauseStartedAtRef.current = null;
      if (phase === "showing" && sequence.length) playSequence(sequence);
    }
  }, [clearTimers, paused, phase, playSequence, running, sequence]);

  useEffect(() => clearTimers, [clearTimers]);

  const start = () => {
    playMiniGameStartCue();
    committedRef.current = false;
    scoreRef.current = 0;
    comboRef.current = 0;
    deadlineRef.current = Date.now() + 36_000;
    const firstSequence = randomRuneSequence(3 + Math.min(2, Math.floor(progress.level / 5)));
    setSequence(firstSequence);
    setScore(0);
    setCombo(0);
    setRemaining(36);
    setFinished(false);
    onRuntimeStateChange?.("running");
    setRunning(true);
    playSequence(firstSequence);
  };

  const tapRune = (rune: string) => {
    if (!running || paused || phase !== "input") return;
    if (rune !== sequence[inputIndex]) {
      const difficulty = getMiniGameDifficulty(scoreRef.current, progress.level, 150, 5, 10);
      comboRef.current = 0;
      deadlineRef.current -= Math.round((1900 + difficulty * 120) * (1 - relicBonuses.timePenaltyResist));
      setCombo(0);
      playMiniGamePenaltySound();
      showFeedback("-2s błędna runa");
      playSequence(sequence);
      return;
    }

    const nextIndex = inputIndex + 1;
    setInputIndex(nextIndex);
    if (nextIndex < sequence.length) return;

    const nextCombo = comboRef.current + 1;
    const gain = Math.round((45 + sequence.length * 12 + Math.min(80, nextCombo * 8)) * (1 + relicBonuses.scoreBonus));
    const nextScore = scoreRef.current + gain;
    const nextSequence = randomRuneSequence(Math.min(7, 3 + Math.floor(nextScore / 180) + Math.floor(progress.level / 5)));
    comboRef.current = nextCombo;
    scoreRef.current = nextScore;
    deadlineRef.current = addGameTime(deadlineRef.current, Date.now(), 1200 + sequence.length * 120);
    setScore(nextScore);
    setCombo(nextCombo);
    setSequence(nextSequence);
    showScorePopup(gain);
    playMiniGameHitSound();
    showFeedback("Sekwencja zamknięta");
    playSequence(nextSequence);
  };

  return (
    <MiniGameFrame definition={definition} score={score} combo={combo} remaining={remaining} scorePopup={scorePopup} finished={finished} showHud={running} stageBackground={stageBackground} stageEffect={stageEffect} showGrid={showGrid} graphicsQuality={graphicsQuality}>
      <div className="relative h-full min-h-[360px] overflow-hidden p-5">
        <div className="relative z-10 flex h-full flex-col justify-center gap-5">
          <p className="sl-muted text-center font-mono text-[10px] uppercase tracking-[0.24em]">
            {phase === "showing" ? "System pokazuje runy" : phase === "input" ? `Powtórz runę ${inputIndex + 1}/${sequence.length}` : "Gotowy"}
          </p>
          <div className="grid grid-cols-2 gap-3">
            {RUNES.map((rune) => (
              <button
                key={rune}
                type="button"
                onClick={() => tapRune(rune)}
                className={`min-h-24 rounded-[24px] border text-2xl font-black tracking-widest transition active:scale-[0.98] ${
                  activeRune === rune
                    ? "sl-chip-active shadow-[0_0_28px_color-mix(in_srgb,var(--theme-accent)_28%,transparent)]"
                    : "sl-chip"
                }`}
              >
                {rune}
              </button>
            ))}
          </div>
        </div>
        <Feedback text={feedback} />
        {!running && <StartOverlay finished={finished} score={score} title={finished ? "Wynik zapisany" : definition.title} text={definition.shortGoal} tips={definition.readyTips} relicBonuses={relicBonuses} onStart={start} onExit={onExit} />}
      </div>
    </MiniGameFrame>
  );
}

function RuneLockGame({ definition, progress, paused = false, stageBackground, relicBonuses, stageEffect, showGrid, graphicsQuality, onComplete, onRuntimeStateChange, onExit }: ActiveGameProps) {
  const [running, setRunning] = useState(false);
  const [finished, setFinished] = useState(false);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [remaining, setRemaining] = useState(GAME_SECONDS);
  const [lockRemaining, setLockRemaining] = useState(0);
  const [code, setCode] = useState<string[]>(() => randomRuneSequence(4));
  const [index, setIndex] = useState(0);
  const scoreRef = useRef(0);
  const comboRef = useRef(0);
  const deadlineRef = useRef(0);
  const lockExpiresAtRef = useRef(0);
  const committedRef = useRef(false);
  const pauseStartedAtRef = useRef<number | null>(null);
  const { feedback, showFeedback } = useFeedback();
  const { scorePopup, showScorePopup } = useScorePopup();

  const finish = useCallback((finalScore: number) => {
    if (committedRef.current) return;
    committedRef.current = true;
    playMiniGameFinishCue(finalScore, definition);
    setRunning(false);
    setFinished(true);
    onRuntimeStateChange?.("finished");
    onComplete({
      gameId: definition.id,
      score: finalScore,
      survivedSeconds: GAME_SECONDS,
      won: finalScore >= definition.winScore,
      statHint: definition.statHint,
    });
  }, [definition, onComplete, onRuntimeStateChange]);

  useEffect(() => {
    if (!running || paused) return;
    const timer = window.setInterval(() => {
      const now = Date.now();
      if (now >= lockExpiresAtRef.current) {
        const difficulty = getMiniGameDifficulty(scoreRef.current, progress.level, 130, 5, 12);
        comboRef.current = 0;
        deadlineRef.current -= Math.round((1300 + difficulty * 90) * (1 - relicBonuses.timePenaltyResist));
        setCombo(0);
        showFeedback("-czas pieczęci");
        nextLock(scoreRef.current);
      }
      const left = Math.max(0, Math.ceil((deadlineRef.current - now) / 1000));
      setRemaining(left);
      setLockRemaining(Math.max(0, Math.ceil((lockExpiresAtRef.current - now) / 1000)));
      if (left <= 0) {
        window.clearInterval(timer);
        finish(scoreRef.current);
      }
    }, 100);
    return () => window.clearInterval(timer);
  }, [finish, paused, running]);

  useEffect(() => {
    if (!running) {
      pauseStartedAtRef.current = null;
      return;
    }
    if (paused) {
      if (pauseStartedAtRef.current === null) pauseStartedAtRef.current = Date.now();
      return;
    }
    if (pauseStartedAtRef.current !== null) {
      const pausedFor = Date.now() - pauseStartedAtRef.current;
      deadlineRef.current += pausedFor;
      lockExpiresAtRef.current += pausedFor;
      pauseStartedAtRef.current = null;
    }
  }, [paused, running]);

  const nextLock = (nextScore = scoreRef.current) => {
    const difficulty = getMiniGameDifficulty(nextScore, progress.level, 140, 6, 10);
    setCode(randomRuneSequence(Math.min(8, 4 + difficulty)));
    setIndex(0);
    const lockWindowMs = getRuneLockWindowMs(nextScore, progress.level) + relicBonuses.targetLifetime + Math.round(relicBonuses.hitWindow * 1000);
    lockExpiresAtRef.current = Date.now() + lockWindowMs;
    setLockRemaining(Math.ceil(lockWindowMs / 1000));
  };

  const start = () => {
    playMiniGameStartCue();
    committedRef.current = false;
    scoreRef.current = 0;
    comboRef.current = 0;
    deadlineRef.current = Date.now() + GAME_SECONDS * 1000;
    setScore(0);
    setCombo(0);
    setRemaining(GAME_SECONDS);
    setFinished(false);
    nextLock(0);
    onRuntimeStateChange?.("running");
    setRunning(true);
  };

  const tap = (rune: string) => {
    if (!running || paused) return;
    if (rune !== code[index]) {
      const difficulty = getMiniGameDifficulty(scoreRef.current, progress.level, 130, 5, 12);
      comboRef.current = 0;
      deadlineRef.current -= Math.round((1500 + difficulty * 100) * (1 - relicBonuses.timePenaltyResist));
      setCombo(0);
      playMiniGamePenaltySound();
      showFeedback("-2s fałszywy znak");
      return;
    }

    const nextIndex = index + 1;
    setIndex(nextIndex);
    if (nextIndex < code.length) return;

    const nextCombo = comboRef.current + 1;
    const gain = Math.round((55 + code.length * 10 + Math.min(90, nextCombo * 9)) * (1 + relicBonuses.scoreBonus));
    const nextScore = scoreRef.current + gain;
    comboRef.current = nextCombo;
    scoreRef.current = nextScore;
    deadlineRef.current = addGameTime(deadlineRef.current, Date.now(), 900 + code.length * 90);
    setScore(nextScore);
    setCombo(nextCombo);
    showScorePopup(gain);
    playMiniGameHitSound();
    showFeedback("Pieczęć otwarta");
    nextLock(nextScore);
  };

  return (
    <MiniGameFrame definition={definition} score={score} combo={combo} remaining={remaining} scorePopup={scorePopup} finished={finished} showHud={running} stageBackground={stageBackground} stageEffect={stageEffect} showGrid={showGrid} graphicsQuality={graphicsQuality}>
      <div className="relative h-full min-h-[360px] overflow-hidden p-5">
        <div className="relative z-10 flex h-full flex-col justify-center gap-5">
          <div className="sl-input rounded-[24px] p-4">
            <div className="flex items-center justify-between gap-3">
              <p className="sl-kicker font-mono text-[10px] uppercase tracking-[0.24em]">Kod bramy</p>
              <p className="font-mono text-[10px] font-black uppercase tracking-widest text-[var(--theme-warning-text)]">Stabilność {lockRemaining}s</p>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {code.map((rune, runeIndex) => (
                <span key={`${rune}_${runeIndex}`} className={`rounded-2xl border px-3 py-2 font-mono text-sm font-black ${runeIndex < index ? "sl-chip-active" : "sl-chip"}`}>
                  {rune}
                </span>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {RUNES.map((rune) => (
              <button key={rune} type="button" onClick={() => tap(rune)} className="sl-button-secondary min-h-20 rounded-[22px] text-xl font-black tracking-widest active:scale-[0.98]">
                {rune}
              </button>
            ))}
          </div>
        </div>
        <Feedback text={feedback} />
        {!running && <StartOverlay finished={finished} score={score} title={finished ? "Wynik zapisany" : definition.title} text={definition.shortGoal} tips={definition.readyTips} relicBonuses={relicBonuses} onStart={start} onExit={onExit} />}
      </div>
    </MiniGameFrame>
  );
}

function ShadowExtractionGame({
  definition,
  progress,
  player,
  paused = false,
  orientationMode = "portrait",
  stageBackground,
  relicBonuses,
  stageEffect,
  showGrid,
  graphicsQuality,
  onComplete,
  onRuntimeStateChange,
  onExit,
}: ActiveGameProps & {
  player: PlayerState;
  paused?: boolean;
  orientationMode?: MiniGameOrientationMode;
  onBuyEffect: (effectId: ShadowExtractionEffectId) => void;
  onBuyUpgrade: (upgradeId: ShadowExtractionUpgradeId) => void;
  onSelectEffect: (effectId: ShadowExtractionEffectId) => void;
}) {
  const upgrades = useMemo(
    () => normalizeShadowExtractionUpgrades(player.miniGameUpgrades?.shadowExtraction),
    [player.miniGameUpgrades?.shadowExtraction]
  );
  const selectedEffect = getShadowExtractionEffect(mapMiniGameEffectToShadowExtractionEffect(stageEffect.id));
  const [running, setRunning] = useState(false);
  const [finished, setFinished] = useState(false);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [remaining, setRemaining] = useState(GAME_SECONDS);
  const [objects, setObjects] = useState<ShadowSliceObject[]>([]);
  const [trail, setTrail] = useState<SliceTrailPoint[]>([]);
  const [impactEffects, setImpactEffects] = useState<SliceImpactEffect[]>([]);
  const [signalPercent, setSignalPercent] = useState(100);
  const [playfieldSize, setPlayfieldSize] = useState<PlayfieldSize | null>(null);
  const playfieldRef = useRef<HTMLDivElement | null>(null);
  const playfieldRectRef = useRef<DOMRect | null>(null);
  const objectsRef = useRef<ShadowSliceObject[]>([]);
  const trailRef = useRef<SliceTrailPoint[]>([]);
  const scoreRef = useRef(0);
  const comboRef = useRef(0);
  const hpRestoredRef = useRef(0);
  const deadlineRef = useRef(0);
  const committedRef = useRef(false);
  const slicingRef = useRef(false);
  const lastFrameRef = useRef(0);
  const lastSpawnRef = useRef(0);
  const lastObjectsRenderRef = useRef(0);
  const lastUiRenderRef = useRef(0);
  const lastTrailRenderRef = useRef(0);
  const framePressureUntilRef = useRef(0);
  const framePressureHitsRef = useRef(0);
  const pauseStartedAtRef = useRef<number | null>(null);
  const animationRef = useRef<number | null>(null);
  const hudSyncFrameRef = useRef<number | null>(null);
  const impactTimersRef = useRef<number[]>([]);
  const { feedback, showFeedback } = useFeedback();
  const { scorePopup, showScorePopup } = useScorePopup();

  const setObjectsSync = useCallback((next: ShadowSliceObject[]) => {
    objectsRef.current = next;
    setObjects(next);
  }, []);

  const clearImpactEffects = useCallback(() => {
    impactTimersRef.current.forEach((timer) => window.clearTimeout(timer));
    impactTimersRef.current = [];
    setImpactEffects([]);
  }, []);

  const scheduleHudSync = useCallback(() => {
    if (hudSyncFrameRef.current !== null) return;
    hudSyncFrameRef.current = window.requestAnimationFrame(() => {
      hudSyncFrameRef.current = null;
      setScore(scoreRef.current);
      setCombo(comboRef.current);
    });
  }, []);

  const emitSliceImpact = useCallback((object: ShadowSliceObject, label: string) => {
    const effect: SliceImpactEffect = {
      id: `impact_${object.id}_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`,
      kind: object.kind,
      x: object.x,
      y: object.y,
      sizePx: Math.max(44, object.sizePx * 1.12),
      rotation: object.rotation,
      color: getSliceImpactColor(object.kind, selectedEffect.id),
      label,
    };
    const underFramePressure = framePressureUntilRef.current > performance.now();
    const maxEffects = getShadowExtractionImpactBudget(graphicsQuality, underFramePressure);
    setImpactEffects((current) => [...current.slice(-(maxEffects - 1)), effect]);
    const timer = window.setTimeout(() => {
      setImpactEffects((current) => current.filter((item) => item.id !== effect.id));
      impactTimersRef.current = impactTimersRef.current.filter((item) => item !== timer);
    }, getShadowExtractionImpactLifetimeMs(graphicsQuality, underFramePressure));
    impactTimersRef.current.push(timer);
  }, [graphicsQuality, selectedEffect.id]);

  const finish = useCallback((finalScore: number) => {
    if (committedRef.current) return;
    committedRef.current = true;
    playMiniGameFinishCue(finalScore, definition);
    setRunning(false);
    setFinished(true);
    trailRef.current = [];
    setTrail([]);
    clearImpactEffects();
    setObjectsSync([]);
    onRuntimeStateChange?.("finished");
    onComplete({
      gameId: definition.id,
      score: finalScore,
      survivedSeconds: GAME_SECONDS,
      won: finalScore >= definition.winScore,
      statHint: definition.statHint,
      hpRestored: hpRestoredRef.current,
    });
  }, [clearImpactEffects, definition, onComplete, onRuntimeStateChange, setObjectsSync]);

  const applyMissPenalty = useCallback((message: string, penaltyMs: number) => {
    comboRef.current = 0;
    deadlineRef.current -= penaltyMs;
    scheduleHudSync();
    showFeedback(message);
  }, [scheduleHudSync, showFeedback]);

  const spawnObject = useCallback((now: number) => {
    const difficulty = getMiniGameDifficulty(scoreRef.current, progress.level, 120, 4, 14);
    const underFramePressure = framePressureUntilRef.current > now;
    const objectBudget = getShadowExtractionObjectBudget(graphicsQuality, underFramePressure);

    // Fruit Ninja wave size: 1-3 shadows thrown together into the air
    const isComboWave = Math.random() < Math.min(0.75, 0.35 + difficulty * 0.04);
    const waveCount = isComboWave
      ? (difficulty >= 7 && Math.random() > 0.45 ? 3 : 2)
      : 1;

    const availableSlots = objectBudget - objectsRef.current.length;
    const actualBatch = Math.min(availableSlots, waveCount);
    if (actualBatch <= 0) return;

    const nextObjects = [...objectsRef.current];
    const isLandscape = orientationMode === "landscape";
    const span = (isLandscape ? 68 : 56) / Math.max(1, actualBatch);

    for (let index = 0; index < actualBatch; index += 1) {
      const minX = (isLandscape ? 16 : 22) + index * span;
      const spawnX = minX + Math.random() * (span * 0.82);

      const object = createShadowSliceObject({
        difficulty,
        score: scoreRef.current,
        level: progress.level,
        playerHp: player.hp,
        upgrades,
        relicBonuses,
        orientationMode,
        now: now + index * 12,
        wallNow: Date.now(),
        spawnX,
      });
      nextObjects.push(object);
    }

    setObjectsSync(nextObjects);
  }, [graphicsQuality, orientationMode, player.hp, progress.level, relicBonuses, setObjectsSync, upgrades]);


  const start = useCallback(() => {
    playMiniGameStartCue();
    committedRef.current = false;
    scoreRef.current = 0;
    comboRef.current = 0;
    hpRestoredRef.current = 0;
    deadlineRef.current = Date.now() + GAME_SECONDS * 1000;
    lastFrameRef.current = performance.now();
    lastSpawnRef.current = 0;
    lastObjectsRenderRef.current = 0;
    lastUiRenderRef.current = 0;
    lastTrailRenderRef.current = 0;
    framePressureUntilRef.current = 0;
    framePressureHitsRef.current = 0;
    setObjectsSync([]);
    trailRef.current = [];
    setTrail([]);
    clearImpactEffects();
    setScore(0);
    setCombo(0);
    setRemaining(GAME_SECONDS);
    setSignalPercent(100);
    setFinished(false);
    onRuntimeStateChange?.("running");
    setRunning(true);
  }, [clearImpactEffects, onRuntimeStateChange, setObjectsSync]);

  useEffect(() => {
    return () => {
      if (animationRef.current) window.cancelAnimationFrame(animationRef.current);
      if (hudSyncFrameRef.current) window.cancelAnimationFrame(hudSyncFrameRef.current);
      impactTimersRef.current.forEach((timer) => window.clearTimeout(timer));
    };
  }, []);

  useEffect(() => {
    const element = playfieldRef.current;
    if (!element) return;

    const updateSize = () => {
      const rect = element.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      playfieldRectRef.current = rect;
      setPlayfieldSize((current) => {
        const width = Math.round(rect.width);
        const height = Math.round(rect.height);
        if (current?.width === width && current.height === height) return current;
        return { width, height };
      });
    };

    updateSize();
    if (typeof ResizeObserver === "undefined") {
      window.addEventListener("resize", updateSize);
      return () => window.removeEventListener("resize", updateSize);
    }

    const observer = new ResizeObserver(updateSize);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!running) {
      pauseStartedAtRef.current = null;
      return;
    }

    if (paused) {
      if (pauseStartedAtRef.current === null) {
        pauseStartedAtRef.current = Date.now();
      }
      return;
    }

    if (pauseStartedAtRef.current !== null) {
      const pausedForMs = Date.now() - pauseStartedAtRef.current;
      deadlineRef.current += pausedForMs;
      lastSpawnRef.current += pausedForMs;
      setObjectsSync(objectsRef.current.map((object) => ({
        ...object,
        spawnedAt: object.spawnedAt + pausedForMs,
        expiresAt: object.expiresAt + pausedForMs,
      })));
      lastFrameRef.current = performance.now();
      pauseStartedAtRef.current = null;
    }

    const tick = () => {
      if (!running || paused) return;


      const now = performance.now();
      const lastFrame = lastFrameRef.current || now;
      const deltaMs = Math.max(0, now - lastFrame);
      const delta = Math.min(0.05, Math.max(0.001, deltaMs / 1000));
      lastFrameRef.current = now;
      if (deltaMs > SHADOW_EXTRACTION_STUTTER_MS) {
        framePressureHitsRef.current += 1;
        if (deltaMs > SHADOW_EXTRACTION_HARD_STUTTER_MS || framePressureHitsRef.current >= 2) {
          framePressureUntilRef.current = now + SHADOW_EXTRACTION_PRESSURE_MS;
        }
      } else if (framePressureHitsRef.current > 0) {
        framePressureHitsRef.current -= 1;
      }

      const difficulty = getMiniGameDifficulty(scoreRef.current, progress.level, 120, 4, 14);
      const waveCooldownMs = Math.max(900, 1600 - difficulty * 45 - upgrades.upgrades.flow * 35);

      if (now - lastSpawnRef.current >= waveCooldownMs || (objectsRef.current.length === 0 && now - lastSpawnRef.current >= 450)) {
        lastSpawnRef.current = now;
        spawnObject(now);
      }

      const updatedObjects: ShadowSliceObject[] = [];
      let missedTrue = 0;
      const wallNow = Date.now();
      for (const object of objectsRef.current) {
        const nextObject = {
          ...object,
          x: object.x + object.vx * delta,
          y: object.y + object.vy * delta,
          vy: object.vy + object.gravity * delta,
          rotation: object.rotation + object.spin * delta,
        };

        if (wallNow >= nextObject.expiresAt) {
          if (nextObject.kind === "true") missedTrue += 1;
        } else if (nextObject.y > 114 && nextObject.vy > 0) {
          // Completed full parabolic arc and fell back down below the screen
          if (nextObject.kind === "true") missedTrue += 1;
        } else {
          updatedObjects.push(nextObject);
        }
      }

      if (missedTrue > 0) {
        applyMissPenalty("-cień uciekł", Math.min(1600, 680 + difficulty * 55));
      }

      objectsRef.current = updatedObjects;
      const objectRenderIntervalMs = framePressureUntilRef.current > now
        ? Math.max(SHADOW_EXTRACTION_OBJECT_RENDER_INTERVAL_MS[graphicsQuality], SHADOW_EXTRACTION_PRESSURE_RENDER_INTERVAL_MS)
        : SHADOW_EXTRACTION_OBJECT_RENDER_INTERVAL_MS[graphicsQuality];
      if (now - lastObjectsRenderRef.current >= objectRenderIntervalMs) {
        lastObjectsRenderRef.current = now;
        setObjects(updatedObjects);
      }
      const catchableObjects = updatedObjects.filter((object) => object.kind === "true" || object.kind === "gold" || object.kind === "heart" || object.kind === "time");
      const strongestSignal = catchableObjects.reduce((best, object) => {
        const lifetime = Math.max(1, object.expiresAt - object.spawnedAt);
        const left = Math.max(0, object.expiresAt - wallNow);
        return Math.max(best, (left / lifetime) * 100);
      }, 0);
      const left = Math.max(0, Math.ceil((deadlineRef.current - wallNow) / 1000));
      if (now - lastUiRenderRef.current >= getSmoothUiIntervalMs() || left <= 0) {
        lastUiRenderRef.current = now;
        setSignalPercent(catchableObjects.length ? strongestSignal : 100);
        setRemaining(left);
      }
      if (left <= 0) {
        finish(scoreRef.current);
        return;
      }

      animationRef.current = window.requestAnimationFrame(tick);
    };

    animationRef.current = window.requestAnimationFrame(tick);
    return () => {
      if (animationRef.current) window.cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    };
  }, [applyMissPenalty, finish, graphicsQuality, paused, progress.level, running, setObjectsSync, spawnObject, upgrades.upgrades.flow]);

  const handleSliceHit = useCallback((object: ShadowSliceObject, slashAngle = 0) => {
    const difficulty = getMiniGameDifficulty(scoreRef.current, progress.level, 120, 4, 14);

    if (object.kind === "trap") {
      playMiniGamePenaltySound();
      emitSliceImpact(object, "💥 -CZAS!", slashAngle);
      const penalty = Math.round((3100 + difficulty * 120) * (1 - upgrades.upgrades.ward * 0.12 - relicBonuses.timePenaltyResist));
      comboRef.current = 0;
      scoreRef.current = Math.max(0, scoreRef.current - 30);
      deadlineRef.current -= penalty;
      scheduleHudSync();
      showScorePopup(-30);
      showFeedback("💥 Przeklęty Rdzeń!");
      return;
    }

    if (object.kind === "decoy") {
      playMiniGamePenaltySound();
      emitSliceImpact(object, "fałsz", slashAngle);
      comboRef.current = 0;
      deadlineRef.current -= Math.round((950 + difficulty * 70) * (1 - relicBonuses.timePenaltyResist));
      scheduleHudSync();
      showFeedback("-fałszywy cień");
      return;
    }

    if (object.kind === "heart") {
      playRewardSound();
      const heal = Math.max(1, Math.floor(player.maxHp * SHADOW_HEART_HEAL_RATIO));
      hpRestoredRef.current += heal;
      comboRef.current += 1;
      scoreRef.current += 75;
      deadlineRef.current = applyCappedTimeBonus({
        deadline: deadlineRef.current,
        now: Date.now(),
        bonusMs: 1200,
        capMs: MAX_REMAINING_TIME_MS,
        diminishingFactor: 0.8,
      });
      scheduleHudSync();
      showScorePopup(75);
      emitSliceImpact(object, `❤️ +${heal} HP`, slashAngle);
      showFeedback("❤️ Serce Monarchy!");
      return;
    }

    if (object.kind === "time") {
      playRewardSound();
      comboRef.current += 1;
      scoreRef.current += 35;
      deadlineRef.current = applyCappedTimeBonus({
        deadline: deadlineRef.current,
        now: Date.now(),
        bonusMs: SHADOW_TIME_BUBBLE_BONUS_MS,
        capMs: MAX_REMAINING_TIME_MS,
        diminishingFactor: 1,
      });
      scheduleHudSync();
      showScorePopup(35);
      emitSliceImpact(object, `⏱️ +${formatBonusSeconds(SHADOW_TIME_BUBBLE_BONUS_MS)}`, slashAngle);
      showFeedback("⏱️ Bańka Czasu!");
      return;
    }

    const nextCombo = comboRef.current + 1;
    const baseGain = object.kind === "gold" ? 28 : 52;
    const gain = Math.round((baseGain + Math.min(140, nextCombo * 12)) * (1 + relicBonuses.scoreBonus));
    const timeBonus = object.kind === "gold"
      ? 700
      : Math.max(450, 880 + nextCombo * 60 + upgrades.upgrades.flow * 115 - difficulty * 25);
    const diminishingFactor = Math.max(0.40, 1 - nextCombo * 0.025 - difficulty * 0.016);
    comboRef.current = nextCombo;
    scoreRef.current += gain;
    deadlineRef.current = applyCappedTimeBonus({
      deadline: deadlineRef.current,
      now: Date.now(),
      bonusMs: timeBonus,
      capMs: MAX_REMAINING_TIME_MS,
      diminishingFactor,
    });
    scheduleHudSync();
    showScorePopup(gain);
    emitSliceImpact(object, object.kind === "gold" ? "🪙 +Złoto" : `⚔️ +${gain}`, slashAngle);
    showFeedback(object.kind === "gold" ? "🪙 Odłamek Złota" : "✨ Ekstrakcja Cienia");
    if (object.kind === "gold" || nextCombo % 5 === 0) {
      playMiniGameComboSound();
    } else {
      playMiniGameHitSound();
    }
  }, [emitSliceImpact, player.maxHp, progress.level, relicBonuses.scoreBonus, relicBonuses.timePenaltyResist, scheduleHudSync, showFeedback, showScorePopup, upgrades.upgrades.flow, upgrades.upgrades.ward]);

  const slicePath = useCallback((path: SliceTrailPoint[]) => {
    const rect = playfieldRectRef.current ?? playfieldRef.current?.getBoundingClientRect();
    if (!rect || path.length === 0) return;

    const pathPx = path.map((point) => pointToPixels(point, rect));
    const hitIds = new Set<string>();
    const bladeWidth = orientationMode === "portrait" ? 34 : 30;

    let slashAngle = 0;
    if (path.length >= 2) {
      const p1 = path[path.length - 2];
      const p2 = path[path.length - 1];
      slashAngle = (Math.atan2(p2.y - p1.y, p2.x - p1.x) * 180) / Math.PI;
    }

    for (const object of objectsRef.current) {
      const center = {
        x: (object.x / 100) * rect.width,
        y: (object.y / 100) * rect.height,
        radius: getShadowSliceHitRadius(object, orientationMode),
      };
      if (!pathBoundsCouldIntersectCircle(pathPx, center, bladeWidth)) {
        continue;
      }
      if (slicePathIntersectsTarget(pathPx, center, { bladeWidth, maxSegmentLength: 5 })) {
        hitIds.add(object.id);
      }
    }

    if (hitIds.size === 0) return;

    const hitObjects = objectsRef.current.filter((object) => hitIds.has(object.id));
    setObjectsSync(objectsRef.current.filter((object) => !hitIds.has(object.id)));

    // Multi-cut Fruit Ninja combo recognition
    const validCuts = hitObjects.filter((o) => o.kind === "true" || o.kind === "gold" || o.kind === "heart" || o.kind === "time").length;
    if (validCuts >= 3) {
      playMiniGameComboSound();
      showFeedback(`⚔️ COMBO x${validCuts}! +${validCuts * 25}`);
      scoreRef.current += validCuts * 25;
      scheduleHudSync();
      showScorePopup(validCuts * 25);
    } else if (validCuts === 2) {
      showFeedback("⚔️ Podwójne cięcie!");
    }

    hitObjects.forEach((obj) => handleSliceHit(obj, slashAngle));
  }, [handleSliceHit, orientationMode, scheduleHudSync, setObjectsSync, showFeedback, showScorePopup]);

  const addTrailPoint = useCallback((point: SliceTrailPoint) => {
    const current = trailRef.current;
    const previous = current[current.length - 1];
    if (previous && Math.hypot(point.x - previous.x, point.y - previous.y) < 0.4) return;
    const next = [...current.slice(-10), point];
    trailRef.current = next;
    const now = performance.now();
    const trailEveryMs = framePressureUntilRef.current > now
      ? Math.max(SHADOW_EXTRACTION_TRAIL_INTERVAL_MS[graphicsQuality], SHADOW_EXTRACTION_PRESSURE_TRAIL_INTERVAL_MS)
      : SHADOW_EXTRACTION_TRAIL_INTERVAL_MS[graphicsQuality];
    if (now - lastTrailRenderRef.current >= trailEveryMs) {
      lastTrailRenderRef.current = now;
      setTrail(next);
    }
    slicePath(previous ? [previous, point] : [point]);
  }, [graphicsQuality, slicePath]);

  const pointerToPoint = useCallback((event: { clientX: number; clientY: number }): SliceTrailPoint | null => {
    const rect = playfieldRectRef.current ?? playfieldRef.current?.getBoundingClientRect();
    if (!rect) return null;
    return {
      x: Math.max(0, Math.min(100, ((event.clientX - rect.left) / rect.width) * 100)),
      y: Math.max(0, Math.min(100, ((event.clientY - rect.top) / rect.height) * 100)),
      time: Date.now(),
    };
  }, []);

  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (!running || paused) return;
    try {
      event.currentTarget.setPointerCapture(event.pointerId);
    } catch {
      // Ignore if pointer capture is not permitted
    }
    playfieldRectRef.current = event.currentTarget.getBoundingClientRect();
    slicingRef.current = true;
    const point = pointerToPoint(event);
    if (point) {
      trailRef.current = [point];
      setTrail([point]);
      slicePath([point]);
    }
  };

  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (!running || paused || !slicingRef.current) return;
    const coalesced = typeof event.getCoalescedEvents === "function" ? event.getCoalescedEvents() : [];
    if (coalesced.length > 0) {
      for (const e of coalesced) {
        const point = pointerToPoint(e);
        if (point) addTrailPoint(point);
      }
    } else {
      const point = pointerToPoint(event);
      if (point) addTrailPoint(point);
    }
  };


  const endSlice = (event?: PointerEvent<HTMLDivElement>) => {
    if (running && !paused && slicingRef.current && event) {
      const point = pointerToPoint(event);
      if (point) addTrailPoint(point);
    }
    slicingRef.current = false;
    playfieldRectRef.current = null;
    window.setTimeout(() => {
      trailRef.current = [];
      setTrail([]);
    }, 120);
  };

  return (
    <MiniGameFrame definition={definition} score={score} combo={combo} remaining={remaining} scorePopup={scorePopup} finished={finished} showHud={running} stageBackground={stageBackground} stageEffect={stageEffect} showGrid={showGrid} graphicsQuality={graphicsQuality} compact>
      <div className="relative h-full">
        <div
          ref={playfieldRef}
          className={`absolute inset-0 touch-none select-none overflow-hidden ${orientationMode === "portrait" ? "min-h-[460px]" : "min-h-[320px]"}`}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={endSlice}
          onPointerCancel={endSlice}
        >
          {objects.map((object) => (
            <ShadowSliceToken key={object.id} object={object} graphicsQuality={graphicsQuality} playfieldSize={playfieldSize} />
          ))}
          <SliceTrail points={trail} effect={selectedEffect} />
          {running && <ShadowExtractionChanceMeter remaining={remaining} signalPercent={signalPercent} />}
          {!running && (
            <StartOverlay
              finished={finished}
              score={score}
              title={finished ? "Wynik zapisany" : "Ekstrakcja cienia"}
              text={definition.shortGoal}
              tips={definition.readyTips}
              relicBonuses={relicBonuses}
              onStart={start}
              onExit={onExit}
            />
          )}
        </div>
        {/* Impact effects and feedback OUTSIDE overflow-hidden so labels are never clipped */}
        <SliceImpactLayer effects={impactEffects} graphicsQuality={graphicsQuality} />
        <Feedback text={feedback} />
      </div>
    </MiniGameFrame>
  );
}

type MiniGameShopTab = "effects" | "upgrades" | "boosters" | "backgrounds";

function MiniGameShopSheet({
  playerGold,
  shop,
  selectedStageEffect,
  activeTab,
  onTabChange,
  onClose,
  gameId,
  onBuyEffect,
  onSelectEffect,
  onBuyUpgrade,
  onBuyBooster,
  onActivateBooster,
  backgrounds,
  activeBackground,
  onBuyBackground,
  onSelectBackground,
  onImportBackground,
}: {
  playerGold: number;
  shop: MiniGameShopState;
  selectedStageEffect: MiniGameShopEffectId;
  activeTab: MiniGameShopTab;
  onTabChange: (tab: MiniGameShopTab) => void;
  onClose: () => void;
  gameId: MiniGameId;
  onBuyEffect: (gameId: MiniGameId, effectId: MiniGameShopEffectId) => void;
  onSelectEffect: (gameId: MiniGameId, effectId: MiniGameShopEffectId) => void;
  onBuyUpgrade: (gameId: MiniGameId, upgradeId: MiniGameShopUpgradeId) => void;
  onBuyBooster: (gameId: MiniGameId, boosterId: MiniGameShopBoosterId) => void;
  onActivateBooster: (gameId: MiniGameId, boosterId: MiniGameShopBoosterId) => void;
  backgrounds: MiniGameBackgroundsState;
  activeBackground: string;
  onBuyBackground: (gameId: MiniGameId, backgroundId: string) => void;
  onSelectBackground: (gameId: MiniGameId, backgroundId: string) => void;
  onImportBackground: (gameId: MiniGameId, file: File) => Promise<void>;
}) {
  const importInputRef = useRef<HTMLInputElement | null>(null);
  const backgroundOptions = useMemo(
    () => getAvailableBackgroundsForGame(gameId, backgrounds),
    [backgrounds, gameId]
  );

  const handleImportBackground = async (file: File | undefined) => {
    if (!file) return;
    await onImportBackground(gameId, file);
  };

  return (
    <motion.div
      className="sl-modal-backdrop absolute inset-0 z-[70] flex items-end"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="sl-modal max-h-[82dvh] w-full overflow-hidden rounded-t-[28px] border-t shadow-[0_-18px_48px_var(--theme-shadow)]"
        initial={{ y: 80 }}
        animate={{ y: 0 }}
        exit={{ y: 80 }}
        transition={{ type: "spring", stiffness: 260, damping: 28 }}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-3 border-b border-[var(--theme-border)] px-4 py-3">
          <div>
            <p className="sl-kicker font-mono text-[10px] font-black uppercase tracking-[0.26em]">Sklep mini-gry</p>
            <p className="sl-muted mt-1 text-xs font-black uppercase tracking-widest">Gold {playerGold}</p>
          </div>
          <button type="button" onClick={onClose} className="sl-button-secondary rounded-xl px-3 py-2 text-[10px] font-black uppercase tracking-widest">
            Zamknij
          </button>
        </div>
        <div className="grid grid-cols-4 gap-2 px-4 pt-3">
          <button type="button" onClick={() => onTabChange("effects")} className={`min-h-10 rounded-2xl text-xs font-black uppercase tracking-widest ${activeTab === "effects" ? "sl-chip-active" : "sl-chip"}`}>
            Efekty
          </button>
          <button type="button" onClick={() => onTabChange("upgrades")} className={`min-h-10 rounded-2xl text-xs font-black uppercase tracking-widest ${activeTab === "upgrades" ? "sl-chip-active" : "sl-chip"}`}>
            Upg.
          </button>
          <button type="button" onClick={() => onTabChange("boosters")} className={`min-h-10 rounded-2xl text-xs font-black uppercase tracking-widest ${activeTab === "boosters" ? "sl-chip-active" : "sl-chip"}`}>
            Boost
          </button>
          <button type="button" onClick={() => onTabChange("backgrounds")} className={`min-h-10 rounded-2xl text-xs font-black uppercase tracking-widest ${activeTab === "backgrounds" ? "sl-chip-active" : "sl-chip"}`}>
            Tła
          </button>
        </div>
        <div className="max-h-[54dvh] overflow-y-auto px-4 py-3 custom-scrollbar">
          {activeTab === "effects" ? (
            <div className="grid gap-2">
              {MINI_GAME_SHOP_EFFECTS.map((effect) => {
                const owned = (shop.ownedEffects[gameId] || []).includes(effect.id);
                const active = selectedStageEffect === effect.id;
                const affordable = playerGold >= effect.cost;
                return (
                  <div key={effect.id} className="sl-stat-tile rounded-2xl p-3">
                    <div className="h-1.5 rounded-full shadow-[0_0_14px_currentColor]" style={{ background: effect.accent, color: effect.accent }} />
                    <div className="mt-3 flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-black uppercase tracking-widest text-[var(--theme-text-strong)]">{effect.name}</p>
                        <p className="sl-muted mt-1 text-xs leading-relaxed">{effect.description}</p>
                        <p className="sl-kicker mt-2 text-[10px] font-black uppercase tracking-widest">{owned ? "Posiadane" : `${effect.cost} gold`}</p>
                      </div>
                      <button
                        type="button"
                        disabled={!owned && !affordable}
                        onClick={() => owned ? onSelectEffect(gameId, effect.id) : onBuyEffect(gameId, effect.id)}
                        className="sl-button-primary min-h-10 rounded-xl px-3 text-[10px] font-black uppercase tracking-widest disabled:opacity-100"
                      >
                        {active ? "Aktywny" : owned ? "Wybierz" : "Kup"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : activeTab === "upgrades" ? (
            <div className="grid gap-2">
              {MINI_GAME_SHOP_UPGRADES.map((upgrade) => {
                const level = shop.upgrades[gameId]?.[upgrade.id] || 0;
                const nextCost = getNextMiniGameUpgradeCost(shop, gameId, upgrade.id);
                return (
                  <div key={upgrade.id} className="sl-stat-tile rounded-2xl p-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-black uppercase tracking-widest text-[var(--theme-text-strong)]">{upgrade.name}</p>
                        <p className="sl-muted mt-1 text-xs leading-relaxed">{upgrade.descriptionByGame[gameId]}</p>
                        <p className="sl-kicker mt-2 font-mono text-[10px] font-black uppercase tracking-widest">Lv.{level}/{upgrade.maxLevel}</p>
                        <p className="sl-muted mt-1 text-[10px] font-black uppercase tracking-widest">{formatMiniGameShopBonus(upgrade.bonus)}</p>
                      </div>
                      <button
                        type="button"
                        disabled={nextCost === null || playerGold < nextCost}
                        onClick={() => onBuyUpgrade(gameId, upgrade.id)}
                        className="sl-button-primary min-h-10 rounded-xl px-3 text-[10px] font-black uppercase tracking-widest disabled:opacity-100"
                      >
                        {nextCost === null ? "Max" : `${nextCost}G`}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : activeTab === "boosters" ? (
            <div className="grid gap-2">
              <div className="sl-input rounded-2xl px-3 py-2 text-xs leading-relaxed text-[var(--theme-text)]">
                Boostery są jednorazowe. Aktywny booster zużywa się dopiero po starcie rundy.
              </div>
              {MINI_GAME_SHOP_BOOSTERS.map((booster) => {
                const count = shop.boosters[gameId]?.[booster.id] || 0;
                const active = shop.activeBoosterByGame[gameId] === booster.id;
                const affordable = playerGold >= booster.cost;
                return (
                  <div key={booster.id} className="sl-stat-tile rounded-2xl p-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-black uppercase tracking-widest text-[var(--theme-text-strong)]">{booster.name}</p>
                        <p className="sl-muted mt-1 text-xs leading-relaxed">{booster.description}</p>
                        <p className="sl-kicker mt-2 font-mono text-[10px] font-black uppercase tracking-widest">Masz: {count} · {formatMiniGameShopBonus(booster.bonus)}</p>
                      </div>
                      <div className="grid shrink-0 gap-2">
                        <button
                          type="button"
                          disabled={!affordable}
                          onClick={() => onBuyBooster(gameId, booster.id)}
                          className="sl-button-secondary min-h-9 rounded-xl px-3 text-[10px] font-black uppercase tracking-widest disabled:opacity-100"
                        >
                          {booster.cost}G
                        </button>
                        <button
                          type="button"
                          disabled={count <= 0}
                          onClick={() => onActivateBooster(gameId, booster.id)}
                          className="sl-button-primary min-h-9 rounded-xl px-3 text-[10px] font-black uppercase tracking-widest disabled:opacity-100"
                        >
                          {active ? "Aktywny" : "Użyj"}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="grid gap-2">
              <input
                ref={importInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(event) => {
                  void handleImportBackground(event.target.files?.[0]);
                  event.currentTarget.value = "";
                }}
              />
              <button
                type="button"
                onClick={() => importInputRef.current?.click()}
                className="sl-button-secondary min-h-11 rounded-2xl px-3 text-xs font-black uppercase tracking-widest active:scale-[0.98]"
              >
                Dodaj z galerii
              </button>
              <div className="grid grid-cols-2 gap-2">
                {backgroundOptions.map((background) => {
                  const owned = isMiniGameBackgroundOwned(backgrounds, background.id);
                  const active = activeBackground === background.id;
                  const affordable = playerGold >= background.cost;
                  return (
                    <div key={background.id} className="sl-stat-tile overflow-hidden rounded-2xl">
                      <div className="relative h-24 bg-[var(--theme-input)]">
                        <img src={background.asset} alt="" className="h-full w-full object-cover opacity-80" />
                        <div className="absolute inset-0 bg-gradient-to-t from-[color-mix(in_srgb,var(--theme-bg)_74%,transparent)] via-transparent to-transparent" />
                        <span className="absolute bottom-2 left-2 rounded-lg bg-[var(--theme-input)] px-2 py-1 font-mono text-[9px] font-black uppercase tracking-widest text-[var(--theme-accent-text)]">
                          {background.source === "gallery" ? "Galeria" : `${background.cost}G`}
                        </span>
                      </div>
                      <div className="p-3">
                        <p className="truncate text-xs font-black uppercase tracking-widest text-[var(--theme-text-strong)]">{background.name}</p>
                        <button
                          type="button"
                          disabled={!owned && !affordable}
                          onClick={() => owned ? onSelectBackground(gameId, background.id) : onBuyBackground(gameId, background.id)}
                          className="sl-button-primary mt-3 min-h-10 w-full rounded-xl px-3 text-[10px] font-black uppercase tracking-widest disabled:opacity-100"
                        >
                          {active ? "Aktywne" : owned ? "Ustaw" : "Kup"}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

function MiniGameFrame({
  definition,
  score,
  combo,
  remaining,
  scorePopup,
  finished,
  showHud,
  stageBackground,
  stageEffect,
  showGrid,
  graphicsQuality,
  compact = false,
  children,
}: {
  definition: MiniGameDefinition;
  score: number;
  combo: number;
  remaining: number;
  scorePopup: ScorePopupState;
  finished: boolean;
  showHud: boolean;
  stageBackground: MiniGameBackgroundDefinition;
  stageEffect: MiniGameShopEffectDefinition;
  showGrid: boolean;
  graphicsQuality: PlayerState["settings"]["graphicsQuality"];
  compact?: boolean;
  children: ReactNode;
}) {
  return (
    <div
      className="relative h-full min-h-0 w-full overflow-hidden bg-[var(--theme-game-bg)]"
      aria-label={definition.title}
      data-game-stage={definition.id}
      data-graphics-quality={graphicsQuality}
    >
      <img
        src={stageBackground.asset}
        alt=""
        className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-50"
        style={{ filter: graphicsQuality === "cinematic" ? "saturate(1.08) contrast(1.04)" : "none" }}
      />
      <div
        className="pointer-events-none absolute inset-0"
        style={{ background: `color-mix(in srgb, var(--theme-bg) ${Math.round(stageBackground.overlayStrength * 100)}%, transparent)` }}
      />
      <MiniGameStageEffectLayer effect={stageEffect} graphicsQuality={graphicsQuality} />
      {showGrid && <PlayfieldGrid />}
      {!finished && showHud && <GameHud score={score} combo={combo} remaining={remaining} scorePopup={scorePopup} compact={compact} />}
      <div className={`relative z-10 h-full min-h-0 ${finished ? "bg-[var(--theme-accent-soft)]" : ""}`}>
        {children}
      </div>
    </div>
  );
}

function MiniGameStageEffectLayer({
  effect,
  graphicsQuality,
}: {
  effect: MiniGameShopEffectDefinition;
  graphicsQuality: PlayerState["settings"]["graphicsQuality"];
}) {
  if (graphicsQuality === "performance") {
    return (
      <div
        className="pointer-events-none absolute inset-0 opacity-20"
        style={{ background: "radial-gradient(circle at 50% 42%, color-mix(in srgb, var(--theme-accent) 12%, transparent), transparent 48%)" }}
      />
    );
  }

  if (effect.id === "system-aura") {
    return <div className="pointer-events-none absolute inset-0 opacity-30" style={{ background: "radial-gradient(circle at 50% 35%, rgba(103,232,249,0.14), transparent 48%)" }} />;
  }

  if (effect.id === "monarch-runes") {
    const runeCount = graphicsQuality === "cinematic" ? 10 : 5;
    return (
      <div className="pointer-events-none absolute inset-0 overflow-hidden opacity-28">
        <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent,rgba(167,139,250,0.08),transparent)]" />
        {Array.from({ length: runeCount }, (_, index) => (
          <motion.span
            key={`rune_${index}`}
            className="absolute top-[-20%] font-mono text-[10px] font-black tracking-[0.24em] text-violet-200/70"
            style={{ left: `${10 + index * (80 / Math.max(1, runeCount - 1))}%` }}
            animate={{ y: ["0dvh", "132dvh"] }}
            transition={{ duration: 7.4 + (index % 3) * 0.8, repeat: Infinity, delay: index * 0.42, ease: "linear" }}
          >
            {"ARISE".slice(0, 2 + (index % 4))}
          </motion.span>
        ))}
      </div>
    );
  }

  if (effect.id === "blood-sparks") {
    return <div className="pointer-events-none absolute inset-0 opacity-45" style={{ background: "radial-gradient(circle at 18% 82%, rgba(251,113,133,0.22), transparent 28%), radial-gradient(circle at 82% 24%, rgba(127,29,29,0.2), transparent 34%)" }} />;
  }

  if (effect.id === "gold-trace") {
    return (
      <div className="pointer-events-none absolute inset-0 overflow-hidden opacity-28">
        <motion.div
          className="absolute -inset-x-20 top-1/3 h-12 rotate-[-12deg] bg-gradient-to-r from-transparent via-amber-200/24 to-transparent"
          animate={{ x: ["-35%", "35%"] }}
          transition={{ duration: graphicsQuality === "cinematic" ? 5.6 : 7.2, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>
    );
  }

  return <div className="pointer-events-none absolute inset-0 opacity-28" style={{ background: "radial-gradient(circle at 50% 50%, rgba(56,189,248,0.12), transparent 36%), radial-gradient(circle at 50% 50%, rgba(2,6,23,0.28), transparent 72%)" }} />;
}

const GameHud = memo(function GameHud({
  score,
  combo,
  remaining,
  scorePopup,
  compact,
}: {
  score: number;
  combo: number;
  remaining: number;
  scorePopup: ScorePopupState;
  compact: boolean;
}) {
  return (
    <div
      className={`pointer-events-none absolute z-30 flex items-center gap-1.5 font-mono uppercase tracking-widest text-[var(--theme-game-hud-text)] ${
        compact ? "text-[10px]" : "text-xs"
      }`}
      style={{
        left: "max(10px, env(safe-area-inset-left))",
        top: "max(10px, env(safe-area-inset-top))",
        maxWidth: "calc(100vw - 190px)",
      }}
    >
      <span className="shrink-0 rounded-xl border border-[var(--theme-border)] bg-[var(--theme-game-hud)] px-2.5 py-1 text-left shadow-[0_0_18px_var(--theme-shadow)]">
        ⏳ {remaining}s
      </span>
      <span className="relative shrink-0 rounded-xl border border-[var(--theme-border)] bg-[var(--theme-game-hud)] px-2.5 py-1 text-center text-[var(--theme-accent-text)] shadow-[0_0_18px_var(--theme-shadow)]">
        🏆 {score}
        <ScorePopup popup={scorePopup} />
      </span>
      {combo > 1 && (
        <span className="shrink-0 rounded-xl border border-amber-400/50 bg-amber-950/80 px-2 py-1 text-right font-black text-amber-300 shadow-[0_0_18px_rgba(250,204,21,0.45)] animate-pulse">
          🔥 x{combo}
        </span>
      )}
    </div>
  );
});

const ShadowSliceToken = memo(function ShadowSliceToken({
  object,
  graphicsQuality,
}: {
  object: ShadowSliceObject;
  graphicsQuality: PlayerState["settings"]["graphicsQuality"];
  playfieldSize?: PlayfieldSize | null;
  key?: string;
}) {
  const classes = {
    true: "border-violet-300/80 bg-violet-600/25 shadow-[0_0_28px_rgba(168,85,247,0.7)]",
    decoy: "border-sky-300/60 bg-sky-500/15 shadow-[0_0_20px_rgba(56,189,248,0.45)]",
    trap: "border-red-400/90 bg-red-600/30 shadow-[0_0_30px_rgba(239,68,68,0.8)]",
    gold: "border-amber-300/90 bg-amber-400/30 shadow-[0_0_28px_rgba(250,204,21,0.75)]",
    heart: "border-rose-300/90 bg-rose-500/25 shadow-[0_0_28px_rgba(244,63,94,0.75)]",
    time: "border-cyan-300/90 bg-cyan-400/25 shadow-[0_0_28px_rgba(6,182,212,0.8)]",
  } satisfies Record<ShadowSliceKind, string>;

  const asset = object.kind === "true"
    ? MOBILE_THEME_ASSETS.miniGames.shadowTrue
    : object.kind === "decoy"
      ? MOBILE_THEME_ASSETS.miniGames.shadowDecoy
      : null;

  const shouldGlow = graphicsQuality === "cinematic" || object.kind === "true" || object.kind === "heart" || object.kind === "time" || object.kind === "trap";

  return (
    <div
      className={`sl-slice-target pointer-events-none absolute grid -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border will-change-transform ${classes[object.kind]}`}
      style={{
        left: `${object.x}%`,
        top: `${object.y}%`,
        width: object.sizePx,
        height: object.sizePx,
        transform: `translate3d(-50%, -50%, 0) rotate(${object.rotation}deg)`,
      }}
    >
      {shouldGlow && (
        <span className="sl-slice-glow pointer-events-none absolute inset-[-20%] rounded-full animate-pulse" />
      )}
      {asset ? (
        <img
          src={asset}
          alt=""
          className="h-[148%] w-[148%] object-contain drop-shadow-[0_0_18px_rgba(168,85,247,0.75)] select-none pointer-events-none"
        />
      ) : object.kind === "gold" ? (
        <div className="relative grid h-[70%] w-[70%] place-items-center rounded-full bg-amber-300/20">
          <div className="absolute h-[48%] w-[76%] -rotate-6 rounded-md border border-amber-100/90 bg-gradient-to-br from-yellow-200 via-amber-400 to-yellow-700 shadow-[0_0_18px_rgba(250,204,21,0.8)]" />
          <Coins className="relative h-6 w-6 text-yellow-100 drop-shadow-[0_0_10px_rgba(250,204,21,0.95)]" />
        </div>
      ) : object.kind === "trap" ? (
        <div className="relative grid h-[74%] w-[74%] place-items-center rounded-full border-2 border-red-200/90 bg-red-600/30 shadow-[0_0_24px_rgba(248,113,113,0.9)] animate-pulse">
          <Bomb className="h-6 w-6 text-red-100 drop-shadow-[0_0_12px_rgba(248,113,113,1)]" />
        </div>
      ) : object.kind === "heart" ? (
        <div className="relative grid h-[72%] w-[72%] place-items-center rounded-full border border-rose-100/90 bg-rose-500/25 shadow-[0_0_24px_rgba(251,113,133,0.9)]">
          <HeartPulse className="h-6 w-6 text-rose-100 drop-shadow-[0_0_12px_rgba(251,113,133,1)]" />
        </div>
      ) : object.kind === "time" ? (
        <div className="relative grid h-[74%] w-[74%] place-items-center rounded-full border border-cyan-100/95 bg-cyan-400/25 shadow-[0_0_28px_rgba(103,232,249,0.9)]">
          <span className="absolute inset-[-20%] rounded-full border border-cyan-200/40 shadow-[0_0_24px_rgba(103,232,249,0.5)]" />
          <Clock3 className="h-6 w-6 text-cyan-50 drop-shadow-[0_0_12px_rgba(103,232,249,1)]" />
        </div>
      ) : (
        <div className="h-1/2 w-1/2 rounded-full bg-sky-100" />
      )}
      {object.kind === "true" && <Sparkles className="absolute right-0.5 top-0.5 h-4 w-4 text-violet-200" />}
      {object.kind === "heart" && <Sparkles className="absolute right-0.5 top-0.5 h-4 w-4 text-rose-200" />}
      {object.kind === "time" && <Sparkles className="absolute right-0.5 top-0.5 h-4 w-4 text-cyan-200" />}
    </div>
  );
});

const SliceImpactLayer = memo(function SliceImpactLayer({
  effects,
  graphicsQuality,
}: {
  effects: SliceImpactEffect[];
  graphicsQuality: PlayerState["settings"]["graphicsQuality"];
}) {
  return (
    <div className="pointer-events-none absolute inset-0 z-40 overflow-visible">
      <AnimatePresence>
        {effects.map((effect) => (
          <SliceImpactBurst key={effect.id} effect={effect} graphicsQuality={graphicsQuality} />
        ))}
      </AnimatePresence>
    </div>
  );
});

const SliceImpactBurst = memo(function SliceImpactBurst({
  effect,
  graphicsQuality,
}: {
  key?: string;
  effect: SliceImpactEffect;
  graphicsQuality: PlayerState["settings"]["graphicsQuality"];
}) {
  const asset = getSliceImpactAsset(effect.kind);
  const particleCount = graphicsQuality === "cinematic"
    ? effect.kind === "trap" ? 14 : effect.kind === "time" ? 12 : effect.kind === "heart" ? 10 : 8
    : effect.kind === "trap" ? 8 : effect.kind === "time" ? 7 : effect.kind === "heart" ? 6 : 5;

  const particles = useMemo(
    () => Array.from({ length: particleCount }, (_, index) => {
      const angle = (Math.PI * 2 * index) / particleCount + (effect.rotation * Math.PI) / 180;
      const distance = effect.sizePx * (0.45 + (index % 4) * 0.18);
      return {
        id: `${effect.id}_spark_${index}`,
        x: Math.cos(angle) * distance,
        y: Math.sin(angle) * distance,
        size: 3.5 + (index % 3) * 1.8,
      };
    }),
    [effect.id, effect.rotation, effect.sizePx, particleCount]
  );

  return (
    <motion.div
      className="sl-slice-impact-burst absolute pointer-events-none overflow-visible"
      style={{
        left: `${effect.x}%`,
        top: `${effect.y}%`,
        width: effect.sizePx,
        height: effect.sizePx,
        color: effect.color,
        transform: "translate3d(-50%, -50%, 0)",
      }}
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Central Slash Line */}
      <motion.div
        className="absolute left-1/2 top-1/2 h-[6px] w-[240%] origin-center -translate-x-1/2 -translate-y-1/2 rounded-full bg-white shadow-[0_0_20px_currentColor] overflow-visible pointer-events-none"
        style={{ transform: `translate(-50%, -50%) rotate(${effect.rotation}deg)` }}
        initial={{ scaleX: 0.1, opacity: 1 }}
        animate={{ scaleX: 1.2, opacity: 0 }}
        transition={{ duration: 0.28, ease: "easeOut" }}
      />

      {/* Expanding shockwave */}
      <motion.div
        className="absolute inset-[-25%] rounded-full border-2 border-current overflow-visible pointer-events-none"
        initial={{ scale: 0.3, opacity: 0.95 }}
        animate={{ scale: 2.2, opacity: 0 }}
        transition={{ duration: 0.45, ease: "easeOut" }}
      />

      {/* Sliced two halves flying outward */}
      <SlicedHalf asset={asset} effect={effect} side="left" />
      <SlicedHalf asset={asset} effect={effect} side="right" />

      {/* Particle sparks */}
      {particles.map((particle) => (
        <motion.span
          key={particle.id}
          className="absolute left-1/2 top-1/2 rounded-full bg-current shadow-[0_0_12px_currentColor] pointer-events-none"
          style={{ width: particle.size, height: particle.size }}
          initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
          animate={{ x: particle.x, y: particle.y, opacity: 0, scale: 0.2 }}
          transition={{ duration: 0.55, ease: "easeOut" }}
        />
      ))}

      {/* Label popup */}
      <motion.span
        className="absolute left-1/2 top-0 -translate-x-1/2 whitespace-nowrap rounded-full border-2 border-current/60 bg-black/90 px-3 py-1 font-mono text-[13px] font-black uppercase tracking-wider text-current pointer-events-none select-none shadow-[0_0_18px_currentColor]"
        style={{ zIndex: 60, textShadow: "0 0 10px currentColor, 0 0 20px currentColor" }}
        initial={{ opacity: 0, y: 6, scale: 0.7 }}
        animate={{ opacity: [0, 1, 1, 0.9, 0], y: [6, -18, -38, -56, -72], scale: [0.7, 1.2, 1.1, 1, 0.85] }}
        transition={{ duration: 0.9, times: [0, 0.12, 0.4, 0.75, 1], ease: "easeOut" }}
      >
        {effect.label}
      </motion.span>
    </motion.div>
  );
});

const SlicedHalf = memo(function SlicedHalf({
  asset,
  effect,
  side,
}: {
  asset: string | null;
  effect: SliceImpactEffect;
  side: "left" | "right";
}) {
  const direction = side === "left" ? -1 : 1;
  const perpAngle = ((effect.rotation + (side === "left" ? -90 : 90)) * Math.PI) / 180;
  const throwDist = effect.sizePx * 0.75;
  const targetX = Math.cos(perpAngle) * throwDist;
  const targetY = Math.sin(perpAngle) * throwDist + effect.sizePx * 0.35;

  const clipPath = side === "left"
    ? "polygon(0 0, 52% 0, 48% 100%, 0 100%)"
    : "polygon(52% 0, 100% 0, 100% 100%, 48% 100%)";

  return (
    <motion.div
      className="absolute inset-0 grid place-items-center will-change-transform pointer-events-none overflow-visible"
      initial={{ x: 0, y: 0, rotate: effect.rotation, opacity: 1, scale: 1 }}
      animate={{
        x: targetX,
        y: targetY,
        rotate: effect.rotation + direction * 45,
        opacity: 0,
        scale: 0.8,
      }}
      transition={{ duration: 0.62, ease: [0.12, 0.8, 0.32, 1] }}
      style={{ clipPath }}
    >
      {asset ? (
        <img
          src={asset}
          alt=""
          className="h-[148%] w-[148%] object-contain drop-shadow-[0_0_16px_currentColor] pointer-events-none select-none"
        />
      ) : (
        <div className="h-[68%] w-[68%] rounded-full bg-current shadow-[0_0_22px_currentColor]" />
      )}
    </motion.div>
  );
});

const ShadowExtractionChanceMeter = memo(function ShadowExtractionChanceMeter({ remaining, signalPercent }: { remaining: number; signalPercent: number }) {
  return (
    <div
      className="pointer-events-none absolute z-30 w-[min(17rem,42vw)] rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-game-hud)] px-3 py-2 font-mono text-[9px] font-black uppercase tracking-widest text-[var(--theme-game-hud-text)] shadow-[0_0_20px_var(--theme-shadow)]"
      style={{
        left: "max(10px, env(safe-area-inset-left))",
        bottom: "max(12px, env(safe-area-inset-bottom))",
      }}
    >
      <div className="mb-1 flex items-center justify-between gap-2">
        <span>Czas szczeliny</span>
        <span>{remaining}s</span>
      </div>
      <div className="sl-progress-track h-1.5 overflow-hidden rounded-full">
        <motion.div
          className="sl-progress-fill h-full rounded-full shadow-[0_0_14px_color-mix(in_srgb,var(--theme-accent)_55%,transparent)]"
          initial={false}
          animate={{ width: `${Math.max(0, Math.min(100, signalPercent))}%` }}
          transition={{ duration: 0.12 }}
        />
      </div>
    </div>
  );
});

const SliceTrail = memo(function SliceTrail({ points, effect }: { points: SliceTrailPoint[]; effect: ReturnType<typeof getShadowExtractionEffect> }) {
  if (points.length < 2) return null;
  const stroke = getTrailColor(effect.id);

  let pathD = `M ${points[0].x} ${points[0].y}`;
  for (let i = 1; i < points.length; i++) {
    pathD += ` L ${points[i].x} ${points[i].y}`;
  }

  const tip = points[points.length - 1];

  return (
    <svg
      className="pointer-events-none absolute inset-0 z-20 h-full w-full overflow-visible"
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
    >
      {/* Outer ambient blade glow */}
      <path
        d={pathD}
        fill="none"
        stroke={stroke}
        strokeWidth="9"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.38"
        vectorEffect="non-scaling-stroke"
      />
      {/* Main neon blade cut */}
      <path
        d={pathD}
        fill="none"
        stroke={stroke}
        strokeWidth="4.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.9"
        vectorEffect="non-scaling-stroke"
      />
      {/* Razor sharp white edge */}
      <path
        d={pathD}
        fill="none"
        stroke="#ffffff"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="1"
        vectorEffect="non-scaling-stroke"
      />
      {tip && (
        <circle cx={tip.x} cy={tip.y} r="1.8" fill="#ffffff" opacity="1" />
      )}
    </svg>
  );
});



function StartOverlay({
  finished,
  score,
  title,
  text,
  tips = [],
  relicBonuses,
  onStart,
  onExit,
  actions,
}: {
  finished: boolean;
  score: number;
  title: string;
  text: string;
  tips?: string[];
  relicBonuses?: MiniGameRelicBonusSummary;
  onStart: () => void;
  onExit?: () => void;
  actions?: ReactNode;
}) {
  const activeTip = useRotatingTip(tips.length ? tips : [text], 4200);
  const relicLabels = relicBonuses ? formatMiniGameRelicBonuses(relicBonuses) : [];

  return (
    <div
      className="sl-mini-ready-overlay absolute inset-0 z-20 flex flex-col items-center justify-center overflow-hidden bg-[var(--theme-overlay)] text-center"
      style={{
        paddingTop: "max(20px, env(safe-area-inset-top))",
        paddingRight: "max(20px, env(safe-area-inset-right))",
        paddingBottom: "max(20px, env(safe-area-inset-bottom))",
        paddingLeft: "max(20px, env(safe-area-inset-left))",
      }}
    >
      <div className={`${finished ? "p-4" : "p-5"} rounded-full border border-[var(--theme-border)] bg-[var(--theme-accent-soft)] shadow-[0_0_28px_color-mix(in_srgb,var(--theme-accent)_14%,transparent)]`}>
        <Gamepad2 className={`${finished ? "h-8 w-8" : "h-10 w-10"} text-[var(--theme-icon)]`} />
      </div>
      <h3 className={`${finished ? "mt-4 text-xl" : "mt-5 text-2xl"} max-w-[min(32rem,92vw)] font-black uppercase tracking-[0.08em] text-[var(--theme-text-strong)]`}>{title}</h3>
      <p className="mt-2 max-w-[min(34rem,88vw)] text-sm leading-relaxed text-[var(--theme-text)]">
        {finished ? `Ostatni wynik: ${score}. Nagroda została naliczona przez System.` : text}
      </p>
      {!finished && activeTip && (
        <motion.div
          key={activeTip}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="sl-input mt-5 max-w-[min(34rem,88vw)] rounded-2xl px-4 py-3 text-left shadow-[0_0_24px_color-mix(in_srgb,var(--theme-accent)_10%,transparent)]"
        >
          <p className="sl-kicker font-mono text-[10px] font-black uppercase tracking-[0.24em]">Protip</p>
          <p className="mt-2 text-sm leading-relaxed text-[var(--theme-text)]">{activeTip}</p>
        </motion.div>
      )}
      {!finished && relicLabels.length > 0 && (
        <div className="mt-3 flex max-w-[min(34rem,88vw)] flex-wrap justify-center gap-2">
          {relicLabels.map((label) => (
            <span key={label} className="sl-chip-active rounded-full px-3 py-1 font-mono text-[10px] font-black uppercase tracking-widest">
              Bonus: {label}
            </span>
          ))}
        </div>
      )}
      <button type="button" onClick={onStart} className="sl-button-primary mt-5 min-h-12 max-w-full rounded-2xl px-6 py-3 text-sm font-black uppercase tracking-widest active:scale-[0.98]">
        {finished ? "Zagraj jeszcze raz" : "Start"}
      </button>
      {!finished && actions && (
        <div className="mt-3 grid w-full max-w-[min(34rem,88vw)] grid-cols-1 gap-2 sm:grid-cols-2">
          {actions}
        </div>
      )}
      {finished && onExit && (
        <button
          type="button"
          onClick={onExit}
          className="sl-button-secondary mt-3 min-h-10 rounded-2xl px-5 py-2 text-xs font-black uppercase tracking-widest active:scale-[0.98]"
        >
          Wróć do gier
        </button>
      )}
    </div>
  );
}

function formatMiniGameRelicBonuses(bonuses: MiniGameRelicBonusSummary) {
  const labels: string[] = [];
  if (bonuses.scoreBonus > 0) labels.push(`+${Math.round(bonuses.scoreBonus * 100)}% score`);
  if (bonuses.targetLifetime > 0) labels.push(`+${Math.round(bonuses.targetLifetime)}ms cel`);
  if (bonuses.hitWindow > 0) labels.push(`+${Math.round(bonuses.hitWindow * 100)}% okno`);
  if (bonuses.timePenaltyResist > 0) labels.push(`-${Math.round(bonuses.timePenaltyResist * 100)}% kara`);
  return labels;
}

function combineMiniGameRuntimeBonuses(
  relicBonuses: MiniGameRelicBonusSummary,
  shopBonuses: MiniGameShopBonusSummary
): MiniGameRelicBonusSummary {
  return {
    scoreBonus: Math.min(0.15, relicBonuses.scoreBonus + shopBonuses.scoreBonus),
    targetLifetime: Math.min(520, relicBonuses.targetLifetime + shopBonuses.targetLifetime),
    hitWindow: Math.min(0.12, relicBonuses.hitWindow + shopBonuses.hitWindow),
    timePenaltyResist: Math.min(0.18, relicBonuses.timePenaltyResist + shopBonuses.timePenaltyResist),
  };
}

function formatMiniGameShopBonus(bonus: Partial<MiniGameShopBonusSummary>) {
  const labels: string[] = [];
  if (bonus.scoreBonus) labels.push(`+${Math.round(bonus.scoreBonus * 100)}% score`);
  if (bonus.targetLifetime) labels.push(`+${Math.round(bonus.targetLifetime)}ms cel`);
  if (bonus.hitWindow) labels.push(`+${Math.round(bonus.hitWindow * 100)}% okno`);
  if (bonus.timePenaltyResist) labels.push(`-${Math.round(bonus.timePenaltyResist * 100)}% kara`);
  if (bonus.xpMultiplier && bonus.xpMultiplier > 1) labels.push(`x${bonus.xpMultiplier.toFixed(2)} XP`);
  return labels.join(" · ") || "Bonus kosmetyczny";
}

function ScorePopup({ popup }: { popup: ScorePopupState }) {
  return (
    <AnimatePresence>
      {popup && (
        <motion.span
          key={popup.id}
          initial={{ opacity: 0, y: 4, scale: 0.82 }}
          animate={{ opacity: [0, 1, 1, 0], y: [4, 12, 20, 28], scale: [0.82, 1.08, 1, 0.95] }}
          transition={{ duration: 0.72, times: [0, 0.18, 0.7, 1], ease: "easeOut" }}
          className={`pointer-events-none absolute left-1/2 top-full -translate-x-1/2 whitespace-nowrap rounded-full border px-2 py-0.5 text-[10px] font-black shadow-lg ${
            popup.value >= 0
              ? "border-[color-mix(in_srgb,var(--theme-accent)_50%,transparent)] bg-[var(--theme-accent-soft)] text-[var(--theme-accent-text)] shadow-[0_8px_18px_color-mix(in_srgb,var(--theme-accent)_20%,transparent)]"
              : "border-[color-mix(in_srgb,var(--theme-danger)_50%,transparent)] bg-[var(--theme-danger-soft)] text-[var(--theme-danger-text)] shadow-[0_8px_18px_color-mix(in_srgb,var(--theme-danger)_20%,transparent)]"
          }`}
        >
          {popup.value > 0 ? `+${popup.value}` : popup.value} pkt
        </motion.span>
      )}
    </AnimatePresence>
  );
}

function Feedback({ text }: { text: string | null }) {
  if (!text) return null;
  const isPositive = text.startsWith("+") || text.includes("udana") || text.includes("Trafienie") || text.includes("Perfekcyjne") || text.includes("otwarta") || text.includes("zamknięta")
    || text.includes("Ekstrakcja") || text.includes("Serce") || text.includes("Bańka") || text.includes("Złot") || text.includes("COMBO") || text.includes("cięcie") || text.includes("⚔️") || text.includes("✨") || text.includes("❤️") || text.includes("⏱️") || text.includes("🪙");
  return (
    <div className={`pointer-events-none absolute bottom-[max(18px,env(safe-area-inset-bottom))] left-1/2 z-40 -translate-x-1/2 rounded-full border px-3 py-1 text-xs font-black uppercase tracking-widest ${
      isPositive
        ? "border-[color-mix(in_srgb,var(--theme-accent)_45%,transparent)] bg-[var(--theme-accent-soft)] text-[var(--theme-accent-text)]"
        : "border-[color-mix(in_srgb,var(--theme-danger)_45%,transparent)] bg-[var(--theme-danger-soft)] text-[var(--theme-danger-text)]"
    }`}>
      {text}
    </div>
  );
}

function PlayfieldGrid() {
  return <div className="absolute inset-0 bg-[linear-gradient(rgba(56,189,248,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(56,189,248,0.04)_1px,transparent_1px)] bg-[size:30px_30px]" />;
}

function useFeedback() {
  const [feedback, setFeedback] = useState<string | null>(null);
  const timerRef = useRef<number | null>(null);
  const flushRef = useRef<number | null>(null);
  const pendingRef = useRef<string | null>(null);
  const lastShownAtRef = useRef(0);

  const applyFeedback = useCallback((message: string) => {
    lastShownAtRef.current = performance.now();
    setFeedback(message);
    if (timerRef.current) window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => setFeedback(null), 620);
  }, []);

  const showFeedback = useCallback((message: string) => {
    const now = performance.now();
    const waitMs = 180 - (now - lastShownAtRef.current);
    if (waitMs <= 0) {
      pendingRef.current = null;
      if (flushRef.current) {
        window.clearTimeout(flushRef.current);
        flushRef.current = null;
      }
      applyFeedback(message);
      return;
    }
    pendingRef.current = message;
    if (flushRef.current) return;
    flushRef.current = window.setTimeout(() => {
      flushRef.current = null;
      const pending = pendingRef.current;
      pendingRef.current = null;
      if (pending) applyFeedback(pending);
    }, waitMs);
  }, [applyFeedback]);

  useEffect(() => () => {
    if (timerRef.current) window.clearTimeout(timerRef.current);
    if (flushRef.current) window.clearTimeout(flushRef.current);
  }, []);

  return { feedback, showFeedback };
}

function useScorePopup() {
  const [scorePopup, setScorePopup] = useState<ScorePopupState>(null);
  const idRef = useRef(0);
  const pendingValueRef = useRef(0);
  const flushRef = useRef<number | null>(null);
  const clearRef = useRef<number | null>(null);
  const lastShownAtRef = useRef(0);

  const emitScorePopup = useCallback((value: number) => {
    idRef.current += 1;
    const id = idRef.current;
    lastShownAtRef.current = performance.now();
    setScorePopup({ id, value });
    if (clearRef.current) window.clearTimeout(clearRef.current);
    clearRef.current = window.setTimeout(() => {
      setScorePopup((current) => (current?.id === id ? null : current));
      clearRef.current = null;
    }, 760);
  }, []);

  const showScorePopup = useCallback((value: number) => {
    const now = performance.now();
    if (now - lastShownAtRef.current >= 130 && pendingValueRef.current === 0) {
      emitScorePopup(value);
      return;
    }
    pendingValueRef.current += value;
    if (flushRef.current) return;
    flushRef.current = window.setTimeout(() => {
      flushRef.current = null;
      const nextValue = pendingValueRef.current;
      pendingValueRef.current = 0;
      if (nextValue !== 0) emitScorePopup(nextValue);
    }, 110);
  }, [emitScorePopup]);

  useEffect(() => () => {
    if (flushRef.current) window.clearTimeout(flushRef.current);
    if (clearRef.current) window.clearTimeout(clearRef.current);
  }, []);

  return { scorePopup, showScorePopup };
}

function getMiniGameIcon(id: MiniGameId) {
  const className = "h-5 w-5";
  switch (id) {
    case "mana-memory":
      return <Brain className={className} />;
    case "shadow-strike":
      return <Swords className={className} />;
    case "rune-lock":
      return <KeyRound className={className} />;
    case "shadow-extraction":
      return <Crosshair className={className} />;
    case "gate-dodge":
    default:
      return <Target className={className} />;
  }
}

function addGameTime(deadline: number, now: number, bonusMs: number) {
  return Math.min(deadline + bonusMs, now + MAX_REMAINING_TIME_MS);
}

function getReactionReward(now: number, roundStartedAt: number, roundEndsAt: number, combo: number) {
  const duration = Math.max(1, roundEndsAt - roundStartedAt);
  const elapsed = Math.min(duration, Math.max(0, now - roundStartedAt));
  const quickness = Math.max(0, Math.min(1, 1 - elapsed / duration));
  const comboBoost = Math.min(520, combo * 42);
  const timeMs =
    quickness >= 0.72
      ? 1250 + Math.round(quickness * 520) + comboBoost
      : quickness >= 0.45
        ? 650 + Math.round(quickness * 360) + Math.round(comboBoost * 0.45)
        : 250 + Math.round(quickness * 220);

  return {
    points: Math.round(4 + quickness * 18 + Math.min(12, combo)),
    timeMs,
  };
}

function formatBonusSeconds(timeMs: number) {
  return `${(timeMs / 1000).toFixed(1)}s`;
}

function randomRuneSequence(length: number) {
  return Array.from({ length }, () => RUNES[Math.floor(Math.random() * RUNES.length)]);
}

type GatePoint = SpawnCircle & {
  id: string;
  sizePx: number;
};

type ShadowSliceKind = "true" | "decoy" | "trap" | "gold" | "heart" | "time";

type ShadowSliceObject = {
  id: string;
  kind: ShadowSliceKind;
  spawnedAt: number;
  expiresAt: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  gravity: number;
  sizePx: number;
  radiusPct: number;
  rotation: number;
  spin: number;
};

type SliceTrailPoint = SegmentPoint & {
  time: number;
};

type SliceImpactEffect = {
  id: string;
  kind: ShadowSliceKind;
  x: number;
  y: number;
  sizePx: number;
  rotation: number;
  color: string;
  label: string;
};

function getShadowSliceHitRadius(object: ShadowSliceObject, orientationMode: MiniGameOrientationMode) {
  const visualRadiusMultiplier = object.kind === "true" || object.kind === "decoy" || object.kind === "heart" || object.kind === "time" ? 0.7 : 0.55;
  const portraitAssist = orientationMode === "portrait" ? 5 : 0;
  return object.sizePx * visualRadiusMultiplier + portraitAssist;
}

function randomGateTarget(difficulty = 0): GatePoint {
  const radius = Math.max(5.8, 9 - difficulty * 0.36);
  const point = randomPointAwayFrom({
    existing: [],
    bounds: PLAYFIELD_BOUNDS,
    radius,
    minGap: 3,
  }) ?? { x: 50, y: 50, radius };

  return {
    ...point,
    id: `target_${Math.round(point.x)}_${Math.round(point.y)}`,
    sizePx: Math.round(radius * 8.8),
  };
}

function randomHazards(count: number, target?: GatePoint, difficulty = 0) {
  const existing: SpawnCircle[] = target ? [{ x: target.x, y: target.y, radius: target.radius }] : [];
  const baseRadius = Math.max(4.6, 7.2 - difficulty * 0.18);
  const points = spawnNonOverlappingObjects({
    count,
    existing,
    bounds: PLAYFIELD_BOUNDS,
    radius: (index) => Math.max(4.2, baseRadius - index * 0.08),
    minGap: Math.max(1.7, 3.8 - difficulty * 0.16),
    attemptsPerObject: 40,
  });

  return points.map((point, index) => ({
    ...point,
    id: `hazard_${index}_${Math.round(point.x)}_${Math.round(point.y)}`,
    sizePx: Math.round(point.radius * 7.6),
  }));
}

function createShadowSliceObject({
  difficulty,
  score,
  level,
  playerHp,
  upgrades,
  relicBonuses,
  orientationMode,
  now,
  wallNow,
  spawnX,
}: {
  difficulty: number;
  score: number;
  level: number;
  playerHp: number;
  upgrades: ShadowExtractionUpgrades;
  relicBonuses: MiniGameRelicBonusSummary;
  orientationMode: MiniGameOrientationMode;
  now: number;
  wallNow: number;
  spawnX?: number;
}): ShadowSliceObject {
  const roll = Math.random();
  const heartChance = playerHp <= 0 ? SHADOW_LAST_CHANCE_HEART_CHANCE : SHADOW_HEART_CHANCE;
  const kind: ShadowSliceKind =
    roll > 1 - SHADOW_TIME_BUBBLE_CHANCE
      ? "time"
      : roll > 1 - SHADOW_TIME_BUBBLE_CHANCE - heartChance
      ? "heart"
      : roll > 0.92
        ? "gold"
        : roll > Math.max(0.64, 0.84 - difficulty * 0.015)
          ? "trap"
          : roll > 0.54
            ? "decoy"
            : "true";

  const focusBonus = kind === "true" || kind === "heart" || kind === "time" ? upgrades.upgrades.focus * 4.5 : 0;
  const baseSize = kind === "trap" ? 56 : kind === "heart" ? 52 : kind === "time" ? 54 : kind === "gold" ? 48 : kind === "decoy" ? 50 : 62;
  const sizePx = Math.max(36, baseSize + focusBonus - difficulty * 0.9);
  const radiusPct = Math.max(4.8, sizePx / 8.0);
  const lifetimeMs = getExtractionSignalWindowMs(score, level) + upgrades.upgrades.focus * 280 + relicBonuses.targetLifetime + Math.round(relicBonuses.hitWindow * 1000) + 3600;

  const isLandscape = orientationMode === "landscape";
  const minX = isLandscape ? 15 : 18;
  const maxX = isLandscape ? 85 : 82;
  const x = spawnX !== undefined ? Math.max(minX, Math.min(maxX, spawnX)) : minX + Math.random() * (maxX - minX);
  // Spawn completely below the visible bottom bezel
  const y = 112 + Math.random() * 6;

  // Fruit Ninja varied launch powers (z różną siłą)
  const powerRoll = Math.random();
  const arcPower = powerRoll < 0.35
    ? 0.84 + Math.random() * 0.08  // Low arc
    : powerRoll < 0.80
      ? 0.98 + Math.random() * 0.1   // Medium arc
      : 1.15 + Math.random() * 0.14; // High soaring arc

  const baseVy = isLandscape
    ? -(68 + difficulty * 0.5) * arcPower
    : -(84 + difficulty * 0.6) * arcPower;

  let vx = 0;
  if (x < 42) {
    vx = +(isLandscape ? 11 + Math.random() * 15 : 7 + Math.random() * 11);
  } else if (x > 58) {
    vx = -(isLandscape ? 11 + Math.random() * 15 : 7 + Math.random() * 11);
  } else {
    vx = isLandscape ? -9 + Math.random() * 18 : -6 + Math.random() * 12;
  }

  const gravity = isLandscape ? 42 + difficulty * 0.4 : 50 + difficulty * 0.45;

  return {
    id: `shadow_${kind}_${Math.round(now)}_${Math.random().toString(36).slice(2, 6)}`,
    kind,
    spawnedAt: wallNow,
    expiresAt: wallNow + lifetimeMs,
    x,
    y,
    vx,
    vy: baseVy,
    gravity,
    sizePx,
    radiusPct,
    rotation: Math.random() * 360,
    spin: -150 + Math.random() * 300,
  };
}



function pointToPixels(point: SegmentPoint, rect: DOMRect): SegmentPoint {
  return {
    x: (point.x / 100) * rect.width,
    y: (point.y / 100) * rect.height,
  };
}

function getTrailColor(effectId: ShadowExtractionEffectId) {
  switch (effectId) {
    case "violet-rune":
      return "#c084fc";
    case "blood-red":
      return "#fb7185";
    case "monarch-gold":
      return "#facc15";
    case "system-blue":
    default:
      return "#67e8f9";
  }
}

function mapMiniGameEffectToShadowExtractionEffect(effectId: MiniGameShopEffectId): ShadowExtractionEffectId {
  switch (effectId) {
    case "blood-sparks":
      return "blood-red";
    case "gold-trace":
      return "monarch-gold";
    case "monarch-runes":
    case "void-pulse":
      return "violet-rune";
    case "system-aura":
    default:
      return "system-blue";
  }
}

function getSliceImpactColor(kind: ShadowSliceKind, effectId: ShadowExtractionEffectId) {
  if (kind === "trap") return "#fb7185";
  if (kind === "gold") return "#facc15";
  if (kind === "heart") return "#fb7185";
  if (kind === "time") return "#67e8f9";
  if (kind === "decoy") return "#38bdf8";
  return getTrailColor(effectId);
}

function getSliceImpactAsset(kind: ShadowSliceKind) {
  if (kind === "true") return MOBILE_THEME_ASSETS.miniGames.shadowTrue;
  if (kind === "decoy") return MOBILE_THEME_ASSETS.miniGames.shadowDecoy;
  return null;
}
