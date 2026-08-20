import React, { Suspense, useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { toast } from "sonner";
import {
  Activity,
  AlertTriangle,
  Battery,
  BellRing,
  BookOpen,
  Bluetooth,
  CheckCircle2,
  ChevronDown,
  Clock3,
  CircleDot,
  Crown,
  Disc3,
  Dumbbell,
  ExternalLink,
  Footprints,
  Gamepad2,
  Gem,
  Github,
  Hand,
  Headphones,
  HeartPulse,
  Home,
  Music2,
  Minus,
  Pause,
  Play,
  Plus,
  RotateCcw,
  Search,
  Settings,
  Shield,
  ShoppingBag,
  Shuffle,
  SkipBack,
  SkipForward,
  Smartphone,
  Sparkles,
  Sword,
  Target,
  Type,
  Trophy,
  Volume2,
  VolumeX,
  Wallpaper,
  Watch,
  X,
  Zap,
} from "lucide-react";
import { RewardAnimationLayer } from "../components/RewardAnimationLayer";
import { WorkoutStartCountdown } from "../components/WorkoutStartCountdown";
import { SystemUpdateModal } from "../components/SystemUpdateModal";
import { WhatsNewModal } from "../components/WhatsNewModal";

import {
  checkForUpdate,
  CURRENT_APP_VERSION,
  getSavedUpdateSource,
  saveUpdateSource,
  extractGitHubRepo,
  type AppUpdateInfo,
} from "../services/updateService";
import { usePlayer } from "../context/PlayerContext";


import { EXERCISE_CATALOG, type ExerciseCatalogEntry } from "../data/exerciseCatalog";
import { createDefaultMiniGameProgress, type MiniGameId } from "../game/miniGameProgress";
import { MINI_GAME_CATALOG } from "../game/miniGameCatalog";
import { formatResetCountdown, getMsUntilNextLocalDay } from "../game/dailyQuestUi";
import {
  completeDailyQuestProgress,
  createDailyQuestItemFromCatalog,
  deriveDailyQuestItemFields,
  findDailyQuestItemByTrackable,
  getDailyQuestItemProgress,
  getDailyQuestProgress,
  getEnabledDailyQuestItems,
  getIncompleteDailyQuestItems,
  resetDailyQuestProgress,
  updateDailyQuestItems,
} from "../game/dailyQuest";
import { searchExercises } from "../game/exerciseSearch";
import {
  createWearableSampleFromHealthSummary,
  getWearableDailyAnalysis,
} from "../game/wearableAnalysis";
import { getLocalDateKey } from "../game/playerMath";
import {
  EQUIPMENT_SLOT_DEFINITIONS,
  canEquipItemInSlot,
  equipItem as equipPlayerItem,
  getCompatibleSlots,
  getEquippedItems,
  getItemSellPrice,
  normalizeEquipmentType,
  unequipSlot,
} from "../game/equipment";
import {
  EQUIPMENT_RARITY_CLASSES,
  EQUIPMENT_RARITY_LABELS,
  getEquipmentPerkLabel,
  getEquipmentSlotLabel,
  getEquipmentTypeLabel,
  getItemModelSrc,
} from "../game/equipmentPresentation";
import {
  MINI_GAME_BACKGROUNDS,
  canBuyMiniGameBackground,
  createGalleryMiniGameBackground,
  getAvailableBackgroundsForGame,
  getSelectedBackgroundForGame,
  isMiniGameBackgroundOwned,
  normalizeMiniGameBackgrounds,
  type MiniGameBackgroundDefinition,
} from "../game/miniGameBackgrounds";
import { normalizeMiniGameGridSettings } from "../game/miniGameGrid";
import { getActivePenalty } from "../game/penalties";
import { addCatalogExerciseToPlan } from "../game/workoutPlan";
import {
  pauseWorkoutSession,
  resumeWorkoutSession,
  savePartialWorkoutSessionWithoutReward,
} from "../game/workoutSession";
import {
  applyThemeEffectToDocument,
  applyThemeToDocument,
  canBuyTheme,
  canBuyThemeEffect,
  canBuyThemeWallpaper,
  getThemeDefinition,
  getThemeEffectDefinition,
  getThemeWallpaperDefinition,
  THEME_DEFINITIONS,
  THEME_EFFECT_DEFINITIONS,
  THEME_WALLPAPER_DEFINITIONS,
  type ThemeEffectId,
} from "../game/themeShop";
import type { TrackableExerciseId } from "../sensors/motionTracking";
import { formatTrackedValue, MOTION_TRACKER_PROFILES } from "../sensors/motionTracking";
import {
  getHealthConnectQuestDistanceKm,
  getHealthConnectStatus,
  getLastHealthConnectImport,
  openHealthConnectSettings,
  readTodayHealthSummary,
  requestHealthConnectPermissions,
  saveLastHealthConnectImport,
  type HealthConnectStatus,
  type HealthConnectSummary,
} from "../services/healthConnectService";
import { MOBILE_THEME_ASSETS, getMiniGameThemeAsset } from "../services/mobileThemeAssets";
import { saveMiniGameBackgroundAsset } from "../services/backgroundAssetStore";
import {
  checkWriteSettings,
  getPenaltyPermissionStatus,
  openWriteSettings as openPenaltyWriteSettings,
  requestGalleryWallpaperAccess,
  restorePenaltyFontScale,
  setPenaltyFontScale,
  setPenaltyWallpaper,
  type PenaltyPermissionStatus,
} from "../services/hunterPenaltyService";
import { getRankProgressForLevel } from "../services/systemLogic";
import { getLocalMusicTracks } from "../services/systemThemeAssets";
import { isNativeBluetoothAvailable, isWearableBluetoothAvailable } from "../services/xiaomiBandService";
import type { DailyPenalty, DailyQuestItem, Equipment, EquipmentSlotId, MusicTrackSettings, PenaltyIntensity, PlayerState, WearableSample, WorkoutPlanExercise, WorkoutPlanSession } from "../types";
import type { LocalMusicTrack } from "../assets/music/solo-leveling-local/manifest";
import {
  getBackgroundMusicEnabled,
  getGlobalMusicVolume,
  playRandomBackgroundTrack,
  playMusicContext,
  setBackgroundMusicEnabled,
  setGlobalMusicVolume,
  setMusicTrackPreferences,
  testBackgroundMusic,
  playTrackById,
  playNextTrack,
  playPreviousTrack,
  getCurrentMusicTrack,
} from "../services/musicService";

import {
  configureNotificationChannels,
  getNotificationStatus,
  getScheduledNotifications,
  openExactAlarmSettings,
  requestNotificationPermission,
  scheduleDailyTrainingNotifications,
  testLocalNotification,
  consumeNotificationLaunchAction,
  addHunterActionListener,
  notifyAppUpdateAvailable,
  type HunterNotificationStatus,
  type NativeScheduledNotification,
} from "../services/notificationService";

import { BackgroundPermissionModal, useBackgroundPermissionCheck } from "../components/BackgroundPermissionModal";
import { getPerformanceStatus, type HunterPerformanceStatus } from "../services/performanceService";
import { getGlobalVolume, getSystemAudioEnabled, setGlobalVolume, setSystemAudioEnabled } from "../utils/audio";
import { subscribeRewardAnimations } from "../services/rewardAnimationBus";
import type { RewardAnimationEvent } from "../types";

const warmedMiniGameImages = new Set<string>();

type IdlePreloadWindow = Window & {
  requestIdleCallback?: (callback: () => void, options?: { timeout?: number }) => number;
  cancelIdleCallback?: (handle: number) => void;
};

function warmMiniGameImage(src?: string) {
  if (!src || warmedMiniGameImages.has(src) || typeof window === "undefined") return;
  warmedMiniGameImages.add(src);
  const image = new Image();
  image.decoding = "async";
  image.loading = "eager";
  image.src = src;
  if (typeof image.decode === "function") {
    void image.decode().catch(() => undefined);
  }
}

function warmMiniGameHubAssets() {
  for (const game of MINI_GAME_CATALOG) {
    warmMiniGameImage(getMiniGameThemeAsset(game.id).image);
  }
  warmMiniGameImage(MOBILE_THEME_ASSETS.hubCards.system);
}

function warmMiniGameRuntimeAssets(gameId: MiniGameId) {
  if (gameId === "shadow-extraction") {
    warmMiniGameImage(MOBILE_THEME_ASSETS.miniGames.shadowTrue);
    warmMiniGameImage(MOBILE_THEME_ASSETS.miniGames.shadowDecoy);
    warmMiniGameImage(MOBILE_THEME_ASSETS.miniGames.portal);
    warmMiniGameImage(MOBILE_THEME_ASSETS.miniGames.slash);
  }
  for (const background of MINI_GAME_BACKGROUNDS) {
    if (background.source === "built-in" && background.compatibleGames.includes(gameId)) {
      warmMiniGameImage(background.asset);
    }
  }
}

type AppTab = "status" | "training" | "bonus" | "system";
type TrainingView = "quest" | "plan" | "catalog";

const ExerciseCatalogPanel = React.lazy(() =>
  import("../components/ExerciseCatalogPanel").then((module) => ({ default: module.ExerciseCatalogPanel }))
);

const WorkoutPlanPanel = React.lazy(() =>
  import("../components/WorkoutPlanPanel").then((module) => ({ default: module.WorkoutPlanPanel }))
);

const WorkoutSessionRunner = React.lazy(() =>
  import("../components/WorkoutSessionRunner").then((module) => ({ default: module.WorkoutSessionRunner }))
);

const BonusMiniGamesPanel = React.lazy(() =>
  import("../components/BonusMiniGames").then((module) => ({ default: module.BonusMiniGamesPanel }))
);

const GameRuntimeScreen = React.lazy(() =>
  import("../components/BonusMiniGames").then((module) => ({ default: module.GameRuntimeScreen }))
);

const MotionTracker = React.lazy(() =>
  import("../components/MotionTracker").then((module) => ({ default: module.MotionTracker }))
);

const FpsOverlay = React.lazy(() =>
  import("../components/FpsOverlay").then((module) => ({ default: module.FpsOverlay }))
);

const TRAINING_COPY: Record<TrainingView, { kicker: string; title: string; text: string }> = {
  quest: {
    kicker: "Daily quest",
    title: "Trening dnia",
    text: "Dodawaj recznie albo uzyj sensora telefonu. Opaska jest opcjonalna.",
  },
  plan: {
    kicker: "Plan łowcy",
    title: "Moje ćwiczenia",
    text: "Dodaj ćwiczenia z katalogu, ustaw serie, powtórzenia, ciężar i zapisuj wykonane serie.",
  },
  catalog: {
    kicker: "Atlas ruchu",
    title: "Katalog cwiczen",
    text: "Technika, bledy i linki do pokazow bez kopiowania cudzych mediow do aplikacji.",
  },
};

const NAV_ITEMS: Array<{ id: AppTab; label: string; icon: React.ReactNode }> = [
  { id: "status", label: "Status", icon: <Home className="h-5 w-5" /> },
  { id: "training", label: "Trening", icon: <Dumbbell className="h-5 w-5" /> },
  { id: "bonus", label: "Gra", icon: <Gamepad2 className="h-5 w-5" /> },
  { id: "system", label: "System", icon: <Settings className="h-5 w-5" /> },
];

export function Dashboard() {
  const {
    player,
    setPlayer,
    updateDailyQuest,
    addWearableSample,
    completeMiniGame,
    buyShadowExtractionEffect,
    buyShadowExtractionUpgrade,
    selectShadowExtractionEffect,
    buyMiniGameEffect,
    selectMiniGameEffect,
    buyMiniGameUpgrade,
    buyMiniGameBooster,
    activateMiniGameBooster,
    consumeMiniGameBooster,
    startWorkoutPlanSession,
    saveWorkoutPlanSession,
    completeWorkoutPlanSession,
    discardWorkoutPlanSession,
    triggerPenalty,
    completePenalty,
    markPenaltyPrankApplied,
    resetAllData,
  } = usePlayer();
  const [activeTab, setActiveTab] = useState<AppTab>("status");
  const [trackingQuest, setTrackingQuest] = useState<{ itemId: string; trackableId: TrackableExerciseId; name: string } | null>(null);
  const [volume, setVolume] = useState(() => getGlobalVolume());
  const [systemAudioEnabled, setSystemAudioEnabledState] = useState(() => getSystemAudioEnabled());
  const [musicVolume, setMusicVolume] = useState(() => getGlobalMusicVolume());
  const [backgroundMusicEnabled, setBackgroundMusicEnabledState] = useState(() => getBackgroundMusicEnabled());
  const [trainingView, setTrainingView] = useState<TrainingView>("quest");
  const [activeGameId, setActiveGameId] = useState<MiniGameId | null>(null);
  const [finishedWorkoutSession, setFinishedWorkoutSession] = useState<WorkoutPlanSession | null>(null);
  const [hunterProfileOpen, setHunterProfileOpen] = useState(false);
  const [dailyEditorOpen, setDailyEditorOpen] = useState(false);
  const [workoutCountdownOpen, setWorkoutCountdownOpen] = useState(false);
  const [penaltyExerciseAttempt, setPenaltyExerciseAttempt] = useState<{ penaltyId: string; openedAt: number; message: string | null } | null>(null);
  const [rewardEvents, setRewardEvents] = useState<RewardAnimationEvent[]>([]);
  const [updateInfo, setUpdateInfo] = useState<AppUpdateInfo | null>(null);
  const [whatsNewOpen, setWhatsNewOpen] = useState(false);
  const [catalogHighlightId, setCatalogHighlightId] = useState<string | null>(null);
  const {
    showBackgroundPermissionModal,
    openBackgroundPermissionModal,
    closeBackgroundPermissionModal,
  } = useBackgroundPermissionCheck();
  const healthAutoSyncRef = useRef({ lastDateKey: "", lastRunAt: 0 });
  const contentScrollRef = useRef<HTMLElement | null>(null);
  const musicTracks = useMemo(() => getLocalMusicTracks(), []);
  const resetCountdown = useDailyResetCountdown();

  useEffect(() => {
    try {
      const LAST_SEEN_KEY = "solo-leveler:last-seen-version";
      const lastSeen = localStorage.getItem(LAST_SEEN_KEY);
      if (lastSeen && lastSeen !== CURRENT_APP_VERSION) {
        setWhatsNewOpen(true);
      }
      localStorage.setItem(LAST_SEEN_KEY, CURRENT_APP_VERSION);
    } catch {
      // LocalStorage access safe fallback
    }
  }, []);


  useEffect(() => {
    const handleAction = (action: string) => {
      if (!action) return;
      if (action.startsWith("open_exercise:")) {
        const exerciseId = action.replace("open_exercise:", "").trim();
        setActiveTab("training");
        setTrainingView("catalog");
        setCatalogHighlightId(exerciseId);
        const ex = EXERCISE_CATALOG.find((e) => e.id === exerciseId);
        toast.info(`⚔️ ${ex ? ex.name : "Ćwiczenie Łowcy"}: Zobacz technikę i wskazówki!`, { duration: 4500 });
      } else if (action.startsWith("open_minigame:")) {
        const gameId = action.replace("open_minigame:", "").trim() as MiniGameId;
        setActiveTab("bonus");
        setActiveGameId(gameId);
        toast.success("🎮 Brama lochu otwarta! Zmierz się z wyzwaniem!", { duration: 4000 });
      } else if (action === "open_hydration") {
        setActiveTab("status");
        toast.success("💧 Eliksir Many: Nawodnij organizm szklanką wody i zregeneruj siły!", { duration: 5000 });
      } else if (action === "open_training") {
        setActiveTab("training");
        setTrainingView("quest");
      } else if (action === "open_plan") {
        setActiveTab("training");
        setTrainingView("plan");
      } else if (action === "open_system") {
        setActiveTab("system");
      }
    };

    void consumeNotificationLaunchAction().then((action) => {
      if (action) handleAction(action);
    });

    const removeListener = addHunterActionListener((action) => {
      handleAction(action);
    });

    return () => {
      removeListener();
    };
  }, []);

  useEffect(() => {
    void checkForUpdate().then((info) => {
      if (info.hasUpdate) {
        setUpdateInfo(info);
        const lastNotifiedVersion = localStorage.getItem("last_notified_update_version");
        if (lastNotifiedVersion !== info.latestVersion) {
          localStorage.setItem("last_notified_update_version", info.latestVersion);
          void notifyAppUpdateAvailable(info);
        }
      }
    });
  }, []);


  const handleManualCheckUpdate = async () => {
    toast.loading("Sprawdzam dostępność aktualizacji na GitHub...", { id: "check-update" });
    const info = await checkForUpdate();
    if (info.hasUpdate) {
      toast.dismiss("check-update");
      setUpdateInfo(info);
      void notifyAppUpdateAvailable(info);
    } else if (info.error) {
      toast.info(info.error, { id: "check-update", duration: 5000 });
    } else {
      toast.success(`Posiadasz najnowszą wersję Systemu Łowcy (v${info.currentVersion})!`, { id: "check-update" });
    }
  };


  const progress = useMemo(() => player ? getDailyQuestProgress(player.dailyQuest) : { percent: 0, completedCount: 0, totalCount: 0 }, [player?.dailyQuest]);
  const dailyQuestItems = useMemo(() => player ? getEnabledDailyQuestItems(player.dailyQuest) : [], [player?.dailyQuest]);
  const incompleteDailyQuestItems = useMemo(
    () => player ? getIncompleteDailyQuestItems(player.dailyQuest) : [],
    [player?.dailyQuest],
  );
  const dailyCompleted = player ? progress.totalCount > 0 && progress.completedCount >= progress.totalCount : false;
  const dailyReminderEnabled = Boolean(
    player && !activeGameId && activeTab !== "training" && progress.completedCount < progress.totalCount && !player.dailyQuest.completedAt
  );
  const [dailyReminderMode, hideDailyReminder] = useSmartDailyQuestReminder(dailyReminderEnabled);

  useEffect(() => {
    if (activeTab === "training" && dailyCompleted && trainingView === "quest") {
      setTrainingView("plan");
    }
  }, [activeTab, dailyCompleted, trainingView]);

  useEffect(() => {
    if (activeGameId) return;
    contentScrollRef.current?.scrollTo({ top: 0, behavior: "auto" });
  }, [activeGameId, activeTab]);

  useEffect(() => {
    const warmMiniGames = () => {
      warmMiniGameHubAssets();
    };
    const idleWindow = window as IdlePreloadWindow;
    if (idleWindow.requestIdleCallback) {
      const handle = idleWindow.requestIdleCallback(warmMiniGames, { timeout: 2200 });
      return () => idleWindow.cancelIdleCallback?.(handle);
    }
    const timer = window.setTimeout(warmMiniGames, 900);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    return subscribeRewardAnimations((event) => {
      if (event.source === "mini-game") return;
      setRewardEvents((events) => [...events.slice(-3), event]);
      window.setTimeout(() => {
        setRewardEvents((events) => events.filter((item) => item.id !== event.id));
      }, 1550);
    });
  }, []);

  useEffect(() => {
    if (!player) return;
    applyThemeToDocument(player.settings.themeId);
  }, [player?.settings.themeId]);

  useEffect(() => {
    if (!player) return;
    applyThemeEffectToDocument(player.settings.activeThemeEffectId);
  }, [player?.settings.activeThemeEffectId]);

  useEffect(() => {
    if (!player) return;
    const enabled = player.settings.systemAudioEnabled !== false;
    setSystemAudioEnabledState(enabled);
    setSystemAudioEnabled(enabled);
  }, [player?.settings.systemAudioEnabled]);

  useEffect(() => {
    if (!player) return;
    const enabled = player.settings.backgroundMusicEnabled !== false;
    const nextVolume = typeof player.settings.backgroundMusicVolume === "number" ? player.settings.backgroundMusicVolume : 0.2;
    setBackgroundMusicEnabledState(enabled);
    setMusicVolume(nextVolume);
    setBackgroundMusicEnabled(enabled);
    setGlobalMusicVolume(nextVolume);
    setMusicTrackPreferences(player.settings.musicTracks);
  }, [player?.settings.backgroundMusicEnabled, player?.settings.backgroundMusicVolume, player?.settings.musicTracks]);

  useEffect(() => {
    if (!player || activeGameId) return;
    void playMusicContext("status");
  }, [
    activeGameId,
    player?.settings.backgroundMusicEnabled,
    player?.settings.backgroundMusicVolume,
    player?.settings.musicTracks,
  ]);

  const runHealthAutoSync = useCallback(async (reason: "start" | "resume" | "midnight" | "notification") => {
    if (!player?.settings.healthAutoSync) return;
    const now = Date.now();
    const dateKey = getLocalDateKey();
    const throttled = reason !== "notification" && healthAutoSyncRef.current.lastDateKey === dateKey && now - healthAutoSyncRef.current.lastRunAt < 15 * 60 * 1000;
    const runningItem = findDailyQuestItemByTrackable(player.dailyQuest, "runningKm");
    const runningProgress = runningItem ? getDailyQuestItemProgress(player.dailyQuest, runningItem.id) : 0;
    if (throttled || !runningItem || runningProgress >= runningItem.target) return;

    healthAutoSyncRef.current = { lastDateKey: dateKey, lastRunAt: now };
    try {
      const status = await getHealthConnectStatus();
      if (!status.available || !status.permissionsGranted) return;
      const summary = await readTodayHealthSummary();
      const wearableSample = createWearableSampleFromHealthSummary(summary);
      if (wearableSample) addWearableSample(wearableSample);
      const { km } = getHealthConnectQuestDistanceKm(summary);
      const lastImported = getLastHealthConnectImport(dateKey);
      const delta = Number(Math.max(0, km - lastImported).toFixed(2));
      if (delta > 0) {
        saveLastHealthConnectImport(dateKey, km);
        updateDailyQuest(runningItem.id, delta, "healthConnect");
      }
    } catch {
      // Health Connect is optional; failed sync must never block the app.
    }
  }, [addWearableSample, player?.settings.healthAutoSync, player?.dailyQuest, updateDailyQuest]);

  useEffect(() => {
    if (!player?.settings.healthAutoSync) return;
    void runHealthAutoSync("start");

    const handleVisibility = () => {
      if (!document.hidden) void runHealthAutoSync("resume");
    };
    const msToMidnight = getMsUntilNextLocalDay();
    const midnightTimer = window.setTimeout(() => void runHealthAutoSync("midnight"), msToMidnight + 1500);
    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      window.clearTimeout(midnightTimer);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [player?.settings.healthAutoSync, runHealthAutoSync]);

  const handleNotificationAction = useCallback(async (action: string | null) => {
    if (!action || !player) return;
    if (action === "open_status") {
      setActiveTab("status");
      return;
    }
    if (action === "open_system") {
      setActiveTab("system");
      return;
    }
    if (action === "open_training" || action === "start_training") {
      setActiveTab("training");
      setTrainingView(dailyCompleted ? "plan" : "quest");
      return;
    }
    if (action === "open_plan") {
      setActiveTab("training");
      setTrainingView("plan");
      return;
    }
    if (action === "workout_pause" && player.activeWorkoutSession && player.activeWorkoutSession.status !== "paused") {
      saveWorkoutPlanSession(pauseWorkoutSession(player.activeWorkoutSession));
      return;
    }
    if (action === "workout_resume" && player.activeWorkoutSession?.status === "paused") {
      saveWorkoutPlanSession(resumeWorkoutSession(player.activeWorkoutSession));
      return;
    }
    if (action === "workout_finish" && player.activeWorkoutSession) {
      completeWorkoutPlanSession(savePartialWorkoutSessionWithoutReward(player.activeWorkoutSession));
      return;
    }
    if (action.startsWith("snooze_")) {
      setActiveTab("status");
      return;
    }
    if (action === "health_sync") {
      await runHealthAutoSync("notification");
    }
  }, [dailyCompleted, player, runHealthAutoSync, saveWorkoutPlanSession, completeWorkoutPlanSession]);

  useEffect(() => {
    if (!player) return;
    const consume = async () => handleNotificationAction(await consumeNotificationLaunchAction());
    void consume();
    const handleVisibility = () => {
      if (!document.hidden) void consume();
    };
    document.addEventListener("visibilitychange", handleVisibility);
    const poll = window.setInterval(() => {
      if (!document.hidden) void consume();
    }, 5000);
    return () => {
      window.clearInterval(poll);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [handleNotificationAction, player]);

  usePenaltyFontPrankLoop(player);

  const activePenalty = useMemo(() => player ? getActivePenalty(player.penalties) : null, [player?.penalties]);
  const cp = useMemo(() => player ? getCombatPower(player) : 0, [player]);

  if (!player) return null;

  const xpTarget = Math.max(100, player.level * 100);
  const xpPercent = Math.min(100, (player.xp / xpTarget) * 100);
  const bonusUnlocked = progress.percent >= 50 || Boolean(player.dailyQuest.completedAt);
  const workoutPlan = player.workoutPlan || [];
  const trainingCopy = TRAINING_COPY[trainingView];

  const openPenaltyExercise = () => {
    if (!activePenalty) return;
    setActiveTab("training");
    setTrainingView("catalog");
    setPenaltyExerciseAttempt({ penaltyId: activePenalty.id, openedAt: Date.now(), message: null });
  };

  const updateDailyQuestList = (items: DailyQuestItem[]) => {
    void setPlayer({ ...player, dailyQuest: updateDailyQuestItems(player.dailyQuest, items) });
  };

  const addExercise = (itemId: string, amount: number, source: "manual" | "phoneSensor" = "manual") => {
    updateDailyQuest(itemId, amount, source);
  };

  const updateWorkoutPlan = (nextPlan: WorkoutPlanExercise[]) => {
    void setPlayer({ ...player, workoutPlan: nextPlan });
  };

  const toggleMiniGamesUnlock = (enabled: boolean) => {
    void setPlayer({
      ...player,
      settings: {
        ...player.settings,
        unlockAllMiniGames: enabled,
      },
    });
  };

  const addCatalogExercise = (exercise: ExerciseCatalogEntry) => {
    updateWorkoutPlan(addCatalogExerciseToPlan(workoutPlan, exercise));
  };

  const requestWorkoutPlanStart = () => {
    if (player.activeWorkoutSession || workoutPlan.length === 0) {
      startWorkoutPlanSession();
      return;
    }
    setWorkoutCountdownOpen(true);
  };

  const handleVolumeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const next = Number(event.target.value);
    setVolume(next);
    setGlobalVolume(next);
  };

  const toggleSystemAudio = (enabled: boolean) => {
    setSystemAudioEnabledState(enabled);
    setSystemAudioEnabled(enabled);
    void setPlayer({
      ...player,
      settings: {
        ...player.settings,
        systemAudioEnabled: enabled,
      },
    });
  };

  const toggleBackgroundMusic = (enabled: boolean) => {
    setBackgroundMusicEnabledState(enabled);
    setBackgroundMusicEnabled(enabled);
    void setPlayer({
      ...player,
      settings: {
        ...player.settings,
        backgroundMusicEnabled: enabled,
      },
    });
  };

  const handleMusicVolumeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const next = Number(event.target.value);
    setMusicVolume(next);
    setGlobalMusicVolume(next);
    void setPlayer({
      ...player,
      settings: {
        ...player.settings,
        backgroundMusicVolume: next,
      },
    });
  };

  const updateMusicTrackSettings = (patch: Partial<MusicTrackSettings>) => {
    const nextMusicTracks: MusicTrackSettings = {
      ...player.settings.musicTracks,
      ...patch,
      miniGameTrackIds: {
        ...(player.settings.musicTracks?.miniGameTrackIds || {}),
        ...(patch.miniGameTrackIds || {}),
      },
    };
    setMusicTrackPreferences(nextMusicTracks);
    void playMusicContext("status");
    void setPlayer({
      ...player,
      settings: {
        ...player.settings,
        musicTracks: nextMusicTracks,
      },
    });
  };

  const randomizeBackgroundTrack = () => {
    const currentTrackId = player.settings.musicTracks?.appTrackId;
    const options = musicTracks.filter((track) => track.id !== currentTrackId);
    const picked = (options.length ? options : musicTracks)[Math.floor(Math.random() * (options.length ? options.length : musicTracks.length))];
    if (picked) {
      updateMusicTrackSettings({ appTrackId: picked.id });
      return;
    }
    void playRandomBackgroundTrack();
  };

  const selectTheme = (themeId: PlayerState["settings"]["themeId"]) => {
    void setPlayer({
      ...player,
      settings: {
        ...player.settings,
        themeId,
      },
    });
  };

  const buyTheme = (themeId: PlayerState["settings"]["themeId"]) => {
    if (player.settings.ownedThemeIds.includes(themeId)) {
      selectTheme(themeId);
      return;
    }
    if (!canBuyTheme(player, themeId)) return;
    void setPlayer({
      ...player,
      gold: player.gold - getThemeDefinition(themeId).cost,
      settings: {
        ...player.settings,
        ownedThemeIds: [...player.settings.ownedThemeIds, themeId],
        themeId,
      },
    });
  };

  const selectThemeEffect = (effectId: ThemeEffectId) => {
    if (!player.settings.ownedThemeEffectIds.includes(effectId)) return;
    void setPlayer({
      ...player,
      settings: {
        ...player.settings,
        activeThemeEffectId: effectId,
      },
    });
  };

  const buyThemeEffect = (effectId: ThemeEffectId) => {
    if (player.settings.ownedThemeEffectIds.includes(effectId)) {
      selectThemeEffect(effectId);
      return;
    }
    if (!canBuyThemeEffect(player, effectId)) return;
    void setPlayer({
      ...player,
      gold: player.gold - getThemeEffectDefinition(effectId).cost,
      settings: {
        ...player.settings,
        ownedThemeEffectIds: [...player.settings.ownedThemeEffectIds, effectId],
        activeThemeEffectId: effectId,
      },
    });
  };

  const selectThemeWallpaper = (wallpaperId: string) => {
    if (!player.settings.ownedThemeWallpaperIds.includes(wallpaperId)) return;
    void setPlayer({
      ...player,
      settings: {
        ...player.settings,
        activeWallpaperId: wallpaperId,
      },
    });
  };

  const buyThemeWallpaper = (wallpaperId: string) => {
    if (player.settings.ownedThemeWallpaperIds.includes(wallpaperId)) {
      selectThemeWallpaper(wallpaperId);
      return;
    }
    if (!canBuyThemeWallpaper(player, wallpaperId)) return;
    const wallpaper = getThemeWallpaperDefinition(wallpaperId);
    void setPlayer({
      ...player,
      gold: player.gold - wallpaper.cost,
      settings: {
        ...player.settings,
        ownedThemeWallpaperIds: [...player.settings.ownedThemeWallpaperIds, wallpaper.id],
        activeWallpaperId: wallpaper.id,
      },
    });
  };

  const selectMiniGameBackground = (gameId: MiniGameId, backgroundId: string) => {
    const backgrounds = normalizeMiniGameBackgrounds(player.miniGameBackgrounds);
    if (!isMiniGameBackgroundOwned(backgrounds, backgroundId)) return;
    const available = getAvailableBackgroundsForGame(gameId, backgrounds);
    if (!available.some((background) => background.id === backgroundId)) return;

    void setPlayer({
      ...player,
      miniGameBackgrounds: {
        ...backgrounds,
        selectedByGame: {
          ...backgrounds.selectedByGame,
          [gameId]: backgroundId,
        },
      },
    });
  };

  const buyMiniGameBackground = (gameId: MiniGameId, backgroundId: string) => {
    const backgrounds = normalizeMiniGameBackgrounds(player.miniGameBackgrounds);
    if (backgrounds.ownedIds.includes(backgroundId)) {
      selectMiniGameBackground(gameId, backgroundId);
      return;
    }
    if (!canBuyMiniGameBackground(player, backgroundId)) return;
    const definition = MINI_GAME_BACKGROUNDS.find((background) => background.id === backgroundId);
    if (!definition) return;

    void setPlayer({
      ...player,
      gold: player.gold - definition.cost,
      miniGameBackgrounds: {
        ...backgrounds,
        ownedIds: [...backgrounds.ownedIds, backgroundId],
        selectedByGame: {
          ...backgrounds.selectedByGame,
          [gameId]: backgroundId,
        },
      },
    });
  };

  const toggleMiniGameGrid = (gameId: MiniGameId, enabled: boolean) => {
    void setPlayer({
      ...player,
      settings: {
        ...player.settings,
        miniGameGridByGame: {
          ...normalizeMiniGameGridSettings(player.settings.miniGameGridByGame),
          [gameId]: enabled,
        },
      },
    });
  };

  const importMiniGameBackground = async (gameId: MiniGameId, file: File) => {
    const dataUrl = await resizeMiniGameBackgroundFile(file);
    const galleryItem = createGalleryMiniGameBackground(file.name, dataUrl);
    try {
      await saveMiniGameBackgroundAsset({
        id: galleryItem.id,
        dataUrl,
        createdAt: galleryItem.createdAt,
      });
    } catch {
      // The preview data URL remains in player state as a safe fallback.
    }
    const backgrounds = normalizeMiniGameBackgrounds(player.miniGameBackgrounds);
    await setPlayer({
      ...player,
      miniGameBackgrounds: {
        ...backgrounds,
        galleryBackgrounds: [...backgrounds.galleryBackgrounds, galleryItem],
        ownedIds: [...backgrounds.ownedIds, galleryItem.id],
        selectedByGame: {
          ...backgrounds.selectedByGame,
          [gameId]: galleryItem.id,
        },
      },
    });
  };

  const updatePenaltySettings = (patch: Partial<PlayerState["settings"]>) => {
    void setPlayer({
      ...player,
      settings: {
        ...player.settings,
        ...patch,
        penaltyConsentSeen: true,
      },
    });
  };

  const updateGeneralSettings = (patch: Partial<PlayerState["settings"]>) => {
    void setPlayer({
      ...player,
      settings: {
        ...player.settings,
        ...patch,
      },
    });
  };

  const devResetDailyQuest = () => {
    void setPlayer({
      ...player,
      dailyQuest: {
        ...resetDailyQuestProgress(player.dailyQuest, player.dailyQuest.streak || 0),
        penaltyGiven: Boolean(activePenalty),
      },
    });
  };

  const devCompleteDailyQuest = () => {
    void setPlayer({
      ...player,
      dailyQuest: completeDailyQuestProgress(player.dailyQuest),
    });
  };

  const devAddGold = (amount: number) => {
    void setPlayer({
      ...player,
      gold: player.gold + amount,
    });
  };

  const devClearPenalty = () => {
    if (!activePenalty) return;
    void setPlayer({
      ...player,
      penalties: player.penalties.map((penalty) =>
        penalty.id === activePenalty.id
          ? { ...penalty, status: "cancelled" as const, completedAt: new Date().toISOString() }
          : penalty
      ),
      dailyQuest: {
        ...player.dailyQuest,
        penaltyGiven: false,
      },
    });
  };

  const devResetMiniGames = () => {
    void setPlayer({
      ...player,
      miniGames: Object.fromEntries(
        MINI_GAME_CATALOG.map((game) => [game.id, createDefaultMiniGameProgress(game.id)])
      ) as PlayerState["miniGames"],
    });
  };

  const updateNotificationSettings = (patch: Partial<PlayerState["settings"]["notifications"]>) => {
    void setPlayer({
      ...player,
      settings: {
        ...player.settings,
        notifications: {
          ...player.settings.notifications,
          ...patch,
          quietHours: {
            ...player.settings.notifications.quietHours,
            ...(patch.quietHours || {}),
          },
        },
      },
    });
  };

  const selectTab = (tab: AppTab) => {
    if (tab === "bonus") {
      warmMiniGameHubAssets();
    }
    if (tab === "training" && dailyCompleted) {
      setTrainingView("plan");
    }
    setActiveTab(tab);
  };

  const launchMiniGame = (gameId: MiniGameId) => {
    if (player.hp <= 0 && gameId !== "shadow-extraction") {
      toast.error("Brak HP. Ekstrakcja Cienia może uratować Cię legendarną bańką serca.");
      return;
    }
    warmMiniGameRuntimeAssets(gameId);
    setActiveGameId(gameId);
  };

  if (activeGameId) {
    return (
      <>
        <Suspense fallback={<GameRuntimeLoading />}>
          <GameRuntimeScreen
            gameId={activeGameId}
            player={player}
            onComplete={completeMiniGame}
            onExit={() => {
              setActiveGameId(null);
              setActiveTab("bonus");
            }}
            onBuyShadowExtractionEffect={buyShadowExtractionEffect}
            onBuyShadowExtractionUpgrade={buyShadowExtractionUpgrade}
            onSelectShadowExtractionEffect={selectShadowExtractionEffect}
            onBuyMiniGameEffect={buyMiniGameEffect}
            onSelectMiniGameEffect={selectMiniGameEffect}
            onBuyMiniGameUpgrade={buyMiniGameUpgrade}
            onBuyMiniGameBooster={buyMiniGameBooster}
            onActivateMiniGameBooster={activateMiniGameBooster}
            onConsumeMiniGameBooster={consumeMiniGameBooster}
            backgroundMusicEnabled={backgroundMusicEnabled}
            systemAudioEnabled={systemAudioEnabled}
            onToggleBackgroundMusic={toggleBackgroundMusic}
            onToggleSystemAudio={toggleSystemAudio}
            onRandomizeMusicTrack={randomizeBackgroundTrack}
            miniGameBackgrounds={player.miniGameBackgrounds}
            onBuyMiniGameBackground={buyMiniGameBackground}
            onSelectMiniGameBackground={selectMiniGameBackground}
            onImportMiniGameBackground={importMiniGameBackground}
            onToggleMiniGameGrid={toggleMiniGameGrid}
          />
        </Suspense>
        {player.settings.fpsOverlayEnabled && (
          <Suspense fallback={null}>
            <FpsOverlay enabled mode="game" />
          </Suspense>
        )}
      </>
    );
  }

  const uiSurfaceOpacity = Math.min(1, Math.max(0.55, player.settings.uiSurfaceOpacity ?? 0.84));

  return (
    <div
      className="sl-app-root relative h-full w-full overflow-hidden text-[var(--theme-text)]"
      data-graphics-quality={player.settings.graphicsQuality ?? "balanced"}
      style={
        {
          "--ui-surface-opacity-percent": `${Math.round(uiSurfaceOpacity * 100)}%`,
        } as React.CSSProperties
      }
    >
      <ThemeAmbientLayer
        effectId={player.settings.activeThemeEffectId}
        wallpaperId={player.settings.activeWallpaperId}
        reducedMotion={player.settings.reducedMotion}
        graphicsQuality={player.settings.graphicsQuality ?? "balanced"}
      />
      {player.settings.fpsOverlayEnabled && (
        <Suspense fallback={null}>
          <FpsOverlay enabled mode="app" />
        </Suspense>
      )}

      <main className="sl-theme-shell relative z-10 mx-auto flex h-full w-full max-w-[520px] flex-col overflow-hidden border-x shadow-2xl shadow-sky-950/35">
        <section ref={contentScrollRef} className="sl-main-scroll relative flex-1 overflow-y-auto px-4 pb-[calc(max(env(safe-area-inset-bottom),0.75rem)+8.75rem)] pt-[max(env(safe-area-inset-top),1rem)] custom-scrollbar">
          {activePenalty && activeTab !== "bonus" && <PenaltyBanner penalty={activePenalty} onPerform={openPenaltyExercise} />}

          <>
            {activeTab === "status" && (
              <div className="space-y-4">
                <HeaderCard player={player} cp={cp} xpPercent={xpPercent} xpTarget={xpTarget} onOpenTraining={() => selectTab("training")} onOpenProfile={() => setHunterProfileOpen(true)} />
                <StatusPanel player={player} progress={progress} bonusUnlocked={bonusUnlocked} onStartTraining={() => selectTab("training")} onOpenBonus={() => selectTab("bonus")} />
                <TodayPreview
                  player={player}
                  items={dailyQuestItems}
                  resetCountdown={resetCountdown}
                  onTrack={(item) => item.trackableExerciseId && setTrackingQuest({ itemId: item.id, trackableId: item.trackableExerciseId, name: item.label })}
                  onAdd={addExercise}
                  onEdit={() => {
                    setActiveTab("training");
                    setTrainingView("quest");
                    setDailyEditorOpen(true);
                  }}
                />
              </div>
            )}

            {activeTab === "training" && (
              <div className="space-y-4">
                <SectionTitle
                  kicker={trainingCopy.kicker}
                  title={trainingCopy.title}
                  text={trainingCopy.text}
                />
                <TrainingViewSwitch value={trainingView} onChange={setTrainingView} />
                {trainingView === "quest" ? (
                  incompleteDailyQuestItems.length > 0 ? (
                    <>
                      <DailyQuestToolbar onEdit={() => setDailyEditorOpen(true)} completedCount={progress.completedCount} totalCount={progress.totalCount} />
                      {incompleteDailyQuestItems.map((exercise) => (
                        <React.Fragment key={exercise.id}>
                          <WorkoutCard
                            exercise={exercise}
                            player={player}
                            onAdd={addExercise}
                            onTrack={() => exercise.trackableExerciseId && setTrackingQuest({ itemId: exercise.id, trackableId: exercise.trackableExerciseId, name: exercise.label })}
                          />
                        </React.Fragment>
                      ))}
                    </>
                  ) : (
                    <>
                      <DailyQuestToolbar onEdit={() => setDailyEditorOpen(true)} completedCount={progress.completedCount} totalCount={progress.totalCount} />
                      <DailyCompleteCard resetCountdown={resetCountdown} />
                    </>
                  )
                ) : trainingView === "plan" ? (
                  <Suspense fallback={<CatalogLoading />}>
                    <WorkoutPlanPanel
                      plan={workoutPlan}
                      sessions={player.workoutSessions || []}
                      workoutHistory={player.workoutHistory || []}
                      activeSession={player.activeWorkoutSession}
                      onChange={updateWorkoutPlan}
                      onStartSession={requestWorkoutPlanStart}
                    />
                  </Suspense>
                ) : (
                  <Suspense fallback={<CatalogLoading />}>
                    <ExerciseCatalogPanel
                      plannedExerciseIds={workoutPlan.map((exercise) => exercise.catalogExerciseId)}
                      onAddToPlan={addCatalogExercise}
                      highlightExerciseId={catalogHighlightId}
                    />
                  </Suspense>
                )}

              </div>
            )}

            {activeTab === "bonus" && (
              <div className="space-y-4">
                <Suspense fallback={<CatalogLoading />}>
                  <BonusMiniGamesPanel
                    player={player}
                    dailyUnlocked={bonusUnlocked}
                    unlockAll={Boolean(player.settings.unlockAllMiniGames)}
                    progressPercent={progress.percent}
                    onLaunchGame={launchMiniGame}
                  />
                </Suspense>
              </div>
            )}

            {activeTab === "system" && (
              <div className="space-y-4">
                <SectionTitle kicker="System" title="Ustawienia" />
                <SystemPanel
                  player={player}
                  volume={volume}
                  systemAudioEnabled={systemAudioEnabled}
                  musicVolume={musicVolume}
                  backgroundMusicEnabled={backgroundMusicEnabled}
                  onVolumeChange={handleVolumeChange}
                  onToggleSystemAudio={toggleSystemAudio}
                  onMusicVolumeChange={handleMusicVolumeChange}
                  onToggleBackgroundMusic={toggleBackgroundMusic}
                  musicTracks={musicTracks}
                  musicTrackSettings={player.settings.musicTracks}
                  onUpdateMusicTrackSettings={updateMusicTrackSettings}
                  onRandomizeMusicTrack={randomizeBackgroundTrack}
                  onReset={resetAllData}
                  onOpenWhatsNew={() => setWhatsNewOpen(true)}
                  onImportHealthDistance={(km) => {

                    const runningItem = findDailyQuestItemByTrackable(player.dailyQuest, "runningKm");
                    if (runningItem) updateDailyQuest(runningItem.id, km, "healthConnect");
                    else toast.error("Daily nie ma aktywnego zadania biegania.");
                  }}
                  onToggleMiniGamesUnlock={toggleMiniGamesUnlock}
                  onUpdateNotificationSettings={updateNotificationSettings}
                  onUpdatePenaltySettings={updatePenaltySettings}
                  onUpdateSettings={updateGeneralSettings}
                  onTriggerPenalty={triggerPenalty}
                  onMarkPenaltyPrankApplied={markPenaltyPrankApplied}
                  onBuyTheme={buyTheme}
                  onSelectTheme={selectTheme}
                  onBuyThemeEffect={buyThemeEffect}
                  onSelectThemeEffect={selectThemeEffect}
                  onBuyThemeWallpaper={buyThemeWallpaper}
                  onSelectThemeWallpaper={selectThemeWallpaper}
                  onWearableSample={addWearableSample}
                  onDevResetDailyQuest={devResetDailyQuest}
                  onDevCompleteDailyQuest={devCompleteDailyQuest}
                  onDevAddGold={devAddGold}
                  onDevClearPenalty={devClearPenalty}
                  onDevResetMiniGames={devResetMiniGames}
                  onOpenWearableSensor={() => {
                    const firstTrackable = dailyQuestItems.find((item) => item.trackableExerciseId);
                    if (firstTrackable?.trackableExerciseId) {
                      setTrackingQuest({ itemId: firstTrackable.id, trackableId: firstTrackable.trackableExerciseId, name: firstTrackable.label });
                    } else {
                      toast.error("Daily nie ma ćwiczenia obsługiwanego przez sensor.");
                    }
                  }}
                  onCheckUpdate={handleManualCheckUpdate}
                  onOpenBackgroundPermissions={openBackgroundPermissionModal}
                />
              </div>
            )}

          </>
        </section>

        <DailyQuestReminder
          enabled={dailyReminderEnabled}
          mode={dailyReminderMode}
          progress={progress.percent}
          completedCount={progress.completedCount}
          totalCount={progress.totalCount}
          resetCountdown={resetCountdown}
          onOpenTraining={() => {
            hideDailyReminder();
            selectTab("training");
          }}
        />
        <BottomNav activeTab={activeTab} onSelect={selectTab} />
      </main>

      <AnimatePresence>
        {hunterProfileOpen && (
          <HunterProfileModal player={player} cp={cp} onUpdate={setPlayer} onClose={() => setHunterProfileOpen(false)} />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {dailyEditorOpen && (
          <DailyQuestEditorModal
            player={player}
            onClose={() => setDailyEditorOpen(false)}
            onUpdateItems={updateDailyQuestList}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {trackingQuest && (
          <Suspense fallback={null}>
            <MotionTracker
              exerciseId={trackingQuest.trackableId}
              exerciseName={trackingQuest.name}
              onClose={() => setTrackingQuest(null)}
              onAddReps={(value) => updateDailyQuest(trackingQuest.itemId, value, "phoneSensor")}
              onWearableSample={addWearableSample}
            />
          </Suspense>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {penaltyExerciseAttempt && activePenalty && penaltyExerciseAttempt.penaltyId === activePenalty.id && (
          <PenaltyExerciseModal
            penalty={activePenalty}
            openedAt={penaltyExerciseAttempt.openedAt}
            message={penaltyExerciseAttempt.message}
            onClose={() => setPenaltyExerciseAttempt(null)}
            onTooFast={() =>
              setPenaltyExerciseAttempt((current) =>
                current ? { ...current, message: "Kogo oszukujesz, System czy siebie?" } : current
              )
            }
            onComplete={() => {
              completePenalty(activePenalty.id);
              setPenaltyExerciseAttempt(null);
            }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {(player.activeWorkoutSession || finishedWorkoutSession) && (
          <Suspense fallback={null}>
            <WorkoutSessionRunner
              session={finishedWorkoutSession ?? player.activeWorkoutSession!}
              previousSummaries={player.workoutSessions || []}
              onSave={saveWorkoutPlanSession}
              onComplete={(session) => {
                setFinishedWorkoutSession(session);
                completeWorkoutPlanSession(session);
              }}
              onDiscard={() => {
                setFinishedWorkoutSession(null);
                discardWorkoutPlanSession();
              }}
              onCloseSummary={() => setFinishedWorkoutSession(null)}
            />
          </Suspense>
        )}
      </AnimatePresence>

      <RewardAnimationLayer events={rewardEvents} />

      <AnimatePresence>
        {updateInfo?.hasUpdate && (
          <SystemUpdateModal
            updateInfo={updateInfo}
            onClose={() => setUpdateInfo(null)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {whatsNewOpen && (
          <WhatsNewModal onClose={() => setWhatsNewOpen(false)} />
        )}
      </AnimatePresence>

      <BackgroundPermissionModal
        isOpen={showBackgroundPermissionModal}
        onClose={closeBackgroundPermissionModal}
      />

      <AnimatePresence>
        {workoutCountdownOpen && (
          <WorkoutStartCountdown
            onCancel={() => setWorkoutCountdownOpen(false)}
            onComplete={() => {
              setWorkoutCountdownOpen(false);
              startWorkoutPlanSession();
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}


function HeaderCard({
  player,
  cp,
  xpPercent,
  xpTarget,
  onOpenTraining,
  onOpenProfile,
}: {
  player: PlayerState;
  cp: number;
  xpPercent: number;
  xpTarget: number;
  onOpenTraining: () => void;
  onOpenProfile: () => void;
}) {
  const rankProgress = getRankProgressForLevel(player.level);

  return (
    <div className="sl-section relative mb-4 overflow-hidden rounded-[22px] p-4">
      <div className="relative flex items-center gap-4">
        <button
          className="sl-avatar-frame sl-avatar-frame-status shrink-0 active:scale-[0.98]"
          type="button"
          onClick={onOpenProfile}
          aria-label="Otwórz statystyki łowcy"
        >
          {player.avatarUrl && player.avatarUrl !== "fallback" ? (
            <img src={player.avatarUrl} alt="" className="sl-avatar-image" referrerPolicy="no-referrer" />
          ) : (
            <div className="sl-avatar-placeholder">?</div>
          )}
        </button>
        <div className="min-w-0 flex-1">
          <div className="mb-2 flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="sl-kicker text-[10px] font-black uppercase tracking-[0.28em]">Status Łowcy</p>
              <h1 className="truncate text-2xl font-black uppercase tracking-[0.04em] text-[var(--theme-text-strong)]">{player.name}</h1>
            </div>
            <div className="sl-chip-active rounded-full px-3 py-1 text-xs font-black">Lv.{player.level}</div>
          </div>
          <div className="flex flex-wrap gap-2 text-[10px] font-black uppercase tracking-widest">
            <span className="sl-chip rounded-full px-2.5 py-1">{player.jobClass}</span>
            <span className="sl-chip-active rounded-full px-2.5 py-1">{player.rank}</span>
            <span className="sl-chip rounded-full px-2.5 py-1">CP {cp}</span>
          </div>
        </div>
      </div>

      <div className="relative mt-4 grid gap-3">
        <Meter label={`Ranga ${rankProgress.rank}`} value={rankProgress.progress} color="cyan" right={rankProgress.nextLevel ? `do Lv.${rankProgress.nextLevel}` : "max"} />
        <Meter label="XP" value={xpPercent} color="blue" right={`${Math.floor(player.xp)} / ${xpTarget}`} />
      </div>

      <button
        type="button"
        onClick={onOpenTraining}
        className="sl-button-primary relative z-10 mt-4 flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-black uppercase tracking-[0.18em] active:scale-[0.98]"
      >
        <Zap className="h-4 w-4" />
        Start treningu
      </button>
    </div>
  );
}

function HunterProfileModal({
  player,
  cp,
  onUpdate,
  onClose,
}: {
  player: PlayerState;
  cp: number;
  onUpdate: (player: PlayerState | null) => Promise<void>;
  onClose: () => void;
}) {
  const [view, setView] = useState<"stats" | "skills" | "equipment" | "bag">("stats");
  const [focusedSlot, setFocusedSlot] = useState<EquipmentSlotId | null>(null);
  const [avatarPreviewOpen, setAvatarPreviewOpen] = useState(false);
  const abilityRows = getHunterAbilityRows(player);
  const equippedItems = getEquippedItems(player);
  const equipmentBonus = equippedItems.reduce((acc, item) => {
    if (item.durability > 0) acc[item.bonusType] += item.bonusValue;
    return acc;
  }, { STR: 0, VITALITY: 0, AGILITY: 0, INTELLIGENCE: 0, SENSE: 0 } as PlayerState["stats"]);
  const visibleInventory = player.inventory
    .filter((item) => !focusedSlot || canEquipItemInSlot(item, focusedSlot))
    .sort((left, right) => right.bonusValue - left.bonusValue);

  const equipItem = (item: Equipment, slot?: EquipmentSlotId) => {
    void onUpdate(equipPlayerItem(player, item, slot));
  };

  const unequipItem = (slot: EquipmentSlotId) => {
    void onUpdate(unequipSlot(player, slot));
  };

  const sellItem = (item: Equipment) => {
    void onUpdate({
      ...player,
      inventory: player.inventory.filter((entry) => entry.id !== item.id),
      gold: player.gold + getItemSellPrice(item),
    });
  };

  return (
    <motion.div
      className="sl-modal-backdrop fixed inset-0 z-[950] grid place-items-end p-3 text-[var(--theme-text)] sm:place-items-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      role="dialog"
      aria-modal="true"
    >
      <motion.div
        className="sl-modal max-h-[88dvh] w-full max-w-[560px] overflow-y-auto rounded-[28px] border p-4 shadow-[0_0_44px_color-mix(in_srgb,var(--theme-accent)_18%,transparent)] custom-scrollbar"
        initial={{ y: 26, scale: 0.98 }}
        animate={{ y: 0, scale: 1 }}
        exit={{ y: 18, scale: 0.98 }}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={() => setAvatarPreviewOpen(true)}
              className="sl-avatar-frame sl-avatar-frame-profile shrink-0 active:scale-[0.98]"
              aria-label="Powiększ awatar i ekwipunek"
            >
              {player.avatarUrl && player.avatarUrl !== "fallback" ? (
                <img src={player.avatarUrl} alt="" className="sl-avatar-image" referrerPolicy="no-referrer" />
              ) : (
                <div className="sl-avatar-placeholder">?</div>
              )}
            </button>
            <div className="min-w-0">
              <p className="font-mono text-[10px] font-black uppercase tracking-[0.28em] text-[var(--theme-accent)]">Profil łowcy</p>
              <h2 className="truncate text-2xl font-black uppercase tracking-[0.06em] text-[var(--theme-text)]">{player.name}</h2>
              <p className="sl-muted mt-1 font-mono text-xs font-black uppercase tracking-widest">Lv.{player.level} · {player.rank} · CP {cp}</p>
              <p className="sl-muted mt-1 text-[10px] font-bold">Dotknij avatara, aby zobaczyć sylwetkę.</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="sl-button-secondary grid h-11 w-11 shrink-0 place-items-center rounded-2xl text-xl active:scale-95" aria-label="Zamknij profil">
            ×
          </button>
        </div>

        <div className="mt-4 grid grid-cols-4 gap-2 rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-input)] p-1">
          {[
            ["stats", "Staty"],
            ["skills", "Skill"],
            ["equipment", "Ekw."],
            ["bag", `Plecak ${player.inventory.length}`],
          ].map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setView(id as typeof view)}
              className={`min-h-10 rounded-xl px-2 text-[10px] font-black uppercase tracking-widest active:scale-[0.98] ${
                view === id ? "sl-button-primary" : "sl-button-secondary"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {view === "stats" && (
          <div className="mt-4 grid grid-cols-2 gap-2">
            {Object.entries(player.stats).map(([stat, value]) => {
              const bonus = equipmentBonus[stat as keyof PlayerState["stats"]];
              return (
                <div key={stat} className="sl-input rounded-2xl p-3">
                  <div className="sl-muted text-[9px] font-black uppercase tracking-widest">{stat}</div>
                  <div className="mt-1 flex items-end justify-between gap-2">
                    <span className="text-lg font-black text-[var(--theme-text)]">{value + bonus}</span>
                    {bonus > 0 && <span className="font-mono text-[10px] font-black text-[var(--theme-success-text)]">+{bonus} eq</span>}
                  </div>
                </div>
              );
            })}
            <div className="sl-input col-span-2 rounded-2xl p-3">
              <div className="sl-muted text-[9px] font-black uppercase tracking-widest">Ekwipunek aktywny</div>
              <div className="mt-2 flex flex-wrap gap-2">
                {equippedItems.length ? equippedItems.map((item) => (
                  <span key={item.id} className="sl-chip rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-widest">
                    {getEquipmentTypeLabel(item)} +{item.bonusValue} {item.bonusType}
                  </span>
                )) : <span className="sl-muted text-xs">Brak założonych reliktów.</span>}
              </div>
            </div>
          </div>
        )}

        {view === "skills" && (
          <div className="sl-card mt-4 rounded-[22px] p-3">
            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-[var(--theme-accent)]">Umiejętności z treningu</h3>
            <div className="mt-3 grid gap-2">
              {abilityRows.map((ability) => (
                <div key={ability.name} className="sl-input rounded-2xl p-3">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm font-black uppercase tracking-widest text-[var(--theme-text)]">{ability.name}</span>
                    <span className="sl-chip-active rounded-full px-2.5 py-1 font-mono text-[10px] font-black">Lv.{ability.level}</span>
                  </div>
                  <p className="sl-muted mt-1 text-xs">{ability.description}</p>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[var(--theme-progress-track)]">
                    <div className="h-full rounded-full bg-[var(--theme-accent)]" style={{ width: `${ability.progress}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {view === "equipment" && (
          <div className="mt-4 grid grid-cols-3 gap-2">
            {EQUIPMENT_SLOT_DEFINITIONS.map((slot) => (
              <ProfileEquipmentSlot
                key={slot.id}
                slot={slot.id}
                item={player.equipment[slot.id]}
                active={focusedSlot === slot.id}
                onSelect={() => {
                  setFocusedSlot(slot.id);
                  setView("bag");
                }}
                onUnequip={() => unequipItem(slot.id)}
              />
            ))}
          </div>
        )}

        {view === "bag" && (
          <div className="mt-4 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-black uppercase tracking-widest text-[var(--theme-text)]">Plecak</h3>
                <p className="sl-muted mt-1 text-xs">
                  {focusedSlot ? `Filtr: ${getEquipmentSlotLabel(focusedSlot)}` : "Wybierz przedmiot i przypisz go do slotu."}
                </p>
              </div>
              {focusedSlot && (
                <button type="button" onClick={() => setFocusedSlot(null)} className="sl-button-secondary rounded-xl px-3 py-2 text-[10px] font-black uppercase tracking-widest">
                  Wszystkie
                </button>
              )}
            </div>
            {visibleInventory.length ? (
              <div className="grid gap-2">
                {visibleInventory.map((item) => (
                  <ProfileInventoryItem
                    key={item.id}
                    item={item}
                    focusedSlot={focusedSlot}
                    onEquip={equipItem}
                    onSell={sellItem}
                  />
                ))}
              </div>
            ) : (
              <div className="sl-input rounded-2xl p-5 text-center text-sm sl-muted">Brak przedmiotów dla tego slotu.</div>
            )}
          </div>
        )}

        <AnimatePresence>
          {avatarPreviewOpen && (
            <HunterAvatarEquipmentPreview
              player={player}
              cp={cp}
              onClose={() => setAvatarPreviewOpen(false)}
            />
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}

function HunterAvatarEquipmentPreview({
  player,
  cp,
  onClose,
}: {
  player: PlayerState;
  cp: number;
  onClose: () => void;
}) {
  const leftSlots: EquipmentSlotId[] = ["helmet", "weapon", "gloves", "ring1", "artifact"];
  const rightSlots: EquipmentSlotId[] = ["armor", "boots", "ring2", "necklace"];
  const equippedCount = EQUIPMENT_SLOT_DEFINITIONS.filter((slot) => player.equipment[slot.id]).length;

  return (
    <motion.div
      className="fixed inset-0 z-[970] grid place-items-center bg-[color-mix(in_srgb,var(--theme-bg)_78%,transparent)] p-3 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Podgląd sylwetki łowcy"
    >
      <motion.div
        className="sl-modal w-full max-w-[620px] overflow-hidden rounded-[30px] border p-4 shadow-[0_0_48px_color-mix(in_srgb,var(--theme-accent)_22%,transparent)]"
        initial={{ y: 18, scale: 0.97 }}
        animate={{ y: 0, scale: 1 }}
        exit={{ y: 14, scale: 0.98 }}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="sl-kicker text-[10px] font-black uppercase tracking-[0.28em]">Sylwetka łowcy</p>
            <h3 className="mt-1 truncate text-2xl font-black uppercase tracking-[0.06em] text-[var(--theme-text-strong)]">{player.name}</h3>
            <p className="sl-muted mt-1 font-mono text-[10px] font-black uppercase tracking-widest">
              Lv.{player.level} · {player.rank} · CP {cp} · Ekw. {equippedCount}/{EQUIPMENT_SLOT_DEFINITIONS.length}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="sl-button-secondary grid h-11 w-11 shrink-0 place-items-center rounded-2xl active:scale-95"
            aria-label="Zamknij podgląd sylwetki"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-4 grid grid-cols-[minmax(78px,0.82fr)_minmax(150px,1.2fr)_minmax(78px,0.82fr)] gap-2 sm:gap-3">
          <div className="grid content-center gap-2">
            {leftSlots.map((slot) => (
              <AvatarEquipmentSideSlot key={slot} slot={slot} item={player.equipment[slot]} side="left" />
            ))}
          </div>

          <div className="relative min-h-[360px] overflow-hidden rounded-[28px] border border-[var(--theme-border)] bg-[var(--theme-panel)] shadow-inner">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_18%,color-mix(in_srgb,var(--theme-accent)_24%,transparent),transparent_38%),linear-gradient(180deg,color-mix(in_srgb,var(--theme-panel)_50%,transparent),var(--theme-bg))]" />
            <div className="absolute inset-x-6 top-6 h-24 rounded-full bg-[color-mix(in_srgb,var(--theme-accent)_16%,transparent)] blur-3xl" />
            {player.avatarUrl && player.avatarUrl !== "fallback" ? (
              <img
                src={player.avatarUrl}
                alt=""
                className="relative z-10 h-full min-h-[360px] w-full object-cover object-top"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="relative z-10 grid min-h-[360px] place-items-center text-6xl font-black text-[var(--theme-muted)]">?</div>
            )}
            <div className="absolute inset-x-0 bottom-0 z-20 bg-gradient-to-t from-[color-mix(in_srgb,var(--theme-bg)_92%,transparent)] via-[color-mix(in_srgb,var(--theme-bg)_54%,transparent)] to-transparent p-4 pt-16 text-center">
              <p className="font-mono text-[10px] font-black uppercase tracking-[0.28em] text-[var(--theme-accent)]">Profil bojowy</p>
              <p className="mt-1 text-xl font-black uppercase tracking-[0.08em] text-[var(--theme-text-strong)]">{player.rank}</p>
            </div>
          </div>

          <div className="grid content-center gap-2">
            {rightSlots.map((slot) => (
              <AvatarEquipmentSideSlot key={slot} slot={slot} item={player.equipment[slot]} side="right" />
            ))}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

function AvatarEquipmentSideSlot({
  slot,
  item,
  side,
}: {
  key?: React.Key;
  slot: EquipmentSlotId;
  item: Equipment | null;
  side: "left" | "right";
}) {
  const rarity = item?.rarity || "common";

  return (
    <div className={`min-h-[64px] rounded-2xl border p-2 ${item ? EQUIPMENT_RARITY_CLASSES[rarity] : "border-[var(--theme-border)] bg-[var(--theme-input)] text-[var(--theme-muted)]"}`}>
      <div className={`flex items-center gap-2 ${side === "right" ? "flex-row-reverse text-right" : ""}`}>
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-current/20 bg-[var(--theme-input)] text-[var(--theme-accent)]">
          {item ? (
            <img src={getItemModelSrc(item)} alt="" className="h-8 w-8 object-contain drop-shadow-[0_0_10px_color-mix(in_srgb,var(--theme-accent)_26%,transparent)]" />
          ) : (
            getProfileSlotIcon(slot)
          )}
        </span>
        <span className="min-w-0">
          <span className="block truncate font-mono text-[8px] font-black uppercase tracking-widest opacity-80">{getEquipmentSlotLabel(slot)}</span>
          <span className="mt-0.5 block truncate text-[10px] font-black uppercase tracking-wide">
            {item ? item.name : "Pusty"}
          </span>
          {item && (
            <span className="mt-0.5 block truncate font-mono text-[8px] font-black uppercase tracking-widest opacity-80">
              +{item.bonusValue} {item.bonusType}
            </span>
          )}
        </span>
      </div>
    </div>
  );
}

function ProfileEquipmentSlot({
  slot,
  item,
  active,
  onSelect,
  onUnequip,
}: {
  key?: React.Key;
  slot: EquipmentSlotId;
  item: Equipment | null;
  active: boolean;
  onSelect: () => void;
  onUnequip: () => void;
}) {
  const rarity = item?.rarity || "common";
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`min-h-[118px] rounded-2xl border p-2 text-left active:scale-[0.99] ${item ? EQUIPMENT_RARITY_CLASSES[rarity] : "border-[var(--theme-border)] bg-[var(--theme-input)] text-[var(--theme-muted)]"} ${active ? "ring-1 ring-[var(--theme-focus)]" : ""}`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="font-mono text-[8px] font-black uppercase tracking-widest">{getEquipmentSlotLabel(slot)}</span>
        <span className="text-[var(--theme-accent)]">{getProfileSlotIcon(slot)}</span>
      </div>
      {item ? (
        <>
          <img src={getItemModelSrc(item)} alt="" className="mx-auto mt-2 h-12 w-12 object-contain drop-shadow-[0_0_12px_rgba(34,211,238,0.24)]" />
          <p className="mt-1 line-clamp-2 text-[10px] font-black uppercase tracking-wide">{item.name}</p>
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onUnequip();
            }}
            className="mt-2 w-full rounded-xl border border-[color-mix(in_srgb,var(--theme-danger)_38%,transparent)] bg-[var(--theme-danger-soft)] py-1 text-[9px] font-black uppercase tracking-widest text-[var(--theme-danger-text)]"
          >
            Zdejmij
          </button>
        </>
      ) : (
        <div className="mt-5 text-center text-[10px] font-black uppercase tracking-widest opacity-65">Pusty slot</div>
      )}
    </button>
  );
}

function ProfileInventoryItem({
  item,
  focusedSlot,
  onEquip,
  onSell,
}: {
  key?: React.Key;
  item: Equipment;
  focusedSlot: EquipmentSlotId | null;
  onEquip: (item: Equipment, slot?: EquipmentSlotId) => void;
  onSell: (item: Equipment) => void;
}) {
  const rarity = item.rarity || "common";
  const slots = getCompatibleSlots(item);
  const visibleSlots = focusedSlot && slots.includes(focusedSlot) ? [focusedSlot] : slots;
  const perkLabel = getEquipmentPerkLabel(item);

  return (
    <div className={`rounded-2xl border p-3 ${EQUIPMENT_RARITY_CLASSES[rarity]}`}>
      <div className="grid grid-cols-[56px_minmax(0,1fr)] gap-3">
        <div className="grid h-14 w-14 place-items-center rounded-xl border border-current/20 bg-[var(--theme-input)]">
          <img src={getItemModelSrc(item)} alt="" className="h-12 w-12 object-contain" />
        </div>
        <div className="min-w-0">
          <div className="flex items-center justify-between gap-2">
            <span className="font-mono text-[9px] font-black uppercase tracking-widest opacity-70">{EQUIPMENT_RARITY_LABELS[rarity]}</span>
            <span className="font-mono text-[9px] font-black uppercase tracking-widest opacity-70">{getEquipmentTypeLabel(item)}</span>
          </div>
          <h4 className="mt-1 truncate text-sm font-black uppercase tracking-wide">{item.name}</h4>
          <p className="mt-1 font-mono text-[10px] font-black uppercase tracking-widest">+{item.bonusValue} {item.bonusType} · {item.durability}/{item.maxDurability}</p>
          {perkLabel && (
            <p className="mt-1 rounded-lg border border-[color-mix(in_srgb,var(--theme-accent)_34%,transparent)] bg-[var(--theme-accent-soft)] px-2 py-1 font-mono text-[9px] font-black uppercase tracking-widest text-[var(--theme-accent-text)]">
              Bonus gry: {perkLabel}
            </p>
          )}
        </div>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2">
        {visibleSlots.slice(0, 2).map((slot) => (
          <button key={slot} type="button" onClick={() => onEquip(item, slot)} className="sl-button-primary min-h-10 rounded-xl px-2 text-[10px] font-black uppercase tracking-widest">
            Załóż: {getEquipmentSlotLabel(slot)}
          </button>
        ))}
        <button type="button" onClick={() => onSell(item)} className="sl-button-secondary min-h-10 rounded-xl px-2 text-[10px] font-black uppercase tracking-widest">
          Sprzedaj {getItemSellPrice(item)}G
        </button>
      </div>
    </div>
  );
}

function getProfileSlotIcon(slot: EquipmentSlotId) {
  const className = "h-4 w-4";
  switch (slot) {
    case "weapon":
      return <Sword className={className} />;
    case "helmet":
      return <Crown className={className} />;
    case "armor":
      return <Shield className={className} />;
    case "gloves":
      return <Hand className={className} />;
    case "boots":
      return <Footprints className={className} />;
    case "ring1":
    case "ring2":
      return <CircleDot className={className} />;
    default:
      return <Gem className={className} />;
  }
}

async function resizeMiniGameBackgroundFile(file: File): Promise<string> {
  const source = await readFileAsDataUrl(file);
  const image = await loadImage(source);
  const maxSide = 1280;
  const scale = Math.min(1, maxSide / Math.max(image.width, image.height));
  const width = Math.max(1, Math.round(image.width * scale));
  const height = Math.max(1, Math.round(image.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) return source;
  context.drawImage(image, 0, 0, width, height);
  return canvas.toDataURL("image/jpeg", 0.78);
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Nie można odczytać obrazu."));
    image.src = src;
  });
}

function StatusPanel({
  player,
  progress,
  bonusUnlocked,
  onStartTraining,
  onOpenBonus,
}: {
  player: PlayerState;
  progress: { percent: number; completedCount: number; totalCount: number };
  bonusUnlocked: boolean;
  onStartTraining: () => void;
  onOpenBonus: () => void;
}) {
  const completed = Boolean(player.dailyQuest.completedAt);

  return (
    <div className="sl-section rounded-[22px] p-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="sl-muted text-[10px] font-black uppercase tracking-[0.28em]">Dzisiejszy cel</p>
          <h2 className="mt-1 text-xl font-black uppercase tracking-[0.06em] text-[var(--theme-text-strong)]">{completed ? "Quest ukończony" : "Quest aktywny"}</h2>
          {completed || player.dailyQuest.penaltyGiven ? (
            <p className="sl-muted mt-2 text-sm leading-relaxed">
              {completed ? "Nagroda odebrana. Bonusowa brama jest gotowa." : "Wczoraj pominięto trening. Dokończ dzisiejszy quest, żeby wrócić do rytmu."}
            </p>
          ) : null}
        </div>
        <ProgressOrb value={progress.percent} />
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2">
        <MiniStat icon={<Trophy className="h-4 w-4" />} label="Streak" value={`${player.dailyQuest.streak || 0} dni`} />
        <MiniStat icon={<Shield className="h-4 w-4" />} label="HP" value={`${Math.floor(player.hp)}/${Math.floor(player.maxHp)}`} />
        <MiniStat icon={<Battery className="h-4 w-4" />} label="Gold" value={player.gold} />
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <button type="button" onClick={onStartTraining} className="sl-button-primary min-h-12 rounded-2xl px-4 py-3 text-sm font-black uppercase tracking-widest active:scale-[0.98]">
          Trening
        </button>
        <button
          type="button"
          onClick={onOpenBonus}
          disabled={!bonusUnlocked}
          className="sl-button-secondary min-h-12 rounded-2xl px-4 py-3 text-sm font-black uppercase tracking-widest disabled:opacity-45 active:scale-[0.98]"
        >
          Gra
        </button>
      </div>
    </div>
  );
}

function PenaltyBanner({ penalty, onPerform }: { penalty: DailyPenalty; onPerform: () => void }) {
  const amountLabel = penalty.exerciseId === "plank" || penalty.exerciseId === "wall-sit" ? "sek." : "powt.";

  return (
    <div className="sl-alert-danger mb-3 w-full rounded-[20px] p-3 text-left active:scale-[0.99]">
      <div className="flex items-center gap-3">
        <div className="sl-alert-icon grid h-10 w-10 shrink-0 place-items-center rounded-2xl border border-current/25 bg-[color-mix(in_srgb,var(--theme-danger)_12%,transparent)]">
          <AlertTriangle className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[9px] font-black uppercase tracking-[0.22em] text-[var(--theme-danger-text)]">Kara systemu · ćwiczenie</p>
          <h3 className="truncate text-sm font-black uppercase tracking-[0.04em] text-[var(--theme-text-strong)]">{penalty.exerciseName}</h3>
          <p className="truncate text-[11px] font-bold text-[var(--theme-muted)]">
            {penalty.requiredAmount} {amountLabel} · quest {penalty.missedDateKey}
          </p>
        </div>
        <button
          type="button"
          onClick={onPerform}
          className="shrink-0 rounded-2xl border border-[color-mix(in_srgb,var(--theme-danger)_38%,transparent)] bg-[color-mix(in_srgb,var(--theme-danger)_14%,transparent)] px-3 py-2 text-[10px] font-black uppercase tracking-widest text-[var(--theme-danger-text)] active:scale-[0.98]"
        >
          Kara
        </button>
      </div>
    </div>
  );
}

function PenaltyExerciseModal({
  penalty,
  openedAt,
  message,
  onClose,
  onTooFast,
  onComplete,
}: {
  penalty: DailyPenalty;
  openedAt: number;
  message: string | null;
  onClose: () => void;
  onTooFast: () => void;
  onComplete: () => void;
}) {
  const isTimed = penalty.exerciseId === "plank" || penalty.exerciseId === "wall-sit";
  const minSeconds = isTimed
    ? Math.min(70, Math.max(25, Math.floor(penalty.requiredAmount * 0.45)))
    : Math.min(70, Math.max(25, Math.floor(penalty.requiredAmount * 0.55)));
  const [elapsed, setElapsed] = useState(() => Math.floor((Date.now() - openedAt) / 1000));

  useEffect(() => {
    const timer = window.setInterval(() => setElapsed(Math.floor((Date.now() - openedAt) / 1000)), 500);
    return () => window.clearInterval(timer);
  }, [openedAt]);

  const remaining = Math.max(0, minSeconds - elapsed);

  return (
    <motion.div
      className="sl-modal-backdrop fixed inset-0 z-[960] grid place-items-end p-3 text-[var(--theme-text)] sm:place-items-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      role="dialog"
      aria-modal="true"
    >
      <motion.div
        className="sl-modal w-full max-w-[520px] rounded-[28px] border p-4 shadow-[0_0_42px_color-mix(in_srgb,var(--theme-danger)_16%,transparent)]"
        initial={{ y: 28, scale: 0.98 }}
        animate={{ y: 0, scale: 1 }}
        exit={{ y: 18, scale: 0.98 }}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="font-mono text-[10px] font-black uppercase tracking-[0.28em] text-[var(--theme-danger-text)]">Ćwiczenie karne</p>
            <h2 className="mt-1 text-2xl font-black uppercase tracking-[0.06em] text-[var(--theme-text-strong)]">{penalty.exerciseName}</h2>
            <p className="sl-muted mt-2 text-sm leading-relaxed">{penalty.exerciseDescription}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="sl-icon-button grid h-10 w-10 shrink-0 place-items-center rounded-2xl active:scale-95"
            aria-label="Zamknij karę"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2">
          <MiniStat
            icon={<Dumbbell className="h-4 w-4" />}
            label={isTimed ? "Czas" : "Powtórzenia"}
            value={`${penalty.requiredAmount}${isTimed ? " s" : ""}`}
          />
          <MiniStat icon={<Clock3 className="h-4 w-4" />} label="Minimum" value={remaining > 0 ? `${remaining}s` : "Gotowe"} />
        </div>

        {message && (
          <div className="sl-alert-warning mt-3 rounded-2xl px-3 py-2 text-sm font-bold text-[var(--theme-warning-text)]">
            {message}
          </div>
        )}

        <div className="mt-4 grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={onClose}
            className="sl-button-secondary min-h-12 rounded-2xl px-4 text-xs font-black uppercase tracking-widest active:scale-[0.98]"
          >
            Wróć do katalogu
          </button>
          <button
            type="button"
            onClick={() => {
              if (remaining > 0) {
                onTooFast();
                return;
              }
              onComplete();
            }}
            className="min-h-12 rounded-2xl border border-[color-mix(in_srgb,var(--theme-danger)_38%,transparent)] bg-[color-mix(in_srgb,var(--theme-danger)_14%,transparent)] px-4 text-xs font-black uppercase tracking-widest text-[var(--theme-danger-text)] active:scale-[0.98]"
          >
            Zrobione
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

function DailyQuestEditorModal({
  player,
  onClose,
  onUpdateItems,
}: {
  player: PlayerState;
  onClose: () => void;
  onUpdateItems: (items: DailyQuestItem[]) => void;
}) {
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);
  const items = player.dailyQuest.items;
  const plannedCatalogIds = new Set(items.map((item) => item.catalogExerciseId).filter(Boolean));
  const searchResults = useMemo(
    () => searchExercises(EXERCISE_CATALOG, deferredQuery, { limit: deferredQuery.trim() ? 6 : 4 }),
    [deferredQuery],
  );

  const updateItem = (itemId: string, patch: Partial<DailyQuestItem>) => {
    onUpdateItems(items.map((item) => item.id === itemId ? { ...item, ...patch } : item));
  };

  const moveItem = (itemId: string, direction: -1 | 1) => {
    const index = items.findIndex((item) => item.id === itemId);
    const targetIndex = index + direction;
    if (index < 0 || targetIndex < 0 || targetIndex >= items.length) return;
    const next = [...items];
    const [item] = next.splice(index, 1);
    next.splice(targetIndex, 0, item);
    onUpdateItems(next);
  };

  const removeItem = (itemId: string) => {
    if (items.length <= 1) return;
    onUpdateItems(items.filter((item) => item.id !== itemId));
  };

  const addFromCatalog = (exercise: ExerciseCatalogEntry) => {
    if (plannedCatalogIds.has(exercise.id)) return;
    onUpdateItems([...items, createDailyQuestItemFromCatalog(exercise, items)]);
    setQuery("");
  };

  return (
    <motion.div
      className="sl-modal-backdrop fixed inset-0 z-[955] grid place-items-end p-3 text-[var(--theme-text)] sm:place-items-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      role="dialog"
      aria-modal="true"
    >
      <motion.div
        className="sl-modal flex max-h-[88dvh] w-full max-w-[560px] flex-col overflow-hidden rounded-[28px] border shadow-[0_0_44px_color-mix(in_srgb,var(--theme-accent)_18%,transparent)]"
        initial={{ y: 26, scale: 0.98 }}
        animate={{ y: 0, scale: 1 }}
        exit={{ y: 18, scale: 0.98 }}
      >
        <div className="flex items-start justify-between gap-3 border-b border-[var(--theme-border)] p-4">
          <div>
            <p className="sl-kicker text-[10px] font-black uppercase tracking-[0.28em]">Daily custom</p>
            <h2 className="mt-1 text-2xl font-black uppercase tracking-[0.06em] text-[var(--theme-text-strong)]">Szablon dnia</h2>
          </div>
          <button type="button" onClick={onClose} className="sl-icon-button grid h-11 w-11 shrink-0 place-items-center rounded-2xl active:scale-95" aria-label="Zamknij edytor daily">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-4 custom-scrollbar">
          <div className="grid gap-3">
            {items.map((item, index) => (
              <div key={item.id} className="sl-card rounded-[22px] p-3">
                <div className="flex items-start justify-between gap-3">
                  <label className="min-w-0 flex-1">
                    <span className="sl-muted text-[9px] font-black uppercase tracking-widest">Nazwa</span>
                    <input
                      value={item.label}
                      onChange={(event) => updateItem(item.id, { label: event.target.value })}
                      className="mt-1 w-full bg-transparent text-base font-black text-[var(--theme-text-strong)] outline-none"
                    />
                  </label>
                  <div className="flex gap-1">
                    <button type="button" onClick={() => moveItem(item.id, -1)} disabled={index === 0} className="sl-icon-button grid h-9 w-9 place-items-center rounded-xl disabled:opacity-35" aria-label="Przesuń wyżej">
                      <ChevronDown className="h-4 w-4 rotate-180" />
                    </button>
                    <button type="button" onClick={() => moveItem(item.id, 1)} disabled={index === items.length - 1} className="sl-icon-button grid h-9 w-9 place-items-center rounded-xl disabled:opacity-35" aria-label="Przesuń niżej">
                      <ChevronDown className="h-4 w-4" />
                    </button>
                    <button type="button" onClick={() => removeItem(item.id)} disabled={items.length <= 1} className="grid h-9 w-9 place-items-center rounded-xl border border-[color-mix(in_srgb,var(--theme-danger)_34%,transparent)] bg-[var(--theme-danger-soft)] text-[var(--theme-danger-text)] disabled:opacity-35" aria-label="Usuń zadanie">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="mt-3 grid gap-2">
                  <DailyEditorNumber label="Cel" value={item.target} min={1} max={10000} onChange={(target) => updateItem(item.id, { target })} />
                  <DailyAutoAssignment item={item} />
                </div>
              </div>
            ))}
          </div>

          <div className="sl-card mt-4 rounded-[22px] p-3">
            <p className="sl-kicker text-[10px] font-black uppercase tracking-[0.24em]">Dodaj z katalogu</p>
            <label className="sl-input mt-3 flex min-h-12 items-center gap-2 rounded-2xl px-3">
              <Search className="h-4 w-4 text-[var(--theme-muted)]" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Szukaj: brzuch, klata, bez sprzętu..."
                className="min-w-0 flex-1 bg-transparent text-sm font-bold text-[var(--theme-text)] outline-none placeholder:text-[var(--theme-muted)]"
              />
            </label>
            <div className="mt-3 grid gap-2">
              {searchResults.map(({ exercise }) => {
                const planned = plannedCatalogIds.has(exercise.id);
                return (
                  <button
                    key={exercise.id}
                    type="button"
                    disabled={planned}
                    onClick={() => addFromCatalog(exercise)}
                    className="sl-input flex min-h-12 items-center justify-between gap-3 rounded-2xl px-3 text-left active:scale-[0.99] disabled:opacity-70"
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-black text-[var(--theme-text-strong)]">{exercise.name}</span>
                      <span className="sl-muted block truncate text-[10px] font-black uppercase tracking-widest">{exercise.category}</span>
                    </span>
                    <span className={planned ? "sl-chip rounded-xl px-3 py-2 text-[10px] font-black uppercase tracking-widest" : "sl-button-primary shrink-0 rounded-xl px-3 py-2 text-[10px] font-black uppercase tracking-widest"}>
                      {planned ? "Dodane" : "Dodaj"}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

function DailyEditorNumber({
  label,
  value,
  min,
  max,
  step = 1,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (value: number) => void;
}) {
  return (
    <label className="sl-input rounded-2xl p-3">
      <span className="sl-muted text-[9px] font-black uppercase tracking-widest">{label}</span>
      <input
        type="number"
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={(event) => onChange(Number(event.target.value))}
        className="mt-2 w-full bg-transparent text-sm font-black text-[var(--theme-text)] outline-none"
      />
    </label>
  );
}

const DAILY_STAT_LABELS: Record<DailyQuestItem["stat"], string> = {
  STR: "Siła",
  VITALITY: "Wytrzymałość",
  AGILITY: "Zwinność",
  INTELLIGENCE: "Technika",
  SENSE: "Refleks",
};

function DailyAutoAssignment({ item }: { item: DailyQuestItem }) {
  const assignment = deriveDailyQuestItemFields(item);

  return (
    <div className="sl-input rounded-2xl p-3">
      <p className="sl-muted text-[9px] font-black uppercase tracking-widest">System przypisał automatycznie</p>
      <div className="mt-2 flex flex-wrap gap-2">
        <span className="sl-chip rounded-xl px-3 py-2 text-[10px] font-black uppercase tracking-widest">
          {assignment.unit}
        </span>
        <span className="sl-chip rounded-xl px-3 py-2 text-[10px] font-black uppercase tracking-widest">
          +{assignment.manualSmall} / +{assignment.manualLarge}
        </span>
        <span className="sl-chip-active rounded-xl px-3 py-2 text-[10px] font-black uppercase tracking-widest">
          {DAILY_STAT_LABELS[assignment.stat]}
        </span>
      </div>
      <p className="sl-muted mt-2 text-xs leading-relaxed">
        Powtórzenia są domyślne dla ćwiczeń. Kilometry pojawiają się tylko przy pozycjach powiązanych z bieganiem.
      </p>
    </div>
  );
}

function TodayPreview({
  player,
  items,
  resetCountdown,
  onAdd,
  onTrack,
  onEdit,
}: {
  player: PlayerState;
  items: DailyQuestItem[];
  resetCountdown: string;
  onAdd: (itemId: string, amount: number) => void;
  onTrack: (item: DailyQuestItem) => void;
  onEdit: () => void;
}) {
  const visibleExercises = getIncompleteDailyQuestItems(player.dailyQuest);

  return (
    <div className="sl-section rounded-[22px] p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <p className="sl-kicker text-[10px] font-black uppercase tracking-[0.24em]">Daily</p>
          <p className="sl-muted mt-1 text-xs font-bold">{items.length} aktywne zadania</p>
        </div>
        <button type="button" onClick={onEdit} className="sl-button-secondary rounded-xl px-3 py-2 text-[10px] font-black uppercase tracking-widest">
          Edytuj
        </button>
      </div>
      {visibleExercises.length === 0 ? (
        <DailyCompleteCard resetCountdown={resetCountdown} compact />
      ) : (
        <div className="space-y-3">
          {visibleExercises.map((exercise) => {
          const current = getDailyQuestItemProgress(player.dailyQuest, exercise.id);
          const percent = Math.min(100, (current / exercise.target) * 100);
          return (
            <div key={exercise.id} className="sl-stat-tile rounded-2xl p-3">
              <div className="mb-2 flex items-center justify-between gap-3">
                <span className="text-sm font-bold text-[var(--theme-text)]">{exercise.label}</span>
                <span className="font-mono text-xs text-[var(--theme-muted)]">{formatValue(current, exercise)} / {exercise.target}</span>
              </div>
              <Meter value={percent} label={exercise.label} color="cyan" compact />
              <div className="mt-3 grid grid-cols-3 gap-2">
                <SmallButton onClick={() => onAdd(exercise.id, exercise.manualSmall)} icon={<Plus className="h-3.5 w-3.5" />} label={`+${exercise.manualSmall}`} />
                <SmallButton onClick={() => onAdd(exercise.id, exercise.manualLarge)} icon={<Plus className="h-3.5 w-3.5" />} label={`+${exercise.manualLarge}`} />
                <SmallButton
                  onClick={() => {
                    if (exercise.trackableExerciseId) {
                      onTrack(exercise);
                      return;
                    }
                    onAdd(exercise.id, exercise.manualSmall);
                  }}
                  icon={exercise.trackableExerciseId ? <Smartphone className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
                  label={exercise.trackableExerciseId ? "Sensor" : `+${exercise.manualSmall}`}
                  muted={false}
                />
              </div>
            </div>
          );
          })}
        </div>
      )}
    </div>
  );
}

function DailyQuestToolbar({ completedCount, totalCount, onEdit }: { completedCount: number; totalCount: number; onEdit: () => void }) {
  return (
    <div className="sl-card flex items-center justify-between gap-3 rounded-[22px] p-3">
      <div>
        <p className="sl-kicker text-[10px] font-black uppercase tracking-[0.24em]">Szablon dzienny</p>
        <p className="sl-muted mt-1 text-xs font-bold">{completedCount}/{totalCount} zadań ukończonych</p>
      </div>
      <button type="button" onClick={onEdit} className="sl-button-primary min-h-10 rounded-xl px-3 text-[10px] font-black uppercase tracking-widest">
        Edytuj
      </button>
    </div>
  );
}

function DailyCompleteCard({ resetCountdown, compact = false }: { resetCountdown: string; compact?: boolean }) {
  return (
    <div className={`sl-alert-success relative overflow-hidden rounded-[22px] text-center ${compact ? "p-4" : "p-6"}`}>
      <img src={MOBILE_THEME_ASSETS.hub.trainingArena} alt="" className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-[0.14] mix-blend-screen" />
      <div className="pointer-events-none absolute inset-0 bg-[color-mix(in_srgb,var(--theme-success)_18%,var(--theme-card))]" />
      <div className="relative mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-current/25 bg-[color-mix(in_srgb,var(--theme-success)_16%,transparent)] text-[var(--theme-success-text)]">
        <CheckCircle2 className="h-8 w-8" />
      </div>
      <h3 className="relative mt-4 text-xl font-black uppercase tracking-[0.08em] text-[var(--theme-text-strong)]">Dzisiejszy cel osiągnięty</h3>
      <p className="relative mt-2 text-sm leading-relaxed text-[var(--theme-muted)]">
        Wszystkie zadania dzienne zostały wykonane. System przygotuje nowy zestaw po resecie dnia.
      </p>
      <div className="sl-stat-tile relative mt-4 inline-flex items-center gap-2 rounded-2xl px-4 py-3 font-mono text-sm font-black uppercase tracking-widest">
        <Clock3 className="h-4 w-4" />
        Reset za {resetCountdown}
      </div>
    </div>
  );
}

function DailyQuestReminder({
  enabled,
  mode,
  progress,
  completedCount,
  totalCount,
  resetCountdown,
  onOpenTraining,
}: {
  enabled: boolean;
  mode: DailyReminderMode;
  progress: number;
  completedCount: number;
  totalCount: number;
  resetCountdown: string;
  onOpenTraining: () => void;
}) {
  if (!enabled || mode === "hidden") return null;
  const expanded = mode === "expanded";

  return (
    <AnimatePresence>
      {expanded ? (
        <motion.button
          type="button"
          onClick={onOpenTraining}
          initial={{ opacity: 0, y: 18, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 14, scale: 0.96 }}
          transition={{ duration: 0.22 }}
          style={{ bottom: "calc(max(env(safe-area-inset-bottom), 0.75rem) + 5.25rem)" }}
          className="sl-alert-warning absolute right-4 z-30 w-[min(20rem,calc(100%-2rem))] overflow-hidden rounded-[20px] p-3 text-left shadow-[0_0_20px_color-mix(in_srgb,var(--theme-warning)_14%,transparent)] active:scale-[0.99]"
        >
          <img src={MOBILE_THEME_ASSETS.hub.dungeonGate} alt="" className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-[0.12] mix-blend-screen" />
          <div className="pointer-events-none absolute inset-0 bg-[color-mix(in_srgb,var(--theme-warning)_10%,var(--theme-card))]" />
          <div className="relative flex items-center gap-3">
            <div className="sl-alert-icon grid h-10 w-10 shrink-0 place-items-center rounded-2xl border border-current/25 bg-[color-mix(in_srgb,var(--theme-warning)_14%,transparent)] shadow-[0_0_14px_color-mix(in_srgb,var(--theme-warning)_14%,transparent)]">
              <BellRing className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-3">
                <p className="text-[10px] font-black uppercase tracking-[0.24em] text-[var(--theme-warning-text)]">Przypomnienie</p>
                <span className="sl-stat-tile rounded-full px-2.5 py-1 font-mono text-[10px] font-black">
                  {resetCountdown}
                </span>
              </div>
              <h3 className="mt-1 text-xs font-black uppercase tracking-[0.08em] text-[var(--theme-text-strong)]">Cel dzienny nieukończony</h3>
              <p className="mt-1 text-[11px] leading-relaxed text-[var(--theme-muted)]">
                {completedCount}/{totalCount} · {Math.floor(progress)}%. Dotknij, żeby wrócić.
              </p>
            </div>
          </div>
        </motion.button>
      ) : (
        <motion.button
          type="button"
          onClick={onOpenTraining}
          initial={{ opacity: 0, y: 10, scale: 0.92 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 10, scale: 0.92 }}
          transition={{ duration: 0.18 }}
          style={{ bottom: "calc(max(env(safe-area-inset-bottom), 0.75rem) + 5.35rem)" }}
          className="sl-alert-warning absolute right-4 z-30 flex min-h-10 items-center gap-1.5 rounded-2xl px-2 py-1.5 text-left shadow-[0_0_14px_color-mix(in_srgb,var(--theme-warning)_12%,transparent)] active:scale-[0.98]"
          aria-label="Cel dzienny nieukończony"
        >
          <span className="relative grid h-7 w-7 place-items-center rounded-xl bg-[var(--theme-warning)] text-[var(--theme-text-inverse)]">
            <AlertTriangle className="h-4 w-4" />
            <span className="absolute -right-1 -top-1 grid h-4 w-4 place-items-center rounded-full bg-[var(--theme-danger)] text-[var(--theme-danger-text)] text-[10px] font-black">!</span>
          </span>
          <span className="font-mono text-[9px] font-black uppercase tracking-widest text-[var(--theme-warning-text)]">
            {resetCountdown}
          </span>
        </motion.button>
      )}
    </AnimatePresence>
  );
}

function WorkoutCard({
  exercise,
  player,
  onAdd,
  onTrack,
}: {
  exercise: DailyQuestItem;
  player: PlayerState;
  onAdd: (itemId: string, amount: number) => void;
  onTrack: () => void;
}) {
  const current = getDailyQuestItemProgress(player.dailyQuest, exercise.id);
  const profile = exercise.trackableExerciseId ? MOTION_TRACKER_PROFILES[exercise.trackableExerciseId] : null;
  const percent = Math.min(100, (current / exercise.target) * 100);
  const complete = current >= exercise.target;
  const abilityLevel = exercise.trackableExerciseId ? getDailyExerciseAbilityLevel(player, exercise.trackableExerciseId) : 0;

  return (
    <div className={`rounded-[22px] p-4 ${complete ? "sl-alert-success" : "sl-card"}`}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="sl-muted text-[10px] font-black uppercase tracking-[0.24em]">
            {exercise.unit} · {exercise.stat}{profile ? ` · skill Lv.${abilityLevel}` : " · manual"}
          </p>
          <h3 className="mt-1 text-xl font-black uppercase tracking-[0.04em] text-[var(--theme-text-strong)]">{exercise.label}</h3>
        </div>
        <div className="sl-chip-active rounded-full px-3 py-1 font-mono text-xs font-black">
          {formatValue(current, exercise)} / {exercise.target}
        </div>
      </div>

      <div className="mt-4">
        <Meter label="Postęp" value={percent} color={complete ? "green" : "blue"} right={`${Math.floor(percent)}%`} />
      </div>

      <div className="mt-4 grid grid-cols-[1fr_1fr_1.2fr] gap-2">
        <ActionButton onClick={() => onAdd(exercise.id, exercise.manualSmall)} icon={<Plus className="h-4 w-4" />} label={`+${exercise.manualSmall}`} />
        <ActionButton onClick={() => onAdd(exercise.id, exercise.manualLarge)} icon={<Plus className="h-4 w-4" />} label={`+${exercise.manualLarge}`} />
        {profile ? (
          <ActionButton onClick={onTrack} icon={<Activity className="h-4 w-4" />} label="Sensor" accent />
        ) : (
          <ActionButton onClick={() => onAdd(exercise.id, exercise.manualSmall)} icon={<Plus className="h-4 w-4" />} label="Manual" accent />
        )}
      </div>
    </div>
  );
}

function TrainingViewSwitch({ value, onChange }: { value: TrainingView; onChange: (value: TrainingView) => void }) {
  return (
    <div className="sl-input grid grid-cols-3 gap-2 rounded-[22px] p-2">
      <button
        type="button"
        onClick={() => onChange("quest")}
        className={`flex min-h-12 items-center justify-center gap-2 rounded-2xl px-2 text-[10px] font-black uppercase tracking-widest active:scale-[0.98] ${
          value === "quest" ? "sl-chip-active" : "sl-chip"
        }`}
      >
        <Target className="h-4 w-4" />
        Dzisiejszy
      </button>
      <button
        type="button"
        onClick={() => onChange("plan")}
        className={`flex min-h-12 items-center justify-center gap-2 rounded-2xl px-2 text-[10px] font-black uppercase tracking-widest active:scale-[0.98] ${
          value === "plan" ? "sl-chip-active" : "sl-chip"
        }`}
      >
        <Dumbbell className="h-4 w-4" />
        Plan
      </button>
      <button
        type="button"
        onClick={() => onChange("catalog")}
        className={`flex min-h-12 items-center justify-center gap-2 rounded-2xl px-2 text-[10px] font-black uppercase tracking-widest active:scale-[0.98] ${
          value === "catalog" ? "sl-chip-active" : "sl-chip"
        }`}
      >
        <BookOpen className="h-4 w-4" />
        Katalog
      </button>
    </div>
  );
}

function CatalogLoading() {
  return (
    <div className="sl-card rounded-[22px] p-5 text-center">
      <BookOpen className="mx-auto h-6 w-6 animate-pulse text-[var(--theme-icon)]" />
      <p className="sl-muted mt-3 text-xs font-black uppercase tracking-widest">Ladowanie katalogu wideo...</p>
    </div>
  );
}

function GameRuntimeLoading() {
  return (
    <div className="sl-app-root grid h-full w-full place-items-center bg-[var(--theme-bg)] p-5 text-[var(--theme-text)]">
      <div className="sl-modal w-[min(360px,calc(100vw-32px))] rounded-[24px] border p-5 text-center">
        <p className="sl-kicker text-[10px] font-black uppercase tracking-[0.28em]">Ładowanie symulacji</p>
        <p className="mt-2 text-sm font-bold text-[var(--theme-text)]">Silnik gry przygotowuje scenę i assety.</p>
      </div>
    </div>
  );
}

function SystemPanel({
  player,
  volume,
  systemAudioEnabled,
  musicVolume,
  backgroundMusicEnabled,
  musicTracks,
  musicTrackSettings,
  onVolumeChange,
  onToggleSystemAudio,
  onMusicVolumeChange,
  onToggleBackgroundMusic,
  onUpdateMusicTrackSettings,
  onRandomizeMusicTrack,
  onReset,
  onImportHealthDistance,
  onToggleMiniGamesUnlock,
  onUpdateNotificationSettings,
  onUpdatePenaltySettings,
  onUpdateSettings,
  onTriggerPenalty,
  onMarkPenaltyPrankApplied,
  onBuyTheme,
  onSelectTheme,
  onBuyThemeEffect,
  onSelectThemeEffect,
  onBuyThemeWallpaper,
  onSelectThemeWallpaper,
  onWearableSample,
  onDevResetDailyQuest,
  onDevCompleteDailyQuest,
  onDevAddGold,
  onDevClearPenalty,
  onDevResetMiniGames,
  onOpenWearableSensor,
  onCheckUpdate,
  onOpenWhatsNew,
}: {
  player: PlayerState;
  volume: number;
  systemAudioEnabled: boolean;
  musicVolume: number;
  backgroundMusicEnabled: boolean;
  musicTracks: LocalMusicTrack[];
  musicTrackSettings: MusicTrackSettings;
  onVolumeChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onToggleSystemAudio: (enabled: boolean) => void;
  onMusicVolumeChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onToggleBackgroundMusic: (enabled: boolean) => void;
  onUpdateMusicTrackSettings: (patch: Partial<MusicTrackSettings>) => void;
  onRandomizeMusicTrack: () => void;
  onReset: () => void;
  onImportHealthDistance: (km: number) => void;
  onToggleMiniGamesUnlock: (enabled: boolean) => void;
  onUpdateNotificationSettings: (patch: Partial<PlayerState["settings"]["notifications"]>) => void;
  onUpdatePenaltySettings: (patch: Partial<PlayerState["settings"]>) => void;
  onUpdateSettings: (patch: Partial<PlayerState["settings"]>) => void;
  onTriggerPenalty: () => void;
  onMarkPenaltyPrankApplied: (penaltyId: string, patch: { appliedWallpaper?: boolean; appliedFont?: boolean }) => void;
  onBuyTheme: (themeId: PlayerState["settings"]["themeId"]) => void;
  onSelectTheme: (themeId: PlayerState["settings"]["themeId"]) => void;
  onBuyThemeEffect: (effectId: ThemeEffectId) => void;
  onSelectThemeEffect: (effectId: ThemeEffectId) => void;
  onBuyThemeWallpaper: (wallpaperId: string) => void;
  onSelectThemeWallpaper: (wallpaperId: string) => void;
  onWearableSample: (sample: WearableSample) => void;
  onDevResetDailyQuest: () => void;
  onDevCompleteDailyQuest: () => void;
  onDevAddGold: (amount: number) => void;
  onDevClearPenalty: () => void;
  onDevResetMiniGames: () => void;
  onOpenWearableSensor: () => void;
  onCheckUpdate?: () => void;
  onOpenWhatsNew?: () => void;
  onOpenBackgroundPermissions?: () => void;
}) {


  const bluetoothAvailable = isWearableBluetoothAvailable();
  const nativeBluetooth = isNativeBluetoothAvailable();
  const lastWorkout = player.workoutHistory?.[player.workoutHistory.length - 1];
  const [healthStatus, setHealthStatus] = useState<HealthConnectStatus | null>(null);
  const [healthSummary, setHealthSummary] = useState<HealthConnectSummary | null>(null);
  const [healthBusy, setHealthBusy] = useState(false);
  const [healthMessage, setHealthMessage] = useState<string | null>(null);
  const [penaltyStatus, setPenaltyStatus] = useState<PenaltyPermissionStatus | null>(null);
  const [penaltyMessage, setPenaltyMessage] = useState<string | null>(null);
  const [penaltyBusy, setPenaltyBusy] = useState(false);
  const [notificationStatus, setNotificationStatus] = useState<HunterNotificationStatus | null>(null);
  const [scheduledNotifications, setScheduledNotifications] = useState<NativeScheduledNotification[]>([]);
  const [notificationMessage, setNotificationMessage] = useState<string | null>(null);
  const [notificationBusy, setNotificationBusy] = useState(false);
  const [performanceStatus, setPerformanceStatus] = useState<HunterPerformanceStatus | null>(null);
  const [activeSheet, setActiveSheet] = useState<"shop" | "appearance" | "audio" | "dev" | null>(null);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [advancedUnlocked, setAdvancedUnlocked] = useState(false);
  const [advancedCode, setAdvancedCode] = useState("");
  const [advancedError, setAdvancedError] = useState<string | null>(null);
  const [devGoldAmount, setDevGoldAmount] = useState("1000");
  const [penaltiesOpen, setPenaltiesOpen] = useState(false);
  const [updateSource, setUpdateSourceState] = useState(() => getSavedUpdateSource());
  const [updateSourceEditOpen, setUpdateSourceEditOpen] = useState(false);

  const [trackingOpen, setTrackingOpen] = useState({
    background: false,
    health: false,
    phone: false,
    band: false,
    analysis: false,
    performance: false,
  });
  const activePenalty = getActivePenalty(player.penalties);
  const advancedFlags = [
    activePenalty ? "Kara aktywna" : null,
    player.settings.unlockAllMiniGames ? "Test mini-gier ON" : null,
    player.settings.phonePranksEnabled ? "Psoty telefonu ON" : null,
  ].filter(Boolean);
  const addCustomDevGold = () => {
    const amount = Math.floor(Number(devGoldAmount.replace(",", ".")));
    if (!Number.isFinite(amount) || amount <= 0) {
      setDevGoldAmount("1000");
      return;
    }
    onDevAddGold(Math.min(amount, 100000));
  };
  const wearableAnalysis = useMemo(
    () => getWearableDailyAnalysis(player.wearableSamples || []),
    [player.wearableSamples]
  );

  useEffect(() => {
    let cancelled = false;
    void getHealthConnectStatus().then((status) => {
      if (cancelled) return;
      setHealthStatus(status);
      setHealthMessage(null);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    void getPenaltyPermissionStatus().then((status) => {
      if (cancelled) return;
      setPenaltyStatus(status);
      setPenaltyMessage(status.message);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    void getPerformanceStatus().then((status) => {
      if (cancelled) return;
      setPerformanceStatus(status);
    });
    return () => {
      cancelled = true;
    };
  }, [player.settings.performanceMode]);

  const refreshNotifications = async () => {
    const [status, scheduled] = await Promise.all([getNotificationStatus(), getScheduledNotifications()]);
    setNotificationStatus(status);
    setScheduledNotifications(scheduled);
    setNotificationMessage(status.message);
  };

  useEffect(() => {
    let cancelled = false;
    void Promise.all([getNotificationStatus(), getScheduledNotifications()]).then(([status, scheduled]) => {
      if (cancelled) return;
      setNotificationStatus(status);
      setScheduledNotifications(scheduled);
      setNotificationMessage(status.message);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const requestHealthAccess = async () => {
    setHealthBusy(true);
    setHealthMessage(null);
    try {
      const status = await requestHealthConnectPermissions();
      setHealthStatus(status);
      setHealthMessage(status.message);
    } catch (error) {
      setHealthMessage(error instanceof Error ? error.message : "Nie udało się nadać zgód Health Connect.");
    } finally {
      setHealthBusy(false);
    }
  };

  const syncHealthToday = async () => {
    setHealthBusy(true);
    setHealthMessage(null);
    try {
      const summary = await readTodayHealthSummary();
      setHealthSummary(summary);
      setHealthStatus(summary);

      if (!summary.permissionsGranted) {
        setHealthMessage(summary.message);
        return;
      }

      const wearableSample = createWearableSampleFromHealthSummary(summary);
      if (wearableSample) onWearableSample(wearableSample);

      const dateKey = getLocalDateKey();
      const questDistance = getHealthConnectQuestDistanceKm(summary);
      const previousImport = getLastHealthConnectImport(dateKey);
      const delta = Number(Math.max(0, questDistance.km - previousImport).toFixed(2));

      if (delta > 0) {
        onImportHealthDistance(delta);
        saveLastHealthConnectImport(dateKey, questDistance.km);
        setHealthMessage(
          `Dodano ${delta.toFixed(2)} km z Health Connect${questDistance.estimated ? " na podstawie kroków" : ""}.`
        );
      } else {
        setHealthMessage("Brak nowego dystansu do dodania. Dane podglądu zostały odświeżone.");
      }
    } catch (error) {
      setHealthMessage(error instanceof Error ? error.message : "Nie udało się odczytać Health Connect.");
    } finally {
      setHealthBusy(false);
    }
  };

  const openHealthSettings = async () => {
    const result = await openHealthConnectSettings();
    setHealthMessage(result.message);
  };

  const requestNotifications = async () => {
    setNotificationBusy(true);
    try {
      await configureNotificationChannels();
      const status = await requestNotificationPermission();
      setNotificationStatus(status);
      setNotificationMessage(status.message);
      onUpdateNotificationSettings({ enabled: status.permissionGranted || player.settings.notifications.enabled });
      await scheduleDailyTrainingNotifications(player.settings.notifications, Boolean(player.dailyQuest.completedAt));
      const scheduled = await getScheduledNotifications();
      setScheduledNotifications(scheduled);
    } finally {
      setNotificationBusy(false);
    }
  };

  const enableExactAlarms = async () => {
    setNotificationBusy(true);
    try {
      const result = await openExactAlarmSettings();
      setNotificationMessage(result.message);
      onUpdateNotificationSettings({ exactAlarmEnabled: true });
      await refreshNotifications();
    } finally {
      setNotificationBusy(false);
    }
  };

  const runNotificationTest = async () => {
    setNotificationBusy(true);
    try {
      const result = await testLocalNotification();
      setNotificationMessage(result.message);
      await refreshNotifications();
    } finally {
      setNotificationBusy(false);
    }
  };

  const rescheduleNotifications = async () => {
    setNotificationBusy(true);
    try {
      const result = await scheduleDailyTrainingNotifications(player.settings.notifications, Boolean(player.dailyQuest.completedAt));
      setNotificationMessage(result.message);
      await refreshNotifications();
    } finally {
      setNotificationBusy(false);
    }
  };

  const refreshPenaltyPermissions = async () => {
    const status = await getPenaltyPermissionStatus();
    setPenaltyStatus(status);
    setPenaltyMessage(status.message);
  };

  const openFontPermission = async () => {
    setPenaltyBusy(true);
    try {
      const result = await openPenaltyWriteSettings();
      setPenaltyMessage(result.message);
      onUpdatePenaltySettings({ penaltyConsentSeen: true });
    } finally {
      setPenaltyBusy(false);
    }
  };

  const requestWallpaperGallery = async () => {
    setPenaltyBusy(true);
    try {
      const result = await requestGalleryWallpaperAccess();
      setPenaltyMessage(result.message);
      onUpdatePenaltySettings({ penaltyConsentSeen: true });
      await refreshPenaltyPermissions();
    } finally {
      setPenaltyBusy(false);
    }
  };

  const applyWallpaperPrank = async () => {
    if (!activePenalty) return;
    if (!player.settings.funnyPenaltiesEnabled || !player.settings.phonePranksEnabled || !player.settings.wallpaperPenaltyEnabled) {
      setPenaltyMessage("Psoty tapety są wyłączone. Wykonaj ćwiczenie karne w aplikacji.");
      return;
    }
    setPenaltyBusy(true);
    try {
      const result = await setPenaltyWallpaper(activePenalty.id, activePenalty.intensity);
      setPenaltyMessage(result.message);
      if (result.applied) onMarkPenaltyPrankApplied(activePenalty.id, { appliedWallpaper: true });
    } catch (error) {
      setPenaltyMessage(error instanceof Error ? error.message : "Tapeta została zablokowana przez Androida.");
      onMarkPenaltyPrankApplied(activePenalty.id, {});
    } finally {
      setPenaltyBusy(false);
    }
  };

  const applyFontPrank = async () => {
    if (!activePenalty) return;
    if (!player.settings.funnyPenaltiesEnabled || !player.settings.phonePranksEnabled || !player.settings.fontPenaltyEnabled) {
      setPenaltyMessage("Psoty czcionki są wyłączone. Wykonaj ćwiczenie karne w aplikacji.");
      return;
    }
    setPenaltyBusy(true);
    try {
      const status = await checkWriteSettings();
      setPenaltyStatus((current) => current ? { ...current, canWriteSettings: status.canWriteSettings, message: status.message } : current);
      if (!status.canWriteSettings) {
        setPenaltyMessage(status.message);
        onMarkPenaltyPrankApplied(activePenalty.id, {});
        return;
      }

      const result = await setPenaltyFontScale(getPenaltyFontScale(activePenalty.intensity));
      setPenaltyMessage(result.message);
      if (result.applied) onMarkPenaltyPrankApplied(activePenalty.id, { appliedFont: true });
    } catch (error) {
      setPenaltyMessage(error instanceof Error ? error.message : "Czcionka została zablokowana przez Androida.");
      onMarkPenaltyPrankApplied(activePenalty.id, {});
    } finally {
      setPenaltyBusy(false);
    }
  };

  const restoreFontPrank = async () => {
    setPenaltyBusy(true);
    try {
      const result = await restorePenaltyFontScale();
      setPenaltyMessage(result.message);
      await refreshPenaltyPermissions();
    } finally {
      setPenaltyBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="sl-card rounded-[22px] p-3">
        <div className="grid grid-cols-4 gap-2">
          <SystemQuickAction icon={<ShoppingBag className="h-4 w-4" />} label="Sklep" onClick={() => setActiveSheet("shop")} />
          <SystemQuickAction icon={<Wallpaper className="h-4 w-4" />} label="Wygląd" onClick={() => setActiveSheet("appearance")} />
          <SystemQuickAction icon={systemAudioEnabled || backgroundMusicEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />} label="Audio" onClick={() => setActiveSheet("audio")} />
          <SystemQuickAction
            icon={<Crown className="h-4 w-4" />}
            label="Dev"
            onClick={() => {
              setAdvancedOpen(true);
              setActiveSheet("dev");
            }}
          />
        </div>
      </div>

      <div className="sl-card rounded-[22px] p-4 border border-cyan-500/30">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-cyan-950/80 border border-cyan-500/40 text-cyan-400">
              <Sparkles className="h-5 w-5 animate-pulse" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-mono uppercase tracking-widest text-cyan-400">System OTA · GitHub</p>
              <h3 className="text-sm font-black uppercase tracking-[0.15em] text-[var(--theme-text-strong)]">
                Aktualizacja Systemu
              </h3>
              <p className="sl-muted text-xs font-mono truncate">
                v{CURRENT_APP_VERSION} · GitHub (Dismonder/solo-leveler)
              </p>
            </div>
          </div>
          <div className="flex items-center justify-end gap-2 shrink-0">
            <a
              href="https://github.com/Dismonder/solo-leveler/releases"
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-cyan-500/40 bg-cyan-950/60 text-cyan-300 transition-colors hover:bg-cyan-900/60 hover:text-white active:scale-[0.98]"
              title="Wydania i zmiany na GitHubie"
              aria-label="Wydania i zmiany na GitHubie"
            >
              <Github className="h-4 w-4" />
            </a>
            <button
              type="button"
              onClick={onOpenWhatsNew}
              className="h-9 shrink-0 rounded-xl border border-cyan-500/30 bg-cyan-950/40 px-3 text-xs font-mono font-bold text-slate-200 transition-colors hover:bg-cyan-900/60 active:scale-[0.98]"
            >
              Nowości
            </button>
            <button
              type="button"
              onClick={onCheckUpdate}
              className="h-9 shrink-0 rounded-xl border border-cyan-500/40 bg-cyan-950/60 px-4 text-xs font-mono font-bold text-cyan-300 transition-colors hover:bg-cyan-900/60 active:scale-[0.98]"
            >
              Sprawdź
            </button>
          </div>
        </div>
      </div>

      <div className="sl-card rounded-[22px] p-4">
        {/* Top Mini Player */}
        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => setActiveSheet("audio")}
            className="flex items-center gap-3 min-w-0 flex-1 text-left cursor-pointer active:scale-[0.99]"
          >
            <div className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-cyan-400/40 bg-cyan-950/80 text-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.25)]">
              <Disc3 className={`h-6 w-6 text-cyan-400 ${backgroundMusicEnabled ? "animate-spin" : ""}`} style={{ animationDuration: "6s" }} />
              {backgroundMusicEnabled && (
                <span className="absolute -bottom-0.5 -right-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-cyan-400 text-[7px] font-black text-black">
                  ▶
                </span>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span className="truncate text-xs font-black uppercase tracking-wide text-[var(--theme-text-strong)]">
                  {musicTracks.find((t) => t.id === (musicTrackSettings?.appTrackId ?? "symphonic-suite-lv1"))?.title || "Solo Leveling OST"}
                </span>
              </div>
              <p className="sl-muted truncate text-[10px] font-bold">
                {musicTracks.find((t) => t.id === (musicTrackSettings?.appTrackId ?? "symphonic-suite-lv1"))?.artist || "Hiroyuki Sawano"} · {musicTracks.length} utworów
              </p>
            </div>
          </button>

          {/* Quick Mini Controls */}
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={async () => {
                const prevId = await playPreviousTrack();
                if (prevId) onUpdateMusicTrackSettings({ appTrackId: prevId });
              }}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-800 bg-slate-900/60 text-slate-300 hover:text-white active:scale-95"
              title="Poprzedni utwór"
              aria-label="Poprzedni utwór"
            >
              <SkipBack className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => onToggleBackgroundMusic(!backgroundMusicEnabled)}
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-black shadow-[0_0_12px_rgba(6,182,212,0.4)] active:scale-95"
              title={backgroundMusicEnabled ? "Pauza" : "Graj"}
              aria-label={backgroundMusicEnabled ? "Pauza" : "Graj"}
            >
              {backgroundMusicEnabled ? <Pause className="h-4 w-4 fill-current" /> : <Play className="h-4 w-4 fill-current translate-x-0.5" />}
            </button>
            <button
              type="button"
              onClick={async () => {
                const nextId = await playNextTrack();
                if (nextId) onUpdateMusicTrackSettings({ appTrackId: nextId });
              }}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-800 bg-slate-900/60 text-slate-300 hover:text-white active:scale-95"
              title="Następny utwór"
              aria-label="Następny utwór"
            >
              <SkipForward className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setActiveSheet("audio")}
              className="flex h-9 px-2.5 items-center justify-center gap-1 rounded-xl border border-cyan-500/40 bg-cyan-950/60 text-[10px] font-mono font-black uppercase tracking-wider text-cyan-300 hover:bg-cyan-900/60 active:scale-95"
              title="Otwórz pełny album"
              aria-label="Otwórz pełny album"
            >
              <Headphones className="h-3.5 w-3.5" />
              <span>Album</span>
            </button>
          </div>
        </div>

        {/* Thin Touch-Friendly Volume Sliders */}
        <div className="mt-3.5 space-y-2.5 border-t border-slate-800/80 pt-3">
          {/* SFX Bar */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => onToggleSystemAudio(!systemAudioEnabled)}
              className="flex items-center gap-1.5 w-24 shrink-0 text-left cursor-pointer"
            >
              {systemAudioEnabled ? <Volume2 className="h-3.5 w-3.5 text-cyan-400" /> : <VolumeX className="h-3.5 w-3.5 text-slate-500" />}
              <span className={`text-[10px] font-mono font-black uppercase tracking-wider ${systemAudioEnabled ? "text-cyan-300" : "text-slate-500"}`}>
                SFX {systemAudioEnabled ? `${Math.round(volume * 100)}%` : "OFF"}
              </span>
            </button>
            <div className="relative flex-1 flex items-center">
              <input
                className="h-1.5 w-full accent-cyan-400 bg-slate-800 rounded-full appearance-none cursor-pointer"
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={volume}
                onChange={onVolumeChange}
              />
            </div>
          </div>

          {/* Music Bar */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => onToggleBackgroundMusic(!backgroundMusicEnabled)}
              className="flex items-center gap-1.5 w-24 shrink-0 text-left cursor-pointer"
            >
              {backgroundMusicEnabled ? <Music2 className="h-3.5 w-3.5 text-violet-400" /> : <VolumeX className="h-3.5 w-3.5 text-slate-500" />}
              <span className={`text-[10px] font-mono font-black uppercase tracking-wider ${backgroundMusicEnabled ? "text-violet-300" : "text-slate-500"}`}>
                OST {backgroundMusicEnabled ? `${Math.round(musicVolume * 100)}%` : "OFF"}
              </span>
            </button>
            <div className="relative flex-1 flex items-center">
              <input
                className="h-1.5 w-full accent-violet-400 bg-slate-800 rounded-full appearance-none cursor-pointer"
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={musicVolume}
                onChange={onMusicVolumeChange}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="sl-card rounded-[22px] p-4">
        <h3 className="text-sm font-black uppercase tracking-[0.2em] text-[var(--theme-text-strong)]">Tracking i wydajność</h3>
        <div className="mt-4 grid gap-2">
          <SystemAccordion
            icon={<Shield className="h-4 w-4 text-amber-400" />}
            title="Działanie w tle & Alerty"
            status={notificationStatus?.batteryOptimizationIgnored && notificationStatus?.permissionGranted ? "Aktywne" : "Wymaga uwagi"}
            open={trackingOpen.background}
            onToggle={() => setTrackingOpen((current) => ({ ...current, background: !current.background }))}
          >
            <div className="grid grid-cols-2 gap-2">
              <MiniStat
                icon={<Battery className="h-4 w-4" />}
                label="Bateria"
                value={notificationStatus?.batteryOptimizationIgnored ? "Bez ograniczeń" : "Usypianie"}
              />
              <MiniStat
                icon={<Bell className="h-4 w-4" />}
                label="Powiadomienia"
                value={notificationStatus?.permissionGranted ? "Aktywne" : "Brak zgody"}
              />
            </div>
            <p className="sl-muted mt-3 text-xs leading-relaxed">
              Wyłączenie optymalizacji baterii i zgoda na powiadomienia są niezbędne, aby treningi, odtwarzacz muzyki OST i kary działały bez zakłóceń w tle.
            </p>
            <div className="mt-3 grid grid-cols-3 gap-2">
              <SmallButton onClick={() => onOpenBackgroundPermissions?.()} icon={<Settings className="h-3.5 w-3.5" />} label="Instrukcja" />
              <SmallButton onClick={runNotificationTest} icon={<Bell className="h-3.5 w-3.5" />} label="Test alert" muted />
              <SmallButton onClick={enableExactAlarms} icon={<Clock3 className="h-3.5 w-3.5" />} label="Alarmy" muted />
            </div>
          </SystemAccordion>

          <SystemAccordion
            icon={<Activity className="h-4 w-4" />}
            title="Health Connect"
            status={healthStatus?.permissionsGranted ? "Gotowy" : healthStatus?.available ? "Zgoda" : "Brak"}
            open={trackingOpen.health}
            onToggle={() => setTrackingOpen((current) => ({ ...current, health: !current.health }))}
          >
            <div className="grid grid-cols-2 gap-2">
              <MiniStat icon={<Target className="h-4 w-4" />} label="Status" value={healthStatus?.permissionsGranted ? "Gotowy" : healthStatus?.available ? "Zgoda" : "Brak"} />
              <MiniStat icon={<Dumbbell className="h-4 w-4" />} label="Dystans" value={`${(healthSummary?.distanceKm || 0).toFixed(2)} km`} />
              <MiniStat icon={<Zap className="h-4 w-4" />} label="Kroki" value={Math.floor(healthSummary?.steps || 0)} />
              <MiniStat icon={<HeartPulse className="h-4 w-4" />} label="Tętno" value={healthSummary?.heartRateAvg ? `${Math.round(healthSummary.heartRateAvg)} bpm` : "--"} />
            </div>

            <div className="mt-3 grid grid-cols-3 gap-2">
              <SmallButton onClick={requestHealthAccess} icon={<Shield className="h-3.5 w-3.5" />} label={healthBusy ? "..." : "Zgoda"} muted />
              <SmallButton onClick={syncHealthToday} icon={<Activity className="h-3.5 w-3.5" />} label={healthBusy ? "..." : "Import"} />
              <SmallButton onClick={openHealthSettings} icon={<Settings className="h-3.5 w-3.5" />} label="Opcje" muted />
            </div>

            <div className="mt-3">
              <ToggleRow
                label="Auto import"
                description="Bieganie i kroki są synchronizowane przy starcie, powrocie do aplikacji i po akcji z powiadomienia."
                enabled={player.settings.healthAutoSync}
                onToggle={() => onUpdateSettings({ healthAutoSync: !player.settings.healthAutoSync })}
              />
            </div>

            {healthMessage && <p className="sl-muted mt-3 text-xs leading-relaxed">{healthMessage}</p>}
            {healthSummary?.dataOrigins?.length ? (
              <p className="mt-2 truncate text-[10px] font-bold uppercase tracking-widest text-[var(--theme-success-text)]">
                Źródła: {healthSummary.dataOrigins.join(", ")}
              </p>
            ) : null}
          </SystemAccordion>

          <SystemAccordion
            icon={<Smartphone className="h-4 w-4" />}
            title="Sensor telefonu"
            status="Opcjonalny"
            open={trackingOpen.phone}
            onToggle={() => setTrackingOpen((current) => ({ ...current, phone: !current.phone }))}
          >
            <div className="grid gap-2">
              <InfoRow icon={<Activity className="h-4 w-4" />} label="Ostatni wpis" value={lastWorkout ? `${lastWorkout.value} · ${lastWorkout.source}` : "Brak"} />
              <p className="sl-muted text-xs leading-relaxed">
                Sensor działa tylko podczas aktywnej karty ćwiczenia. Ręczny wpis zawsze zostaje dostępny.
              </p>
            </div>
          </SystemAccordion>

          <SystemAccordion
            icon={<Bluetooth className="h-4 w-4" />}
            title="Bluetooth / Mi Band"
            status={nativeBluetooth ? "Android BLE" : bluetoothAvailable ? "Web dialog" : "Brak"}
            open={trackingOpen.band}
            onToggle={() => setTrackingOpen((current) => ({ ...current, band: !current.band }))}
          >
            <div className="grid gap-2">
              <InfoRow icon={<Bluetooth className="h-4 w-4" />} label="Bluetooth BLE" value={nativeBluetooth ? "Skan + reconnect" : bluetoothAvailable ? "Dialog web" : "Niedostępny"} />
              <InfoRow icon={<Watch className="h-4 w-4" />} label="Xiaomi / Mi Band" value={nativeBluetooth ? "Skan w sensorze" : "Połącz w oknie sensora"} />
              <div className="grid grid-cols-3 gap-2">
                <SmallButton onClick={onOpenWearableSensor} icon={<Watch className="h-3.5 w-3.5" />} label="Połącz" />
                <SmallButton
                  onClick={() => setHealthMessage(nativeBluetooth || bluetoothAvailable ? "Otworzono sensor. Wybierz opaskę w oknie pomiaru." : "BLE nie jest dostępne w tym środowisku. Użyj Health Connect/Mi Fitness jako stabilnego źródła.")}
                  icon={<Activity className="h-3.5 w-3.5" />}
                  label="Diag"
                  muted
                />
                <SmallButton onClick={onOpenWearableSensor} icon={<Smartphone className="h-3.5 w-3.5" />} label="Sensor" muted />
              </div>
              <p className="sl-muted text-xs leading-relaxed">
                WebView może ograniczać bezpośredni BLE. Gdy Android blokuje dialog, dane opaski pobieraj przez Health Connect/Mi Fitness.
              </p>
            </div>
          </SystemAccordion>

          <SystemAccordion
            icon={<Watch className="h-4 w-4" />}
            title="Analiza opaski"
            status={wearableAnalysis.coverageLabel}
            open={trackingOpen.analysis}
            onToggle={() => setTrackingOpen((current) => ({ ...current, analysis: !current.analysis }))}
          >
            <div className="grid grid-cols-2 gap-2">
              <MiniStat
                icon={<Watch className="h-4 w-4" />}
                label="Próbki"
                value={`${wearableAnalysis.sampleCount} (${wearableAnalysis.directBleCount}/${wearableAnalysis.healthConnectCount})`}
              />
              <MiniStat
                icon={<HeartPulse className="h-4 w-4" />}
                label="Tętno"
                value={wearableAnalysis.avgHeartRate ? `${wearableAnalysis.avgHeartRate} bpm` : "--"}
              />
              <MiniStat
                icon={<Battery className="h-4 w-4" />}
                label="Bateria"
                value={wearableAnalysis.latestBattery !== null ? `${wearableAnalysis.latestBattery}%` : "--"}
              />
              <MiniStat
                icon={<Dumbbell className="h-4 w-4" />}
                label="Dystans"
                value={`${wearableAnalysis.distanceKm.toFixed(2)} km`}
              />
            </div>
            <p className="sl-muted mt-3 text-[10px] font-bold leading-relaxed">
              BLE zapisuje baterię, tętno, RSSI i diagnostykę GATT. Kroki, sen i historia treningów są stabilniejsze przez Health Connect/Mi Fitness.
            </p>
          </SystemAccordion>

          <SystemAccordion
            icon={<Zap className="h-4 w-4" />}
            title="Wydajność 120 Hz"
            status={player.settings.performanceMode === "always120" ? "120 Hz" : player.settings.performanceMode === "battery60" ? "60 Hz" : "Auto"}
            open={trackingOpen.performance}
            onToggle={() => setTrackingOpen((current) => ({ ...current, performance: !current.performance }))}
          >
            <div className="grid grid-cols-3 gap-2">
              <MiniStat
                icon={<Battery className="h-4 w-4" />}
                label="Tryb"
                value={player.settings.performanceMode === "always120" ? "120 Hz" : player.settings.performanceMode === "battery60" ? "60 Hz" : "Auto"}
              />
              <MiniStat icon={<Activity className="h-4 w-4" />} label="Cel" value={`${Math.round(performanceStatus?.targetRefreshRate || 120)} Hz`} />
              <MiniStat icon={<Zap className="h-4 w-4" />} label="Aktywne" value={`${Math.round(performanceStatus?.refreshRate || performanceStatus?.currentRefreshRate || 0)} Hz`} />
            </div>
            <div className="mt-3 grid grid-cols-3 gap-2">
              <SmallButton onClick={() => onUpdateSettings({ performanceMode: "always120" })} icon={<Zap className="h-3.5 w-3.5" />} label="120Hz" />
              <SmallButton onClick={() => onUpdateSettings({ performanceMode: "auto120" })} icon={<Activity className="h-3.5 w-3.5" />} label="Auto" muted />
              <SmallButton onClick={() => onUpdateSettings({ performanceMode: "battery60" })} icon={<Battery className="h-3.5 w-3.5" />} label="60Hz" muted />
            </div>
            <div className="mt-3 rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-input)] p-2">
              <p className="sl-muted px-1 pb-2 text-[9px] font-black uppercase tracking-widest">Jakość grafiki</p>
              <div className="grid grid-cols-3 gap-2">
                <SmallButton onClick={() => onUpdateSettings({ graphicsQuality: "performance" })} icon={<Zap className="h-3.5 w-3.5" />} label="FPS" muted={player.settings.graphicsQuality !== "performance"} />
                <SmallButton onClick={() => onUpdateSettings({ graphicsQuality: "balanced" })} icon={<Activity className="h-3.5 w-3.5" />} label="Balans" muted={player.settings.graphicsQuality !== "balanced"} />
                <SmallButton onClick={() => onUpdateSettings({ graphicsQuality: "cinematic" })} icon={<Sparkles className="h-3.5 w-3.5" />} label="Kino" muted={player.settings.graphicsQuality !== "cinematic"} />
              </div>
            </div>
          </SystemAccordion>
        </div>
      </div>

      {activeSheet === "shop" && (
        <SystemSheet title="Sklep Systemu" icon={<ShoppingBag className="h-5 w-5" />} onClose={() => setActiveSheet(null)}>
          <ThemeShopPanel
            player={player}
            onBuy={onBuyTheme}
            onSelect={onSelectTheme}
            onBuyEffect={onBuyThemeEffect}
            onSelectEffect={onSelectThemeEffect}
            onBuyWallpaper={onBuyThemeWallpaper}
            onSelectWallpaper={onSelectThemeWallpaper}
          />
        </SystemSheet>
      )}

      {activeSheet === "appearance" && (
        <SystemSheet title="Wygląd" icon={<Wallpaper className="h-5 w-5" />} onClose={() => setActiveSheet(null)}>
          <div className="space-y-3">
            <div className="sl-card rounded-2xl p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-black uppercase tracking-[0.2em] text-[var(--theme-text-strong)]">Przezroczystość UI</h3>
                  <p className="sl-muted mt-1 text-xs font-bold">
                    {Math.round((player.settings.uiSurfaceOpacity ?? 0.84) * 100)}% powierzchni
                  </p>
                </div>
                <button
                  type="button"
                  className="sl-button-secondary rounded-xl px-3 py-2 text-[10px] font-black uppercase tracking-widest"
                  onClick={() => onUpdateSettings({ uiSurfaceOpacity: 0.84 })}
                >
                  Reset
                </button>
              </div>
              <input
                className="mt-4 w-full accent-cyan-400"
                type="range"
                min="0.55"
                max="1"
                step="0.01"
                value={player.settings.uiSurfaceOpacity ?? 0.84}
                onChange={(event) => onUpdateSettings({ uiSurfaceOpacity: Number(event.target.value) })}
              />
              <p className="sl-muted mt-3 text-xs leading-relaxed">
                Suwak zmienia tylko powierzchnie kart i paneli. Tekst, ikony i przyciski zostają pełnej czytelności.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <MiniStat icon={<Crown className="h-4 w-4" />} label="Motyw" value={getThemeDefinition(player.settings.themeId).name} />
              <MiniStat icon={<Wallpaper className="h-4 w-4" />} label="Tło" value={getThemeWallpaperDefinition(player.settings.activeWallpaperId).name} />
            </div>
            <SmallButton onClick={() => setActiveSheet("shop")} icon={<ShoppingBag className="h-3.5 w-3.5" />} label="Otwórz sklep" />
          </div>
        </SystemSheet>
      )}

      {activeSheet === "audio" && (
        <SystemSheet title="Album Muzyczny & Audio" icon={<Headphones className="h-5 w-5 text-cyan-400" />} onClose={() => setActiveSheet(null)}>
          <AudioAlbumSheet
            volume={volume}
            systemAudioEnabled={systemAudioEnabled}
            musicVolume={musicVolume}
            backgroundMusicEnabled={backgroundMusicEnabled}
            musicTracks={musicTracks}
            musicTrackSettings={musicTrackSettings}
            onVolumeChange={onVolumeChange}
            onToggleSystemAudio={onToggleSystemAudio}
            onMusicVolumeChange={onMusicVolumeChange}
            onToggleBackgroundMusic={onToggleBackgroundMusic}
            onUpdateMusicTrackSettings={onUpdateMusicTrackSettings}
            onRandomizeMusicTrack={onRandomizeMusicTrack}
          />
        </SystemSheet>
      )}

      {activeSheet === "dev" && (
        <SystemSheet title="Panel Dev" icon={<Crown className="h-5 w-5" />} onClose={() => setActiveSheet(null)}>
      <div className="sl-card rounded-[22px] p-4">
        <button
          type="button"
          onClick={() => {
            if (!advancedUnlocked) {
              setAdvancedOpen(true);
              return;
            }
            setAdvancedOpen((open) => !open);
          }}
          className="flex min-h-12 w-full items-center justify-between gap-4 text-left active:scale-[0.99]"
        >
          <span className="min-w-0">
            <span className="block text-sm font-black uppercase tracking-[0.2em] text-[var(--theme-text-strong)]">Zaawansowane ustawienia</span>
            <span className="sl-muted mt-1 block text-xs leading-relaxed">
              Zgody, testy, moduły rozwojowe{advancedFlags.length ? ` · ${advancedFlags.join(" · ")}` : ""}
            </span>
          </span>
          <span className="sl-button-secondary shrink-0 rounded-xl px-3 py-2 text-[10px] font-black uppercase tracking-widest">
            {advancedUnlocked && advancedOpen ? "Ukryj" : "Pokaż"}
          </span>
        </button>

        {advancedOpen && !advancedUnlocked && (
          <div className="sl-input mt-4 rounded-2xl p-3">
            <p className="sl-muted text-xs font-bold leading-relaxed">
              Dostęp do testów i psot wymaga kodu.
            </p>
            <div className="mt-3 grid grid-cols-[1fr_auto] gap-2">
              <input
                value={advancedCode}
                onChange={(event) => {
                  setAdvancedCode(event.target.value);
                  setAdvancedError(null);
                }}
                inputMode="numeric"
                placeholder="Kod"
                className="sl-input min-h-11 rounded-2xl px-3 text-sm font-black outline-none"
              />
              <button
                type="button"
                onClick={() => {
                  if (advancedCode === "666") {
                    setAdvancedUnlocked(true);
                    setAdvancedOpen(true);
                    setAdvancedCode("");
                    setAdvancedError(null);
                  } else {
                    setAdvancedError("Nieprawidłowy kod.");
                  }
                }}
                className="sl-button-primary min-h-11 rounded-2xl px-4 text-xs font-black uppercase tracking-widest active:scale-[0.98]"
              >
                Odblokuj
              </button>
            </div>
            {advancedError && <p className="mt-2 text-xs font-bold text-[var(--theme-danger-text)]">{advancedError}</p>}
          </div>
        )}

        {advancedOpen && advancedUnlocked && (
          <div className="mt-4 space-y-3">
            <div className="sl-alert-danger rounded-2xl p-3">
              <button
                type="button"
                onClick={() => setPenaltiesOpen((open) => !open)}
                className="flex w-full items-start justify-between gap-3 text-left active:scale-[0.99]"
              >
                <span className="min-w-0">
                  <span className="block text-xs font-black uppercase tracking-[0.2em] text-[var(--theme-text-strong)]">Zgody i kary</span>
                  <span className="sl-muted mt-1 block text-xs leading-relaxed">
                    Kara: {activePenalty ? "aktywna" : "brak"} · Tapeta: {penaltyStatus?.wallpaperAvailable ? "gotowa" : "brak"} · Czcionka: {penaltyStatus?.canWriteSettings ? "zgoda" : "brak"}
                  </span>
                </span>
                <AlertTriangle className="h-4 w-4 shrink-0 text-[var(--theme-danger-text)]" />
              </button>

              {penaltiesOpen && (
                <div className="mt-3 space-y-3">
                  <ToggleRow
                    label="Karne ćwiczenia za ominięty quest"
                    description="Domyślnie wyłączone. Po włączeniu System naliczy karne ćwiczenie przy ominięciu dnia."
                    enabled={player.settings.penaltyExercisesEnabled}
                    onToggle={() => onUpdatePenaltySettings({ penaltyExercisesEnabled: !player.settings.penaltyExercisesEnabled })}
                  />
                  <ToggleRow
                    label="Śmieszne kary"
                    description="OFF blokuje zmiany telefonu, kara zostaje tylko w aplikacji."
                    enabled={player.settings.funnyPenaltiesEnabled}
                    onToggle={() => onUpdatePenaltySettings({ funnyPenaltiesEnabled: !player.settings.funnyPenaltiesEnabled })}
                  />

                  <ToggleRow
                    label="Psoty telefonu"
                    description="Tapeta i czcionka tylko przy aktywnej karze i zgodach."
                    enabled={player.settings.phonePranksEnabled}
                    onToggle={() => onUpdatePenaltySettings({ phonePranksEnabled: !player.settings.phonePranksEnabled })}
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <TogglePill
                      icon={<Wallpaper className="h-4 w-4" />}
                      label="Tapeta"
                      enabled={player.settings.wallpaperPenaltyEnabled}
                      onToggle={() => onUpdatePenaltySettings({ wallpaperPenaltyEnabled: !player.settings.wallpaperPenaltyEnabled })}
                    />
                    <TogglePill
                      icon={<Type className="h-4 w-4" />}
                      label="Czcionka"
                      enabled={player.settings.fontPenaltyEnabled}
                      onToggle={() => onUpdatePenaltySettings({ fontPenaltyEnabled: !player.settings.fontPenaltyEnabled })}
                    />
                  </div>
                  <IntensitySelector value={player.settings.penaltyIntensity} onChange={(penaltyIntensity) => onUpdatePenaltySettings({ penaltyIntensity })} />
                  <div className="grid grid-cols-4 gap-2">
                    <SmallButton onClick={refreshPenaltyPermissions} icon={<CheckCircle2 className="h-3.5 w-3.5" />} label="Status" muted />
                    <SmallButton onClick={requestWallpaperGallery} icon={<Wallpaper className="h-3.5 w-3.5" />} label={penaltyBusy ? "..." : "Galeria"} muted />
                    <SmallButton onClick={openFontPermission} icon={<Settings className="h-3.5 w-3.5" />} label="Font" muted />
                    <SmallButton onClick={restoreFontPrank} icon={<RotateCcw className="h-3.5 w-3.5" />} label="Reset" muted />
                  </div>

                  {activePenalty ? (
                    <div className="sl-stat-tile rounded-2xl p-3">
                      <p className="text-[10px] font-black uppercase tracking-[0.24em] text-[var(--theme-danger-text)]">Aktywna kara · {activePenalty.missedDateKey}</p>
                      <h4 className="mt-1 text-lg font-black uppercase tracking-wide text-[var(--theme-text-strong)]">{activePenalty.exerciseName}</h4>
                      <p className="sl-muted mt-1 text-sm leading-relaxed">
                        {activePenalty.requiredAmount} {activePenalty.exerciseId === "plank" || activePenalty.exerciseId === "wall-sit" ? "sekund" : "powtórzeń"} · {activePenalty.exerciseDescription}
                      </p>
                      {player.settings.phonePranksEnabled && (
                        <div className="mt-3 grid grid-cols-2 gap-2">
                          <SmallButton onClick={applyWallpaperPrank} icon={<Wallpaper className="h-3.5 w-3.5" />} label={activePenalty.appliedWallpaper ? "OK" : "Tapeta"} muted />
                          <SmallButton onClick={applyFontPrank} icon={<Type className="h-3.5 w-3.5" />} label={activePenalty.appliedFont ? "OK" : "Font"} muted />
                        </div>
                      )}
                      <p className="sl-muted mt-3 text-xs leading-relaxed">
                        Karę wykonujesz przez baner na ekranie Status. Dev może ją wyczyścić testowo.
                      </p>
                    </div>
                  ) : (
                    <SmallButton onClick={onTriggerPenalty} icon={<AlertTriangle className="h-3.5 w-3.5" />} label="Test kary" muted />
                  )}
                  <p className="sl-muted text-xs leading-relaxed">{penaltyMessage || "Zgody są sprawdzane sekwencyjnie, zgodnie z Androidem."}</p>
                </div>
              )}
            </div>

            <div className="sl-alert-warning rounded-2xl p-3">
              <div className="flex items-center justify-between gap-3">
                <span className="text-xs font-black uppercase tracking-[0.2em] text-[var(--theme-warning-text)]">Tryb RPG</span>
                <span className="sl-chip rounded-xl px-2 py-1 text-[9px] font-black uppercase tracking-widest">ukryty</span>
              </div>
            </div>

            <div className="sl-input rounded-2xl p-3">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-xs font-black uppercase tracking-[0.2em] text-[var(--theme-text-strong)]">Testy · Mini-gry</h3>
                  <p className="sl-muted mt-2 text-xs leading-relaxed">
                    Tylko do weryfikacji. Odblokowuje wszystkie symulacje niezależnie od rangi.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => onToggleMiniGamesUnlock(!player.settings.unlockAllMiniGames)}
                  className={`min-h-10 shrink-0 rounded-2xl border px-3 text-xs font-black uppercase tracking-widest active:scale-[0.98] ${
                    player.settings.unlockAllMiniGames
                      ? "sl-toggle-active"
                      : "sl-toggle"
                  }`}
                >
                  {player.settings.unlockAllMiniGames ? "ON" : "OFF"}
                </button>
              </div>
            </div>

            <div className="sl-input rounded-2xl p-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-xs font-black uppercase tracking-[0.2em] text-[var(--theme-text-strong)]">Dev tools</h3>
                  <p className="sl-muted mt-1 text-xs leading-relaxed">Reset testowy, gold i stan kar. Tylko po kodzie 666.</p>
                </div>
                <Zap className="h-4 w-4 shrink-0 text-[var(--theme-icon)]" />
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <SmallButton onClick={onDevResetDailyQuest} icon={<RotateCcw className="h-3.5 w-3.5" />} label="Reset celu" muted />
                <SmallButton onClick={onDevCompleteDailyQuest} icon={<CheckCircle2 className="h-3.5 w-3.5" />} label="Ukończ cel" />
                <SmallButton onClick={() => onDevAddGold(100)} icon={<Plus className="h-3.5 w-3.5" />} label="+100 gold" muted />
                <SmallButton onClick={() => onDevAddGold(1000)} icon={<Plus className="h-3.5 w-3.5" />} label="+1000 gold" />
                <SmallButton onClick={onDevClearPenalty} icon={<AlertTriangle className="h-3.5 w-3.5" />} label="Usuń karę" muted />
                <SmallButton onClick={onDevResetMiniGames} icon={<Gamepad2 className="h-3.5 w-3.5" />} label="Reset gier" muted />
                <SmallButton
                  onClick={() => onUpdateSettings({ fpsOverlayEnabled: !player.settings.fpsOverlayEnabled })}
                  icon={<Activity className="h-3.5 w-3.5" />}
                  label={player.settings.fpsOverlayEnabled ? "FPS OFF" : "FPS ON"}
                  muted={!player.settings.fpsOverlayEnabled}
                />
              </div>
              <div className="sl-card mt-3 rounded-2xl p-3">
                <label className="block text-[10px] font-black uppercase tracking-[0.22em] text-[var(--theme-muted)]" htmlFor="dev-gold-amount">
                  Własna kwota golda
                </label>
                <div className="mt-2 flex gap-2">
                  <input
                    id="dev-gold-amount"
                    type="number"
                    min={1}
                    max={100000}
                    inputMode="numeric"
                    value={devGoldAmount}
                    onChange={(event) => setDevGoldAmount(event.target.value)}
                    className="sl-input min-h-11 min-w-0 flex-1 rounded-xl px-3 font-mono text-base font-black text-[var(--theme-text-strong)] outline-none"
                  />
                  <button
                    type="button"
                    onClick={addCustomDevGold}
                    className="sl-button-primary min-h-11 shrink-0 rounded-xl border px-4 text-xs font-black uppercase tracking-widest active:scale-[0.98]"
                  >
                    Dodaj
                  </button>
                </div>
                <p className="sl-muted mt-2 text-[10px] font-bold leading-relaxed">
                  Limit pojedynczego dodania: 100000G.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
        </SystemSheet>
      )}

      <button
        type="button"
        onClick={onReset}
        className="flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl border border-[color-mix(in_srgb,var(--theme-danger)_38%,transparent)] bg-[color-mix(in_srgb,var(--theme-danger)_14%,transparent)] px-4 py-3 text-sm font-black uppercase tracking-widest text-[var(--theme-danger-text)] active:scale-[0.98]"
      >
        <RotateCcw className="h-4 w-4" />
        Reset danych
      </button>
    </div>
  );
}

const MONARCH_CODE_COLUMNS = [
  "ARISE SYSTEM RANK GATE MANA",
  "SHADOW QUEST XP GOLD SKILL",
  "DUNGEON HUNTER LEVEL CORE",
  "MONARCH TRACE STATUS AWAKEN",
  "ARISE GATE RUNE STR AGI",
  "SYSTEM BLUE SHADOW VITALITY",
  "MANA FLOW QUEST COMPLETE",
  "RANK BOSS LOOT RELIC",
];

function ThemeAmbientLayer({
  effectId,
  wallpaperId,
  reducedMotion,
  graphicsQuality,
}: {
  effectId: ThemeEffectId;
  wallpaperId: string | null;
  reducedMotion: boolean;
  graphicsQuality: PlayerState["settings"]["graphicsQuality"];
}) {
  const activeEffect = effectId === "monarch-code";
  const wallpaper = getThemeWallpaperDefinition(wallpaperId);
  const wallpaperOpacity = wallpaper.asset
    ? Math.max(0.34, Math.min(0.58, 1 - wallpaper.overlayStrength + 0.18))
    : 0;
  const monarchColumns = graphicsQuality === "performance"
    ? MONARCH_CODE_COLUMNS.filter((_, index) => index % 2 === 0)
    : MONARCH_CODE_COLUMNS;

  return (
    <div className="sl-theme-ambient pointer-events-none absolute inset-0" aria-hidden="true">
      {wallpaper.asset && (
        <div
          className="sl-app-wallpaper"
          style={
            {
              "--wallpaper-image": `url(${wallpaper.asset})`,
              "--wallpaper-opacity": `${wallpaperOpacity}`,
            } as React.CSSProperties
          }
        />
      )}
      {activeEffect && (
        <div className="sl-monarch-code-rain" data-reduced-motion={reducedMotion ? "true" : "false"} data-graphics-quality={graphicsQuality}>
          {monarchColumns.map((text, index) => (
            <span
              key={`${text}-${index}`}
              style={
                {
                  "--column-duration": `${
                    graphicsQuality === "cinematic"
                      ? 10 + (index % 4) * 1.2
                      : graphicsQuality === "performance"
                        ? 18 + (index % 3) * 1.6
                        : 14 + (index % 3) * 1.4
                  }s`,
                  "--column-delay": `${-index * 1.1}s`,
                } as React.CSSProperties
              }
            >
              {text}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function BottomNav({ activeTab, onSelect }: { activeTab: AppTab; onSelect: (tab: AppTab) => void }) {
  return (
    <nav className="sl-theme-nav absolute inset-x-0 bottom-0 z-20 border-t px-3 pb-[max(env(safe-area-inset-bottom),0.75rem)] pt-2">
      <div className="grid grid-cols-4 gap-2">
        {NAV_ITEMS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => onSelect(item.id)}
            aria-current={activeTab === item.id ? "page" : undefined}
            className={`flex min-h-14 flex-col items-center justify-center gap-1 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${
              activeTab === item.id
                ? "sl-chip-active shadow-[0_0_18px_color-mix(in_srgb,var(--theme-accent)_18%,transparent)]"
                : "sl-chip"
            }`}
          >
            {item.icon}
            {item.label}
          </button>
        ))}
      </div>
    </nav>
  );
}

function SystemQuickAction({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="sl-icon-button flex min-h-16 flex-col items-center justify-center gap-1 rounded-2xl px-2 text-[9px] font-black uppercase tracking-widest active:scale-[0.98]"
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

function SystemSheet({
  title,
  icon,
  onClose,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-3 sm:items-center">
      <button type="button" className="sl-modal-backdrop absolute inset-0" aria-label="Zamknij panel" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, y: 28, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 18, scale: 0.98 }}
        className="sl-modal relative z-10 max-h-[86dvh] w-full max-w-[520px] overflow-hidden rounded-[28px] border shadow-[0_0_42px_color-mix(in_srgb,var(--theme-accent)_18%,transparent)]"
      >
        <div className="flex items-center justify-between gap-3 border-b border-[var(--theme-border)] p-4">
          <div className="flex min-w-0 items-center gap-3">
            <span className="sl-icon-button grid h-11 w-11 shrink-0 place-items-center rounded-2xl">{icon}</span>
            <h3 className="truncate text-sm font-black uppercase tracking-[0.22em] text-[var(--theme-text-strong)]">{title}</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="sl-icon-button grid h-10 w-10 shrink-0 place-items-center rounded-2xl active:scale-[0.98]"
            aria-label="Zamknij"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="max-h-[calc(86dvh-74px)] overflow-y-auto p-4 custom-scrollbar">
          {children}
        </div>
      </motion.div>
    </div>
  );
}

function ThemeShopPanel({
  player,
  onBuy,
  onSelect,
  onBuyEffect,
  onSelectEffect,
  onBuyWallpaper,
  onSelectWallpaper,
}: {
  player: PlayerState;
  onBuy: (themeId: PlayerState["settings"]["themeId"]) => void;
  onSelect: (themeId: PlayerState["settings"]["themeId"]) => void;
  onBuyEffect: (effectId: ThemeEffectId) => void;
  onSelectEffect: (effectId: ThemeEffectId) => void;
  onBuyWallpaper: (wallpaperId: string) => void;
  onSelectWallpaper: (wallpaperId: string) => void;
}) {
  const [open, setOpen] = useState(true);
  const [tab, setTab] = useState<"themes" | "wallpapers" | "effects" | "owned">("themes");
  const activeTheme = getThemeDefinition(player.settings.themeId);
  const activeEffect = getThemeEffectDefinition(player.settings.activeThemeEffectId);
  const activeWallpaper = getThemeWallpaperDefinition(player.settings.activeWallpaperId);

  return (
    <div className="sl-card rounded-[22px] p-4">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex min-h-12 w-full items-center justify-between gap-3 text-left active:scale-[0.99]"
      >
        <span className="flex min-w-0 items-center gap-3">
          <span className="sl-chip-active grid h-11 w-11 shrink-0 place-items-center rounded-2xl">
            <ShoppingBag className="h-5 w-5" />
          </span>
          <span className="min-w-0">
            <span className="block text-sm font-black uppercase tracking-[0.2em] text-[var(--theme-text)]">Sklep motywów</span>
            <span className="sl-muted mt-1 block truncate text-xs font-bold">
              Aktywny: {activeTheme.name} · Tło: {activeWallpaper.name} · Efekt: {activeEffect.name} · Gold {player.gold}
            </span>
          </span>
        </span>
        <span className="sl-button-secondary rounded-xl px-3 py-2 text-[10px] font-black uppercase tracking-widest">
          {open ? "Ukryj" : "Otwórz"}
        </span>
      </button>

      {open && (
        <div className="mt-4 grid gap-3">
          <div className="grid grid-cols-4 gap-2 rounded-2xl bg-[var(--theme-input)] p-1">
            {[
              ["themes", "Motywy"],
              ["wallpapers", "Tła"],
              ["effects", "Efekty"],
              ["owned", "Kupione"],
            ].map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => setTab(id as typeof tab)}
                className={`min-h-10 rounded-xl px-1 text-[9px] font-black uppercase tracking-widest active:scale-[0.98] ${
                  tab === id ? "sl-chip-active" : "sl-chip"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          {tab === "themes" && (
          <>
          <div>
            <div className="mb-2 flex items-center justify-between gap-3">
              <h4 className="text-[11px] font-black uppercase tracking-[0.22em] text-[var(--theme-text-strong)]">Motywy</h4>
              <span className="sl-chip rounded-full px-2 py-1 text-[9px] font-black uppercase tracking-widest">Kolor UI</span>
            </div>
          </div>
          {THEME_DEFINITIONS.map((theme) => {
            const owned = player.settings.ownedThemeIds.includes(theme.id);
            const active = player.settings.themeId === theme.id;
            const affordable = player.gold >= theme.cost;
            return (
              <div key={theme.id} className="sl-input rounded-2xl p-3">
                <div className="flex items-center gap-3">
                  <div className="sl-theme-preview h-14 w-14 shrink-0 rounded-2xl border border-white/10" style={{ background: theme.previewGradient }} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="truncate text-sm font-black uppercase tracking-widest text-[var(--theme-text)]">{theme.name}</h4>
                      {active && <span className="sl-chip-active rounded-full px-2 py-0.5 text-[9px] font-black uppercase tracking-widest">ON</span>}
                    </div>
                    <p className="sl-muted mt-1 line-clamp-2 text-xs leading-relaxed">{theme.description}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => (owned ? onSelect(theme.id) : onBuy(theme.id))}
                    disabled={!owned && !affordable}
                    className={[
                      "min-h-10 shrink-0 rounded-xl px-3 text-[10px] font-black uppercase tracking-widest active:scale-[0.98]",
                      owned
                        ? "sl-button-primary border"
                        : affordable
                          ? "border border-[color-mix(in_srgb,var(--theme-warning)_42%,transparent)] bg-[var(--theme-warning-soft)] text-[var(--theme-warning-text)]"
                          : "sl-button-secondary opacity-45",
                    ].join(" ")}
                  >
                    {owned ? "Użyj" : `${theme.cost}G`}
                  </button>
                </div>
              </div>
            );
          })}
          </>
          )}

          {tab === "wallpapers" && (
          <div className="pt-2">
            <div className="mb-2 flex items-center justify-between gap-3">
              <h4 className="text-[11px] font-black uppercase tracking-[0.22em] text-[var(--theme-text-strong)]">Tła interfejsu</h4>
              <span className="sl-chip rounded-full px-2 py-1 text-[9px] font-black uppercase tracking-widest">Folder tła</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {THEME_WALLPAPER_DEFINITIONS.map((wallpaper) => {
                const owned = player.settings.ownedThemeWallpaperIds.includes(wallpaper.id);
                const active = activeWallpaper.id === wallpaper.id;
                const affordable = player.gold >= wallpaper.cost;
                return (
                  <div key={wallpaper.id} className="sl-input overflow-hidden rounded-2xl">
                    <div className="relative h-24 bg-[var(--theme-card)]">
                      {wallpaper.preview ? (
                        <img src={wallpaper.preview} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <div className="h-full w-full bg-[var(--theme-panel-gradient)]" />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/12 to-transparent" />
                      {active && <span className="absolute right-2 top-2 sl-chip-active rounded-full px-2 py-1 text-[9px] font-black uppercase tracking-widest">ON</span>}
                    </div>
                    <div className="p-3">
                      <p className="truncate text-xs font-black uppercase tracking-widest text-[var(--theme-text-strong)]">{wallpaper.name}</p>
                      <p className="sl-muted mt-1 line-clamp-2 min-h-[2rem] text-[10px] leading-relaxed">{wallpaper.description}</p>
                      <button
                        type="button"
                        onClick={() => (owned ? onSelectWallpaper(wallpaper.id) : onBuyWallpaper(wallpaper.id))}
                        disabled={!owned && !affordable}
                        className={[
                          "mt-3 min-h-10 w-full rounded-xl px-3 text-[10px] font-black uppercase tracking-widest active:scale-[0.98]",
                          owned
                            ? "sl-button-primary"
                            : affordable
                              ? "border border-[color-mix(in_srgb,var(--theme-warning)_42%,transparent)] bg-[var(--theme-warning-soft)] text-[var(--theme-warning-text)]"
                              : "sl-button-secondary opacity-45",
                        ].join(" ")}
                      >
                        {owned ? "Użyj" : `${wallpaper.cost}G`}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          )}

          {tab === "effects" && (
          <div className="pt-2">
            <div className="mb-2 flex items-center justify-between gap-3">
              <h4 className="text-[11px] font-black uppercase tracking-[0.22em] text-[var(--theme-text-strong)]">Dodatki efektów</h4>
              <span className="sl-chip rounded-full px-2 py-1 text-[9px] font-black uppercase tracking-widest">Do każdego motywu</span>
            </div>
            <div className="grid gap-3">
              {THEME_EFFECT_DEFINITIONS.map((effect) => {
                const owned = player.settings.ownedThemeEffectIds.includes(effect.id);
                const active = player.settings.activeThemeEffectId === effect.id;
                const affordable = player.gold >= effect.cost;
                return (
                  <div key={effect.id} className="sl-input rounded-2xl p-3">
                    <div className="flex items-center gap-3">
                      <div
                        className={`sl-theme-preview h-14 w-14 shrink-0 rounded-2xl border border-[var(--theme-border)] ${
                          effect.id === "monarch-code" ? "sl-theme-effect-preview-monarch" : ""
                        }`}
                        style={{ background: effect.previewGradient }}
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="truncate text-sm font-black uppercase tracking-widest text-[var(--theme-text)]">{effect.name}</h4>
                          {active && <span className="sl-chip-active rounded-full px-2 py-0.5 text-[9px] font-black uppercase tracking-widest">ON</span>}
                        </div>
                        <p className="sl-muted mt-1 line-clamp-2 text-xs leading-relaxed">{effect.description}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => (owned ? onSelectEffect(effect.id) : onBuyEffect(effect.id))}
                        disabled={!owned && !affordable}
                        className={[
                          "min-h-10 shrink-0 rounded-xl px-3 text-[10px] font-black uppercase tracking-widest active:scale-[0.98]",
                          owned
                            ? "sl-button-primary border"
                            : affordable
                              ? "border border-[color-mix(in_srgb,var(--theme-warning)_42%,transparent)] bg-[var(--theme-warning-soft)] text-[var(--theme-warning-text)]"
                              : "sl-button-secondary opacity-45",
                        ].join(" ")}
                      >
                        {owned ? "Użyj" : `${effect.cost}G`}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          )}

          {tab === "owned" && (
            <div className="grid gap-3">
              <div className="sl-input rounded-2xl p-3">
                <p className="text-xs font-black uppercase tracking-widest text-[var(--theme-text-strong)]">Aktywny zestaw</p>
                <p className="sl-muted mt-1 text-xs leading-relaxed">
                  {activeTheme.name} · {activeWallpaper.name} · {activeEffect.name}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {player.settings.ownedThemeIds.map((id) => {
                  const theme = getThemeDefinition(id);
                  const active = player.settings.themeId === id;
                  return (
                    <button
                      key={`theme-${id}`}
                      type="button"
                      onClick={() => onSelect(id)}
                      className="sl-stat-tile overflow-hidden rounded-2xl text-left active:scale-[0.99]"
                    >
                      <div className="relative h-20" style={{ background: theme.previewGradient }}>
                        {active && <span className="absolute right-2 top-2 sl-chip-active rounded-full px-2 py-1 text-[9px] font-black uppercase tracking-widest">ON</span>}
                      </div>
                      <div className="p-3">
                        <p className="text-[10px] font-black uppercase tracking-widest text-[var(--theme-muted)]">Motyw</p>
                        <p className="mt-1 truncate text-xs font-black uppercase tracking-widest text-[var(--theme-text-strong)]">{theme.name}</p>
                      </div>
                    </button>
                  );
                })}
                {player.settings.ownedThemeWallpaperIds.map((id) => {
                  const wallpaper = getThemeWallpaperDefinition(id);
                  const active = activeWallpaper.id === id;
                  return (
                    <button
                      key={`wallpaper-${id}`}
                      type="button"
                      onClick={() => onSelectWallpaper(id)}
                      className="sl-stat-tile overflow-hidden rounded-2xl text-left active:scale-[0.99]"
                    >
                      <div className="relative h-20 bg-[var(--theme-input)]">
                        {wallpaper.preview ? <img src={wallpaper.preview} alt="" className="h-full w-full object-cover" /> : <div className="h-full w-full bg-[var(--theme-panel-gradient)]" />}
                        <div className="absolute inset-0 bg-gradient-to-t from-[color-mix(in_srgb,var(--theme-bg)_70%,transparent)] to-transparent" />
                        {active && <span className="absolute right-2 top-2 sl-chip-active rounded-full px-2 py-1 text-[9px] font-black uppercase tracking-widest">ON</span>}
                      </div>
                      <div className="p-3">
                        <p className="text-[10px] font-black uppercase tracking-widest text-[var(--theme-muted)]">Tło</p>
                        <p className="mt-1 truncate text-xs font-black uppercase tracking-widest text-[var(--theme-text-strong)]">{wallpaper.name}</p>
                      </div>
                    </button>
                  );
                })}
                {player.settings.ownedThemeEffectIds.map((id) => {
                  const effect = getThemeEffectDefinition(id);
                  const active = player.settings.activeThemeEffectId === id;
                  return (
                    <button
                      key={`effect-${id}`}
                      type="button"
                      onClick={() => onSelectEffect(id)}
                      className="sl-stat-tile overflow-hidden rounded-2xl text-left active:scale-[0.99]"
                    >
                      <div
                        className={`sl-theme-preview relative h-20 ${id === "monarch-code" ? "sl-theme-effect-preview-monarch" : ""}`}
                        style={{ background: effect.previewGradient }}
                      >
                        {active && <span className="absolute right-2 top-2 sl-chip-active rounded-full px-2 py-1 text-[9px] font-black uppercase tracking-widest">ON</span>}
                      </div>
                      <div className="p-3">
                        <p className="text-[10px] font-black uppercase tracking-widest text-[var(--theme-muted)]">Efekt</p>
                        <p className="mt-1 truncate text-xs font-black uppercase tracking-widest text-[var(--theme-text-strong)]">{effect.name}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function SystemAccordion({
  icon,
  title,
  status,
  open,
  onToggle,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  status: React.ReactNode;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="sl-accordion overflow-hidden rounded-2xl">
      <button
        type="button"
        onClick={onToggle}
        className="flex min-h-14 w-full items-center justify-between gap-3 px-3 py-3 text-left active:scale-[0.99]"
      >
        <span className="flex min-w-0 items-center gap-3">
          <span className="sl-icon-button grid h-10 w-10 shrink-0 place-items-center rounded-xl">{icon}</span>
          <span className="min-w-0">
            <span className="block truncate text-sm font-black uppercase tracking-widest text-[var(--theme-text-strong)]">{title}</span>
            <span className="sl-muted mt-0.5 block truncate text-xs font-bold">{status}</span>
          </span>
        </span>
        <ChevronDown className={`h-4 w-4 shrink-0 text-[var(--theme-icon)] transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && <div className="border-t border-[var(--theme-border)] p-3">{children}</div>}
    </div>
  );
}

function ToggleRow({
  label,
  description,
  enabled,
  onToggle,
}: {
  label: string;
  description: string;
  enabled: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="sl-input flex min-h-14 items-center justify-between gap-3 rounded-2xl px-3 py-3 text-left active:scale-[0.99]"
    >
      <span className="min-w-0">
        <span className="block text-sm font-black uppercase tracking-widest text-[var(--theme-text-strong)]">{label}</span>
        <span className="sl-muted mt-1 block text-xs leading-relaxed">{description}</span>
      </span>
      <span className={`shrink-0 rounded-xl px-3 py-2 text-[10px] font-black uppercase tracking-widest ${enabled ? "sl-toggle-active" : "sl-toggle"}`}>
        {enabled ? "ON" : "OFF"}
      </span>
    </button>
  );
}

function TogglePill({ icon, label, enabled, onToggle }: { icon: React.ReactNode; label: string; enabled: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={`flex min-h-11 items-center justify-center gap-2 rounded-2xl px-3 text-xs font-black uppercase tracking-widest active:scale-[0.98] ${
        enabled ? "sl-toggle-active" : "sl-toggle"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

function IntensitySelector({ value, onChange }: { value: PenaltyIntensity; onChange: (value: PenaltyIntensity) => void }) {
  const options: Array<{ value: PenaltyIntensity; label: string }> = [
    { value: "light", label: "Lekka" },
    { value: "normal", label: "Normalna" },
    { value: "hard", label: "Mocna" },
  ];

  return (
    <div className="sl-input rounded-2xl p-2">
      <p className="sl-muted px-1 pb-2 text-[9px] font-black uppercase tracking-widest">Intensywność</p>
      <div className="grid grid-cols-3 gap-2">
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={`min-h-10 rounded-xl text-[10px] font-black uppercase tracking-widest active:scale-[0.98] ${
              value === option.value ? "border border-[color-mix(in_srgb,var(--theme-danger)_36%,transparent)] bg-[color-mix(in_srgb,var(--theme-danger)_14%,transparent)] text-[var(--theme-danger-text)]" : "sl-toggle"
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function SectionTitle({ kicker, title, text }: { kicker: string; title: string; text?: string }) {
  return (
    <div className="sl-section rounded-[22px] p-4">
      <p className="sl-kicker text-[10px] font-black uppercase tracking-[0.28em]">{kicker}</p>
      <h2 className="mt-1 text-2xl font-black uppercase tracking-[0.04em] text-[var(--theme-text-strong)]">{title}</h2>
      {text ? <p className="sl-muted mt-2 text-sm leading-relaxed">{text}</p> : null}
    </div>
  );
}

function ProgressOrb({ value }: { value: number }) {
  const percent = Math.max(0, Math.min(100, Math.floor(value)));
  return (
    <div className="flex shrink-0 flex-col items-center gap-2" aria-label={`Postęp dziennego celu ${percent}%`}>
      <div
        className="relative grid h-[88px] w-[88px] place-items-center rounded-full p-[7px] shadow-[0_0_24px_color-mix(in_srgb,var(--theme-accent)_18%,transparent)]"
        style={{ background: `conic-gradient(var(--theme-progress-fill) ${percent}%, var(--theme-progress-track) 0)` }}
      >
        <div className="grid h-full w-full place-items-center rounded-full border border-[var(--theme-border)] text-center" style={{ background: "var(--theme-ring-bg)" }}>
          <span className="font-mono text-[22px] font-black leading-none tracking-[-0.03em] text-[var(--theme-text-strong)] tabular-nums">
            {percent}%
          </span>
        </div>
      </div>
      <span className="sl-chip-active rounded-full px-3 py-1 text-[8px] font-black uppercase leading-none tracking-[0.18em]">
        Quest
      </span>
    </div>
  );
}

function MiniStat({ icon, label, value }: { icon: React.ReactNode; label: string; value: React.ReactNode }) {
  return (
    <div className="sl-stat-tile rounded-2xl p-3">
      <div className="mb-2 text-[var(--theme-icon)]">{icon}</div>
      <div className="text-[9px] font-black uppercase tracking-widest text-[var(--theme-muted)]">{label}</div>
      <div className="mt-1 truncate text-sm font-black text-[var(--theme-text)]">{value}</div>
    </div>
  );
}

function AudioQuickTile({
  activeIcon: ActiveIcon,
  mutedIcon: MutedIcon,
  label,
  value,
  enabled,
  onOpen,
  onToggle,
}: {
  activeIcon: React.ElementType<{ className?: string }>;
  mutedIcon: React.ElementType<{ className?: string }>;
  label: string;
  value: string;
  enabled: boolean;
  onOpen: () => void;
  onToggle: () => void;
}) {
  const Icon = enabled ? ActiveIcon : MutedIcon;

  return (
    <div className="sl-stat-tile flex min-h-[92px] items-start justify-between gap-3 rounded-2xl p-3">
      <button
        type="button"
        onClick={onOpen}
        className="min-w-0 flex-1 text-left active:scale-[0.99]"
        aria-label={`Otwórz ustawienia: ${label}`}
      >
        <div className="mb-2 text-[var(--theme-icon)]">
          <Icon className="h-4 w-4" />
        </div>
        <div className="text-[9px] font-black uppercase tracking-widest text-[var(--theme-muted)]">{label}</div>
        <div className="mt-1 truncate text-sm font-black text-[var(--theme-text)]">{enabled ? value : "Wyciszone"}</div>
      </button>
      <button
        type="button"
        onClick={onToggle}
        className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl border active:scale-[0.96] ${enabled ? "sl-toggle-active" : "sl-toggle"}`}
        aria-label={enabled ? `Wycisz ${label}` : `Włącz ${label}`}
        aria-pressed={enabled}
      >
        <Icon className="h-4 w-4" />
      </button>
    </div>
  );
}

function AudioAlbumSheet({
  volume,
  systemAudioEnabled,
  musicVolume,
  backgroundMusicEnabled,
  musicTracks,
  musicTrackSettings,
  onVolumeChange,
  onToggleSystemAudio,
  onMusicVolumeChange,
  onToggleBackgroundMusic,
  onUpdateMusicTrackSettings,
  onRandomizeMusicTrack,
}: {
  volume: number;
  systemAudioEnabled: boolean;
  musicVolume: number;
  backgroundMusicEnabled: boolean;
  musicTracks: LocalMusicTrack[];
  musicTrackSettings?: MusicTrackSettings;
  onVolumeChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onToggleSystemAudio: (enabled: boolean) => void;
  onMusicVolumeChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onToggleBackgroundMusic: (enabled: boolean) => void;
  onUpdateMusicTrackSettings: (patch: Partial<MusicTrackSettings>) => void;
  onRandomizeMusicTrack: () => void;
}) {
  const currentTrackId = musicTrackSettings?.appTrackId ?? "symphonic-suite-lv1";
  const activeTrack = musicTracks.find((t) => t.id === currentTrackId) || musicTracks[0];

  const handleSelectTrack = (trackId: string) => {
    onUpdateMusicTrackSettings({ appTrackId: trackId });
    void playTrackById(trackId);
  };

  const handleNext = async () => {
    const nextId = await playNextTrack();
    if (nextId) {
      onUpdateMusicTrackSettings({ appTrackId: nextId });
    }
  };

  const handlePrev = async () => {
    const prevId = await playPreviousTrack();
    if (prevId) {
      onUpdateMusicTrackSettings({ appTrackId: prevId });
    }
  };

  const moodBadges: Record<string, { label: string; color: string }> = {
    system: { label: "STATUS / MENU", color: "text-violet-300 border-violet-500/40 bg-violet-950/50" },
    training: { label: "TRENING", color: "text-cyan-300 border-cyan-500/40 bg-cyan-950/50" },
    reflex: { label: "REFLEKS / BRAMY", color: "text-emerald-300 border-emerald-500/40 bg-emerald-950/50" },
    shadow: { label: "EKSTRAKCJA CIENIA", color: "text-purple-300 border-purple-500/40 bg-purple-950/50" },
    combat: { label: "WALKA / BOSS", color: "text-rose-300 border-rose-500/40 bg-rose-950/50" },
    arcane: { label: "MISTYKA / RUNY", color: "text-blue-300 border-blue-500/40 bg-blue-950/50" },
    reward: { label: "NAGRODA", color: "text-amber-300 border-amber-500/40 bg-amber-950/50" },
    penalty: { label: "MONARCHA / KARA", color: "text-red-300 border-red-500/40 bg-red-950/50" },
    alternate: { label: "ALTERNATYWNY OST", color: "text-slate-300 border-slate-500/40 bg-slate-900/60" },
  };

  return (
    <div className="space-y-4">
      {/* Active Track Hero Player */}
      <div className="relative overflow-hidden rounded-2xl border border-cyan-500/30 bg-gradient-to-br from-slate-950 via-slate-900 to-black p-4 shadow-[0_0_30px_rgba(6,182,212,0.15)]">
        <div className="flex items-center gap-3.5">
          <div className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-cyan-400/40 bg-gradient-to-br from-cyan-950 to-slate-950 text-cyan-300 shadow-[0_0_20px_rgba(6,182,212,0.3)]">
            <Disc3 className={`h-8 w-8 text-cyan-400 ${backgroundMusicEnabled ? "animate-spin" : ""}`} style={{ animationDuration: "6s" }} />
            {backgroundMusicEnabled && (
              <span className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-cyan-400 text-[8px] font-black text-black">
                ▶
              </span>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <span className="rounded px-1.5 py-0.5 font-mono text-[9px] font-black uppercase tracking-wider text-cyan-400 bg-cyan-950/80 border border-cyan-500/30">
                {activeTrack ? (moodBadges[activeTrack.mood]?.label || activeTrack.mood) : "OST"}
              </span>
              {backgroundMusicEnabled && (
                <span className="flex items-center gap-0.5 text-cyan-400 text-[10px] font-bold">
                  <span className="inline-block h-2.5 w-0.5 bg-cyan-400 animate-pulse" />
                  <span className="inline-block h-3.5 w-0.5 bg-cyan-400 animate-pulse" style={{ animationDelay: "150ms" }} />
                  <span className="inline-block h-2 w-0.5 bg-cyan-400 animate-pulse" style={{ animationDelay: "300ms" }} />
                </span>
              )}
            </div>
            <h4 className="mt-1 truncate text-sm font-black uppercase tracking-wide text-white">
              {activeTrack?.title || "Solo Leveling OST"}
            </h4>
            <p className="truncate text-xs font-semibold text-slate-400">
              {activeTrack?.artist || "Hiroyuki Sawano"}
            </p>
          </div>
        </div>

        {/* Playback Controls */}
        <div className="mt-4 flex items-center justify-between border-t border-slate-800/80 pt-3">
          <button
            type="button"
            onClick={onRandomizeMusicTrack}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-700 bg-slate-900/60 text-slate-300 transition-colors hover:text-white active:scale-95"
            title="Losowy utwór"
            aria-label="Losowy utwór"
          >
            <Shuffle className="h-4 w-4" />
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrev}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-700 bg-slate-900/60 text-slate-300 transition-colors hover:text-white active:scale-95"
              title="Poprzedni utwór"
              aria-label="Poprzedni utwór"
            >
              <SkipBack className="h-4 w-4" />
            </button>

            <button
              type="button"
              onClick={() => onToggleBackgroundMusic(!backgroundMusicEnabled)}
              className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 text-black shadow-[0_0_20px_rgba(6,182,212,0.4)] transition-all active:scale-95"
              title={backgroundMusicEnabled ? "Zatrzymaj" : "Odtwórz"}
              aria-label={backgroundMusicEnabled ? "Zatrzymaj" : "Odtwórz"}
            >
              {backgroundMusicEnabled ? <Pause className="h-5 w-5 fill-current" /> : <Play className="h-5 w-5 fill-current translate-x-0.5" />}
            </button>

            <button
              type="button"
              onClick={handleNext}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-700 bg-slate-900/60 text-slate-300 transition-colors hover:text-white active:scale-95"
              title="Następny utwór"
              aria-label="Następny utwór"
            >
              <SkipForward className="h-4 w-4" />
            </button>
          </div>

          <button
            type="button"
            onClick={() => void testBackgroundMusic()}
            className="flex h-10 px-3 items-center justify-center gap-1.5 rounded-xl border border-slate-700 bg-slate-900/60 font-mono text-[10px] font-bold uppercase tracking-wider text-slate-300 transition-colors hover:text-white active:scale-95"
            title="Przetestuj audio"
          >
            <Volume2 className="h-3.5 w-3.5" />
            <span>Test</span>
          </button>
        </div>
      </div>

      {/* Sliders Card */}
      <div className="sl-card space-y-3 rounded-2xl p-4">
        {/* SFX Volume */}
        <div>
          <div className="flex items-center justify-between gap-4">
            <span className="text-xs font-black uppercase tracking-widest text-[var(--theme-text-strong)]">
              Efekty dźwiękowe (SFX)
            </span>
            <button
              type="button"
              onClick={() => onToggleSystemAudio(!systemAudioEnabled)}
              className={`rounded-lg border px-2 py-0.5 text-[10px] font-black uppercase tracking-wider ${systemAudioEnabled ? "border-cyan-500/40 bg-cyan-950/60 text-cyan-300" : "border-slate-800 text-slate-400"}`}
            >
              {systemAudioEnabled ? `${Math.round(volume * 100)}% ON` : "OFF"}
            </button>
          </div>
          <input className="mt-2 w-full accent-cyan-400" type="range" min="0" max="1" step="0.05" value={volume} onChange={onVolumeChange} />
        </div>

        {/* Music Volume */}
        <div className="border-t border-slate-800/80 pt-3">
          <div className="flex items-center justify-between gap-4">
            <span className="text-xs font-black uppercase tracking-widest text-[var(--theme-text-strong)]">
              Głośność Muzyki
            </span>
            <button
              type="button"
              onClick={() => onToggleBackgroundMusic(!backgroundMusicEnabled)}
              className={`rounded-lg border px-2 py-0.5 text-[10px] font-black uppercase tracking-wider ${backgroundMusicEnabled ? "border-violet-500/40 bg-violet-950/60 text-violet-300" : "border-slate-800 text-slate-400"}`}
            >
              {backgroundMusicEnabled ? `${Math.round(musicVolume * 100)}% ON` : "OFF"}
            </button>
          </div>
          <input className="mt-2 w-full accent-violet-400" type="range" min="0" max="1" step="0.05" value={musicVolume} onChange={onMusicVolumeChange} />
        </div>
      </div>

      {/* Full Tracklist Album */}
      <div className="sl-card rounded-2xl p-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
          <div className="flex items-center gap-2">
            <Headphones className="h-4 w-4 text-cyan-400" />
            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-[var(--theme-text-strong)]">
              Album Muzyczny ({musicTracks.length} Utworów)
            </h3>
          </div>
          <button
            type="button"
            onClick={() => onUpdateMusicTrackSettings({ appTrackId: "auto" })}
            className={`rounded-lg border px-2 py-1 font-mono text-[9px] font-black uppercase tracking-wider transition-colors ${
              (musicTrackSettings?.appTrackId ?? "auto") === "auto"
                ? "border-cyan-400 bg-cyan-950 text-cyan-300 shadow-[0_0_10px_rgba(6,182,212,0.3)]"
                : "border-slate-700 bg-slate-900/60 text-slate-400 hover:text-slate-200"
            }`}
          >
            Auto System
          </button>
        </div>

        <p className="sl-muted mt-2 text-[11px] leading-relaxed">
          Wybierz dowolny utwór z oficjalnej ścieżki dźwiękowej Solo Leveling.
        </p>

        <div className="mt-3 space-y-2 max-h-80 overflow-y-auto pr-1">
          {musicTracks.map((track, idx) => {
            const isCurrent = (musicTrackSettings?.appTrackId ?? "auto") === track.id || (musicTrackSettings?.appTrackId === "auto" && idx === 0);
            const mood = moodBadges[track.mood] || { label: track.mood, color: "text-slate-300 border-slate-500/40 bg-slate-900/50" };

            return (
              <button
                key={track.id}
                type="button"
                onClick={() => handleSelectTrack(track.id)}
                className={`w-full flex items-center justify-between gap-3 rounded-xl border p-2.5 text-left transition-all active:scale-[0.99] ${
                  isCurrent
                    ? "border-cyan-400/80 bg-gradient-to-r from-cyan-950/80 to-slate-950 text-cyan-100 shadow-[0_0_15px_rgba(6,182,212,0.2)]"
                    : "border-slate-800/80 bg-black/40 hover:bg-slate-900/60 hover:border-slate-700 text-slate-300"
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg font-mono text-xs font-black ${
                    isCurrent ? "bg-cyan-500 text-black shadow-[0_0_10px_rgba(6,182,212,0.5)]" : "bg-slate-800/80 text-slate-400"
                  }`}>
                    {isCurrent && backgroundMusicEnabled ? <Volume2 className="h-4 w-4" /> : String(idx + 1).padStart(2, "0")}
                  </div>
                  <div className="min-w-0">
                    <p className={`truncate text-xs font-black uppercase tracking-wide ${isCurrent ? "text-cyan-200" : "text-slate-200"}`}>
                      {track.title}
                    </p>
                    <p className="truncate text-[10px] font-semibold text-slate-400">
                      {track.artist}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className={`rounded border px-1.5 py-0.5 font-mono text-[8px] font-black uppercase tracking-wider ${mood.color}`}>
                    {mood.label}
                  </span>
                  <span className={`grid h-7 w-7 place-items-center rounded-lg border text-xs ${
                    isCurrent
                      ? "border-cyan-400/60 bg-cyan-950 text-cyan-300"
                      : "border-slate-800 bg-slate-900/60 text-slate-400"
                  }`}>
                    {isCurrent && backgroundMusicEnabled ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3 translate-x-0.5" />}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function MusicTrackSelect({
  label,
  value,
  tracks,
  onChange,
}: {
  label: string;
  value: "auto" | string;
  tracks: LocalMusicTrack[];
  onChange: (trackId: "auto" | string) => void;
}) {
  return (
    <label className="sl-input rounded-2xl px-3 py-2">
      <span className="block text-[9px] font-black uppercase tracking-widest text-[var(--theme-muted)]">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-1 min-h-9 w-full bg-transparent text-xs font-black uppercase tracking-widest text-[var(--theme-text)] outline-none"
      >
        <option value="auto">Auto Systemu</option>
        {tracks.map((track) => (
          <option key={track.id} value={track.id}>
            {track.title}
          </option>
        ))}
      </select>
    </label>
  );
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: React.ReactNode }) {
  return (
    <div className="sl-input flex items-center justify-between gap-3 rounded-2xl px-3 py-3">
      <span className="flex min-w-0 items-center gap-2 text-sm text-[var(--theme-text)]">{icon}{label}</span>
      <span className="text-right text-xs font-bold text-[var(--theme-muted)]">{value}</span>
    </div>
  );
}

function Meter({ label, value, color, right, compact = false }: { label: string; value: number; color: "blue" | "cyan" | "green"; right?: React.ReactNode; compact?: boolean }) {
  const fill =
    color === "green"
      ? "var(--theme-success)"
      : color === "cyan"
        ? "var(--theme-accent)"
        : "var(--theme-progress-fill)";
  return (
    <div>
      {!compact && (
        <div className="sl-muted mb-1.5 flex items-center justify-between text-[10px] font-black uppercase tracking-widest">
          <span>{label}</span>
          <span>{right ?? `${Math.floor(value)}%`}</span>
        </div>
      )}
      <div className="h-2 overflow-hidden rounded-full ring-1 ring-[var(--theme-border)]" style={{ background: "var(--theme-progress-track)" }}>
        <motion.div
          className="h-full shadow-[0_0_16px_color-mix(in_srgb,var(--theme-accent)_48%,transparent)]"
          style={{ background: fill }}
          initial={false}
          animate={{ width: `${Math.max(0, Math.min(100, value))}%` }}
        />
      </div>
    </div>
  );
}

function SmallButton({ onClick, icon, label, muted = false }: { onClick: () => void; icon: React.ReactNode; label: string; muted?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex min-h-10 items-center justify-center gap-1 rounded-xl px-2 text-[10px] font-black uppercase tracking-widest active:scale-[0.98] ${
        muted
          ? "sl-button-secondary"
          : "sl-button-primary"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

function ActionButton({ onClick, icon, label, accent = false }: { onClick: () => void; icon: React.ReactNode; label: string; accent?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex min-h-12 items-center justify-center gap-2 rounded-2xl px-3 text-xs font-black uppercase tracking-widest active:scale-[0.98] ${
        accent
          ? "sl-button-primary"
          : "sl-button-secondary"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

function usePenaltyFontPrankLoop(player: PlayerState | null) {
  const activePenalty = player ? getActivePenalty(player.penalties) : null;
  const enabled = Boolean(
    activePenalty &&
      player?.settings.funnyPenaltiesEnabled &&
      player.settings.phonePranksEnabled &&
      player.settings.fontPenaltyEnabled
  );

  useEffect(() => {
    if (!enabled || !activePenalty) {
      void restorePenaltyFontScale();
      return;
    }

    const applyRandomScale = async () => {
      const status = await checkWriteSettings();
      if (!status.canWriteSettings) return;
      const base = getPenaltyFontScale(activePenalty.intensity);
      const jitter = 0.92 + Math.random() * 0.18;
      await setPenaltyFontScale(Number((base * jitter).toFixed(2)));
    };

    const interval = window.setInterval(() => {
      void applyRandomScale();
    }, 180000);

    return () => {
      window.clearInterval(interval);
      void restorePenaltyFontScale();
    };
  }, [enabled, activePenalty?.id, activePenalty?.intensity]);
}

function getPenaltyFontScale(intensity: PenaltyIntensity) {
  if (intensity === "light") return 1.08;
  if (intensity === "hard") return 1.28;
  return 1.16;
}

function useDailyResetCountdown() {
  const [countdown, setCountdown] = useState(() => formatResetCountdown(getMsUntilNextLocalDay()));

  useEffect(() => {
    const update = () => setCountdown(formatResetCountdown(getMsUntilNextLocalDay()));
    update();
    const timer = window.setInterval(update, 1000);
    return () => window.clearInterval(timer);
  }, []);

  return countdown;
}

type DailyReminderMode = "hidden" | "compact" | "expanded";

function useSmartDailyQuestReminder(enabled: boolean) {
  const [mode, setMode] = useState<DailyReminderMode>("hidden");

  useEffect(() => {
    if (!enabled) {
      setMode("hidden");
      return;
    }

    let hideTimer: number | undefined;
    let compactTimer: number | undefined;
    const showReminder = () => {
      const msLeft = getMsUntilNextLocalDay();
      const profile = getDailyReminderProfile(msLeft);
      window.clearTimeout(hideTimer);
      window.clearTimeout(compactTimer);
      setMode(profile.expanded ? "expanded" : "compact");
      if (profile.expanded) {
        compactTimer = window.setTimeout(() => setMode("compact"), profile.expandedMs);
      }
      hideTimer = window.setTimeout(() => setMode("hidden"), profile.totalMs);
    };

    const schedule = () => {
      const profile = getDailyReminderProfile(getMsUntilNextLocalDay());
      const firstTimer = window.setTimeout(showReminder, profile.firstDelayMs);
      const interval = window.setInterval(showReminder, profile.intervalMs);
      return { firstTimer, interval };
    };

    const timers = schedule();

    return () => {
      window.clearTimeout(timers.firstTimer);
      window.clearInterval(timers.interval);
      window.clearTimeout(hideTimer);
      window.clearTimeout(compactTimer);
    };
  }, [enabled]);

  return [mode, () => setMode("hidden")] as const;
}

function getDailyReminderProfile(msLeft: number) {
  const hoursLeft = msLeft / 3_600_000;
  if (hoursLeft > 12) {
    return { firstDelayMs: 4 * 60 * 60_000, intervalMs: 6 * 60 * 60_000, expanded: false, expandedMs: 0, totalMs: 3500 };
  }
  if (hoursLeft > 6) {
    return { firstDelayMs: 60 * 60_000, intervalMs: 2 * 60 * 60_000, expanded: false, expandedMs: 0, totalMs: 4500 };
  }
  if (hoursLeft > 3) {
    return { firstDelayMs: 15 * 60_000, intervalMs: 45 * 60_000, expanded: false, expandedMs: 0, totalMs: 6000 };
  }
  if (hoursLeft > 1) {
    return { firstDelayMs: 5 * 60_000, intervalMs: 20 * 60_000, expanded: false, expandedMs: 0, totalMs: 7500 };
  }
  return { firstDelayMs: 45_000, intervalMs: 7 * 60_000, expanded: true, expandedMs: 3500, totalMs: 9000 };
}

function getCombatPower(player: PlayerState) {
  const stats = { ...player.stats };
  for (const item of Object.values(player.equipment || {})) {
    if (item) stats[item.bonusType] += item.bonusValue;
  }

  return Math.floor(stats.STR * 2.5 + stats.AGILITY * 2 + stats.VITALITY * 2 + stats.SENSE * 1.5 + stats.INTELLIGENCE * 1.5 + player.level * 25);
}

function getHunterAbilityRows(player: PlayerState) {
  const totals = (player.workoutHistory || []).reduce(
    (acc, entry) => {
      const trackableId = entry.trackableExerciseId || (isTrackableExerciseId(entry.exercise) ? entry.exercise : null);
      if (trackableId) acc[trackableId] = (acc[trackableId] || 0) + Number(entry.value || 0);
      return acc;
    },
    { pushups: 0, situps: 0, squats: 0, runningKm: 0 } as Record<TrackableExerciseId, number>
  );
  const planPullups = (player.workoutSessions || []).reduce((sum, session) => {
    return sum + session.results.reduce((setSum, result) => {
      const exercise = session.exercises[result.exerciseIndex];
      const name = `${exercise?.name || ""} ${exercise?.primaryMuscles?.join(" ") || ""}`.toLowerCase();
      return name.includes("podciąg") || name.includes("plecy") || name.includes("grzbiet") ? setSum + result.reps : setSum;
    }, 0);
  }, 0);

  const rows = [
    {
      name: "Siła pchnięcia",
      value: totals.pushups,
      unit: "pompek",
      description: "Wzmacnia STR i stabilność barków.",
    },
    {
      name: "Rdzeń łowcy",
      value: totals.situps,
      unit: "brzuszków",
      description: "Wzmacnia VITALITY i kontrolę tułowia.",
    },
    {
      name: "Praca nóg",
      value: totals.squats,
      unit: "przysiadów",
      description: "Wzmacnia AGILITY i tempo ruchu.",
    },
    {
      name: "Krok bramy",
      value: totals.runningKm,
      unit: "km",
      description: "Wzmacnia SENSE i wytrzymałość.",
    },
    {
      name: "Podciąganie",
      value: planPullups,
      unit: "powtórzeń",
      description: planPullups > 0 ? "Odblokowane przez ćwiczenia pleców w planie." : "Dodaj ćwiczenia pleców z katalogu, żeby odblokować.",
    },
  ];

  return rows.map((row) => {
    const thresholds = row.name === "Krok bramy" ? [1, 5, 15, 35, 75] : [25, 100, 250, 600, 1200];
    const level = thresholds.filter((threshold) => row.value >= threshold).length;
    const next = thresholds[Math.min(level, thresholds.length - 1)] || thresholds[thresholds.length - 1];
    const previous = level > 0 ? thresholds[level - 1] : 0;
    const progress = level >= thresholds.length ? 100 : Math.max(5, Math.min(100, ((row.value - previous) / Math.max(1, next - previous)) * 100));
    return {
      ...row,
      level,
      progress,
      description: `${row.description} ${row.name === "Krok bramy" ? row.value.toFixed(1) : Math.floor(row.value)} ${row.unit}.`,
    };
  });
}

function getDailyExerciseAbilityLevel(player: PlayerState, exerciseId: TrackableExerciseId) {
  const total = (player.workoutHistory || [])
    .filter((entry) => entry.trackableExerciseId === exerciseId || entry.exercise === exerciseId)
    .reduce((sum, entry) => sum + Number(entry.value || 0), 0);
  const thresholds = exerciseId === "runningKm" ? [1, 5, 15, 35, 75] : [25, 100, 250, 600, 1200];
  return thresholds.filter((threshold) => total >= threshold).length;
}

function formatValue(value: number, exercise: DailyQuestItem) {
  return exercise.trackableExerciseId === "runningKm" || exercise.unit.toLowerCase().includes("km")
    ? value.toFixed(1)
    : String(Math.floor(value));
}

function isTrackableExerciseId(value: string): value is TrackableExerciseId {
  return value === "pushups" || value === "situps" || value === "squats" || value === "runningKm";
}
