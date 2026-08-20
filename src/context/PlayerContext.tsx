import React, { createContext, useContext, useEffect, useState } from "react";
import { INITIAL_PLAYER, MiniGameSettlement, PlayerState, WearableSample, WorkoutPlanSession, WorkoutSource, normalizeMusicTrackSettings } from "../types";
import { toast } from "sonner";
import { applyXpGain, getLocalDateKey, recalculateMaxStats } from "../game/playerMath";
import {
  getDailyQuestCompletionReward,
  getDailyQuestXpForDelta,
  normalizeDailyQuest,
  resetDailyQuestProgress,
  syncLegacyDailyQuestFields,
  getDailyQuestItemProgress,
  updateDailyQuestItemProgress,
  isDailyQuestComplete,
} from "../game/dailyQuest";
import {
  calculateMiniGameCompletion,
  MiniGameCompletionInput,
  normalizeMiniGamesProgress,
} from "../game/miniGameProgress";
import {
  getNextShadowExtractionUpgradeCost,
  getShadowExtractionEffect,
  normalizeShadowExtractionUpgrades,
  type ShadowExtractionEffectId,
  type ShadowExtractionUpgradeId,
} from "../game/shadowExtractionUpgrades";
import {
  consumeActiveMiniGameBooster,
  getMiniGameShopBooster,
  getMiniGameShopEffect,
  getMiniGameShopUpgrade,
  getNextMiniGameUpgradeCost,
  isMiniGameShopBoosterId,
  isMiniGameShopEffectId,
  isMiniGameShopUpgradeId,
  normalizeMiniGameShop,
  type MiniGameShopBoosterId,
  type MiniGameShopEffectId,
  type MiniGameShopUpgradeId,
} from "../game/miniGameShop";
import { getAvatarForPlayer, getRankForLevel, isErykLikeName } from "../services/systemService";
import {
  startWorkoutPlanSession as createWorkoutPlanSession,
  summarizeWorkoutSession,
} from "../game/workoutSession";
import { normalizeWorkoutPlan } from "../game/workoutPlan";
import {
  completePenalty as completePenaltyState,
  ensureDailyPenalty,
  getActivePenalty,
  getPenaltyRewardMultiplier,
  markPenaltyPhoneAttempt,
  normalizePenalties,
  normalizePenaltySettings,
} from "../game/penalties";
import { normalizeNotificationSettings } from "../game/notifications";
import { appendWearableSample, normalizeWearableSamples } from "../game/wearableAnalysis";
import {
  cancelDailyTrainingNotifications,
  clearWorkoutOngoingNotification,
  notifyDailyReward,
  notifyPenaltyCreated,
  scheduleDailyTrainingNotifications,
  showWorkoutOngoingNotification,
} from "../services/notificationService";
import { playAlertSound, playGateSound, playRewardSound, playTrainingStartSound } from "../utils/audio";
import { getThemeWallpaperDefinition, normalizeOwnedThemeEffects, normalizeOwnedThemeWallpapers, normalizeOwnedThemes } from "../game/themeShop";
import { emitRewardAnimation } from "../services/rewardAnimationBus";
import { normalizeEquipmentInventory, normalizeEquipmentLoadout, normalizePlayerEquipment } from "../game/equipment";
import { normalizeMiniGameBackgrounds } from "../game/miniGameBackgrounds";
import { normalizeMiniGameGridSettings } from "../game/miniGameGrid";

interface PlayerContextType {
  player: PlayerState | null;
  loading: boolean;
  setPlayer: (player: PlayerState | null) => Promise<void>;
  updateStats: (stat: keyof PlayerState["stats"], amount: number) => void;
  addXp: (amount: number) => void;
  updateDailyQuest: (itemId: string, amount: number, source?: WorkoutSource) => void;
  addWearableSample: (sample: WearableSample) => void;
  triggerPenalty: () => void;
  clearPenalty: () => void;
  completePenalty: (penaltyId: string) => void;
  markPenaltyPrankApplied: (penaltyId: string, patch: { appliedWallpaper?: boolean; appliedFont?: boolean }) => void;
  completeCombat: (xp: number, gold: number, hp: number, equipment: PlayerState["equipment"]) => void;
  completeMiniGame: (result: MiniGameCompletionInput) => MiniGameSettlement | null;
  buyShadowExtractionEffect: (effectId: ShadowExtractionEffectId) => void;
  buyShadowExtractionUpgrade: (upgradeId: ShadowExtractionUpgradeId) => void;
  selectShadowExtractionEffect: (effectId: ShadowExtractionEffectId) => void;
  buyMiniGameEffect: (gameId: MiniGameCompletionInput["gameId"], effectId: MiniGameShopEffectId) => void;
  selectMiniGameEffect: (gameId: MiniGameCompletionInput["gameId"], effectId: MiniGameShopEffectId) => void;
  buyMiniGameUpgrade: (gameId: MiniGameCompletionInput["gameId"], upgradeId: MiniGameShopUpgradeId) => void;
  buyMiniGameBooster: (gameId: MiniGameCompletionInput["gameId"], boosterId: MiniGameShopBoosterId) => void;
  activateMiniGameBooster: (gameId: MiniGameCompletionInput["gameId"], boosterId: MiniGameShopBoosterId) => void;
  consumeMiniGameBooster: (gameId: MiniGameCompletionInput["gameId"]) => void;
  startWorkoutPlanSession: () => void;
  saveWorkoutPlanSession: (session: WorkoutPlanSession) => void;
  completeWorkoutPlanSession: (session: WorkoutPlanSession) => void;
  discardWorkoutPlanSession: () => void;
  resetAllData: () => void;
}

const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

const STORAGE_KEY = "sololeveler_player_data";
const HISTORY_KEY = "sololeveler_history_data";
const MINI_GAME_LOW_SCORE_FLOOR: Record<MiniGameCompletionInput["gameId"], number> = {
  "gate-dodge": 80,
  "shadow-strike": 110,
  "mana-memory": 70,
  "rune-lock": 90,
  "shadow-extraction": 120,
};

const LEGACY_UI_SURFACE_OPACITY = 0.92;
const DEFAULT_THEME_WALLPAPER_ID = "solo-purple-citadel";

const normalizeUiSurfaceOpacity = (value: unknown) => {
  const numeric = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(numeric)) return INITIAL_PLAYER.settings.uiSurfaceOpacity;
  if (Math.abs(numeric - LEGACY_UI_SURFACE_OPACITY) < 0.001) return INITIAL_PLAYER.settings.uiSurfaceOpacity;
  return Math.min(1, Math.max(0.55, numeric));
};

const normalizeGraphicsQuality = (value: unknown) => {
  return value === "performance" || value === "cinematic" || value === "balanced"
    ? value
    : INITIAL_PLAYER.settings.graphicsQuality;
};

const normalizeActiveWallpaperId = (owned: unknown, active: unknown, rawUiSurfaceOpacity: unknown) => {
  const ownedIds = normalizeOwnedThemeWallpapers(owned);
  const activeId = typeof active === "string" ? active : null;
  const rawOpacity = typeof rawUiSurfaceOpacity === "number" ? rawUiSurfaceOpacity : Number(rawUiSurfaceOpacity);
  const legacyHiddenWallpaper = activeId === "none" && Math.abs(rawOpacity - LEGACY_UI_SURFACE_OPACITY) < 0.001;
  if (legacyHiddenWallpaper && ownedIds.includes(DEFAULT_THEME_WALLPAPER_ID)) {
    return DEFAULT_THEME_WALLPAPER_ID;
  }
  return activeId && ownedIds.includes(activeId)
    ? getThemeWallpaperDefinition(activeId).id
    : INITIAL_PLAYER.settings.activeWallpaperId;
};

export function PlayerProvider({ children }: { children: React.ReactNode }) {
  const [player, setPlayerState] = useState<PlayerState | null>(null);
  const [loading, setLoading] = useState(true);
  const resetAttemptedRef = React.useRef(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        let data: PlayerState = JSON.parse(saved);
        data = {
            ...INITIAL_PLAYER,
            ...data,
            stats: { ...INITIAL_PLAYER.stats, ...(data.stats || {}) },
            dailyQuest: normalizeDailyQuest(data.dailyQuest),
            workoutHistory: data.workoutHistory || [],
            workoutPlan: normalizeWorkoutPlan(data.workoutPlan),
            activeWorkoutSession: data.activeWorkoutSession || null,
            workoutSessions: data.workoutSessions || [],
            wearableSamples: normalizeWearableSamples(data.wearableSamples),
            settings: {
              ...INITIAL_PLAYER.settings,
              ...(data.settings || {}),
              ...normalizePenaltySettings(data.settings),
              musicTracks: normalizeMusicTrackSettings(data.settings?.musicTracks),
              miniGameGridByGame: normalizeMiniGameGridSettings(data.settings?.miniGameGridByGame),
              uiSurfaceOpacity: normalizeUiSurfaceOpacity(data.settings?.uiSurfaceOpacity),
              graphicsQuality: normalizeGraphicsQuality(data.settings?.graphicsQuality),
              ownedThemeIds: normalizeOwnedThemes(data.settings?.ownedThemeIds),
              themeId: normalizeOwnedThemes(data.settings?.ownedThemeIds).includes(data.settings?.themeId as any)
                ? (data.settings?.themeId as PlayerState["settings"]["themeId"])
                : INITIAL_PLAYER.settings.themeId,
              ownedThemeEffectIds: normalizeOwnedThemeEffects(data.settings?.ownedThemeEffectIds),
              activeThemeEffectId: normalizeOwnedThemeEffects(data.settings?.ownedThemeEffectIds).includes(data.settings?.activeThemeEffectId as any)
                ? (data.settings?.activeThemeEffectId as PlayerState["settings"]["activeThemeEffectId"])
                : INITIAL_PLAYER.settings.activeThemeEffectId,
              ownedThemeWallpaperIds: normalizeOwnedThemeWallpapers(data.settings?.ownedThemeWallpaperIds),
              activeWallpaperId: normalizeActiveWallpaperId(
                data.settings?.ownedThemeWallpaperIds,
                data.settings?.activeWallpaperId,
                data.settings?.uiSurfaceOpacity
              ),
              notifications: normalizeNotificationSettings(data.settings?.notifications),
            },
            penalties: normalizePenalties(data.penalties),
            equipment: normalizeEquipmentLoadout(data.equipment),
            miniGames: normalizeMiniGamesProgress(data.miniGames),
            miniGameUpgrades: {
              shadowExtraction: normalizeShadowExtractionUpgrades(data.miniGameUpgrades?.shadowExtraction),
              shop: normalizeMiniGameShop(data.miniGameUpgrades?.shop),
            },
            miniGameBackgrounds: normalizeMiniGameBackgrounds(data.miniGameBackgrounds),
            inventory: normalizeEquipmentInventory(data.inventory),
            skills: data.skills || [],
            quests: data.quests || INITIAL_PLAYER.quests,
            gold: data.gold || 0,
            skillPoints: data.skillPoints || 0,
            maxHp: data.maxHp || 100,
            maxMp: data.maxMp || 10
        };

        data.rank = `${getRankForLevel(data.level)}-Rank`;
        data = normalizePlayerEquipment(data);
        if (
          isErykLikeName(data.name) ||
          !data.avatarUrl ||
          data.avatarUrl === "fallback" ||
          data.avatarUrl.length > 45000
        ) {
          data.avatarUrl = getAvatarForPlayer(data.name, data.level, data.jobClass, data.stats);
        }
        const recalculated = recalculateMaxStats(data);
        data.maxHp = recalculated.maxHp;
        data.maxMp = recalculated.maxMp;
        data.hp = Math.min(data.hp, data.maxHp);
        data.mp = Math.min(data.mp, data.maxMp);
        data.availablePoints = Math.max(0, data.availablePoints);
        
        const today = getLocalDateKey();
        if (data.lastLoginDate !== today && !resetAttemptedRef.current) {
          resetAttemptedRef.current = true;
          const missedQuest = data.lastLoginDate ? !data.dailyQuest.completedAt : false;
          const missedDateKey = data.lastLoginDate;
          const previousStreak = data.dailyQuest.streak || 0;
          data.dailyQuest = resetDailyQuestProgress(data.dailyQuest, missedQuest ? 0 : previousStreak);
          if (missedQuest) {
            data.penalties = ensureDailyPenalty(data.penalties, missedDateKey, data.settings);
            data.dailyQuest = syncLegacyDailyQuestFields({ ...data.dailyQuest, penaltyGiven: true });
            const activePenalty = getActivePenalty(data.penalties);
            if (activePenalty) void notifyPenaltyCreated(data.settings.notifications, activePenalty);
          }
          data.lastLoginDate = today;
          savePlayer(data); 
        } else {
          setPlayerState(data);
        }
      } else {
        setPlayerState(null);
      }
    } catch {
      setPlayerState(null);
    }
    setLoading(false);
  }, []);

  const notificationSettingsKey = JSON.stringify(player?.settings.notifications || null);

  useEffect(() => {
    if (!player || loading) return;
    void scheduleDailyTrainingNotifications(
      player.settings.notifications,
      Boolean(player.dailyQuest.completedAt),
      {
        name: player.name,
        rank: getRankForLevel(player.level),
        level: player.level,
      }
    );
  }, [loading, notificationSettingsKey, player?.dailyQuest.completedAt, player?.level, player?.name]);


  useEffect(() => {
    if (!player || loading) return;
    if (player.activeWorkoutSession) {
      const summary = player.activeWorkoutSession.status === "paused" ? "Sesja zapauzowana." : "Plan jest uruchomiony. Wróć do aplikacji, żeby kontynuować.";
      void showWorkoutOngoingNotification(player.settings.notifications, summary, player.activeWorkoutSession.status === "paused");
    } else {
      void clearWorkoutOngoingNotification();
    }
  }, [loading, player?.activeWorkoutSession?.id, player?.activeWorkoutSession?.status, notificationSettingsKey]);

  const savePlayer = async (updated: PlayerState) => {
    const nextRank = `${getRankForLevel(updated.level)}-Rank`;
    updated = {
      ...updated,
      rank: nextRank,
      miniGames: normalizeMiniGamesProgress(updated.miniGames),
      dailyQuest: normalizeDailyQuest(updated.dailyQuest),
      miniGameUpgrades: {
        ...INITIAL_PLAYER.miniGameUpgrades,
        ...(updated.miniGameUpgrades || {}),
        shadowExtraction: normalizeShadowExtractionUpgrades(updated.miniGameUpgrades?.shadowExtraction),
        shop: normalizeMiniGameShop(updated.miniGameUpgrades?.shop),
      },
      workoutPlan: normalizeWorkoutPlan(updated.workoutPlan),
      workoutSessions: updated.workoutSessions || [],
      activeWorkoutSession: updated.activeWorkoutSession || null,
      wearableSamples: normalizeWearableSamples(updated.wearableSamples),
      settings: {
        ...INITIAL_PLAYER.settings,
        ...(updated.settings || {}),
        ...normalizePenaltySettings(updated.settings),
        musicTracks: normalizeMusicTrackSettings(updated.settings?.musicTracks),
        miniGameGridByGame: normalizeMiniGameGridSettings(updated.settings?.miniGameGridByGame),
        uiSurfaceOpacity: normalizeUiSurfaceOpacity(updated.settings?.uiSurfaceOpacity),
        graphicsQuality: normalizeGraphicsQuality(updated.settings?.graphicsQuality),
        ownedThemeIds: normalizeOwnedThemes(updated.settings?.ownedThemeIds),
        themeId: normalizeOwnedThemes(updated.settings?.ownedThemeIds).includes(updated.settings?.themeId as any)
          ? (updated.settings?.themeId as PlayerState["settings"]["themeId"])
          : INITIAL_PLAYER.settings.themeId,
        ownedThemeEffectIds: normalizeOwnedThemeEffects(updated.settings?.ownedThemeEffectIds),
        activeThemeEffectId: normalizeOwnedThemeEffects(updated.settings?.ownedThemeEffectIds).includes(updated.settings?.activeThemeEffectId as any)
          ? (updated.settings?.activeThemeEffectId as PlayerState["settings"]["activeThemeEffectId"])
          : INITIAL_PLAYER.settings.activeThemeEffectId,
        ownedThemeWallpaperIds: normalizeOwnedThemeWallpapers(updated.settings?.ownedThemeWallpaperIds),
        activeWallpaperId: normalizeActiveWallpaperId(
          updated.settings?.ownedThemeWallpaperIds,
          updated.settings?.activeWallpaperId,
          updated.settings?.uiSurfaceOpacity
        ),
        notifications: normalizeNotificationSettings(updated.settings?.notifications),
      },
      penalties: normalizePenalties(updated.penalties),
      equipment: normalizeEquipmentLoadout(updated.equipment),
      inventory: normalizeEquipmentInventory(updated.inventory),
      miniGameBackgrounds: normalizeMiniGameBackgrounds(updated.miniGameBackgrounds),
    };
    updated = normalizePlayerEquipment(updated);

    if (
      isErykLikeName(updated.name) ||
      !updated.avatarUrl ||
      updated.avatarUrl === "fallback" ||
      updated.avatarUrl.length > 45000
    ) {
      updated = {
        ...updated,
        avatarUrl: getAvatarForPlayer(updated.name, updated.level, updated.jobClass, updated.stats),
      };
    }
    
    const { maxHp, maxMp } = recalculateMaxStats(updated);
    updated.maxHp = maxHp;
    updated.maxMp = maxMp;
    updated.hp = Math.min(updated.hp, maxHp);
    updated.mp = Math.min(updated.mp, maxMp);
    updated.availablePoints = Math.max(0, updated.availablePoints);

    setPlayerState(updated);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch {
      // localStorage can fail in private mode or when storage quota is exceeded.
    }
  };

  const setPlayer = async (newPlayer: PlayerState | null) => {
    if (newPlayer) {
      await savePlayer(newPlayer);
    } else {
       setPlayerState(null);
       localStorage.removeItem(STORAGE_KEY);
    }
  };

  const animateReward = (
    source: Parameters<typeof emitRewardAnimation>[0]["source"],
    xp: number,
    gold: number
  ) => {
    if (xp > 0) emitRewardAnimation({ type: "xp", amount: Math.floor(xp), source });
    if (gold > 0) emitRewardAnimation({ type: "gold", amount: Math.floor(gold), source });
  };

  const addXp = (amount: number) => {
    if (!player) return;
    
    const updatedPlayer = applyXpGain(player, amount);
    savePlayer(updatedPlayer);
    animateReward("system", amount, 0);

    logHistory(updatedPlayer, 0);
  };

  const updateStats = (stat: keyof PlayerState["stats"], amount: number) => {
    if (!player || player.availablePoints < amount) return;
    
    const newStats = { ...player.stats, [stat]: player.stats[stat] + amount };
    let updatedPlayer = { ...player, stats: newStats, availablePoints: player.availablePoints - amount };
    
    const { maxHp, maxMp } = recalculateMaxStats(updatedPlayer);
    updatedPlayer.maxHp = maxHp;
    updatedPlayer.maxMp = maxMp;
    updatedPlayer.hp = Math.min(updatedPlayer.hp, maxHp);
    updatedPlayer.mp = Math.min(updatedPlayer.mp, maxMp);

    savePlayer(updatedPlayer);

    logHistory(updatedPlayer, 0);
  };

  const updateDailyQuest = (itemId: string, amount: number, source: WorkoutSource = "manual") => {
    if (!player) return;

    const {
      dailyQuest: progressedQuest,
      item,
      delta: effectiveDelta,
    } = updateDailyQuestItemProgress(player.dailyQuest, itemId, amount);

    if (!item || effectiveDelta <= 0) return;

    const completionReward = getDailyQuestCompletionReward();
    let xpToAdd = getDailyQuestXpForDelta(item, effectiveDelta);
    let showQuestComplete = false;

    const newQuest = syncLegacyDailyQuestFields({ ...progressedQuest });
    let tempPlayer = { ...player, dailyQuest: newQuest };

    if (isDailyQuestComplete(newQuest) && !newQuest.completedAt) {
      newQuest.completedAt = new Date().toISOString();
      newQuest.penaltyGiven = Boolean(getActivePenalty(player.penalties));
      newQuest.streak = (player.dailyQuest.streak || 0) + 1;
      xpToAdd += completionReward.xp;
      tempPlayer.availablePoints += completionReward.attributePoints;
      tempPlayer.gold += completionReward.gold;
      showQuestComplete = true;
    }

    tempPlayer.workoutHistory = [
      ...(player.workoutHistory || []),
      {
        id: `workout_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        exercise: item.id,
        exerciseLabel: item.label,
        trackableExerciseId: item.trackableExerciseId,
        value: effectiveDelta,
        source,
        timestamp: new Date().toISOString(),
      },
    ];

    const updatedPlayer = applyXpGain(tempPlayer, xpToAdd);
    
    if (updatedPlayer.level > player.level) {
       toast.success(`AWANS NA ${updatedPlayer.level} POZIOM!`);
       animateReward("daily", xpToAdd, showQuestComplete ? completionReward.gold : 0);
    } else if (!showQuestComplete && xpToAdd > 0) {
       animateReward("daily", xpToAdd, 0);
    }

    if (showQuestComplete) {
       toast.success("CODZIENNE ZADANIE UKOŃCZONE!");
       playRewardSound();
       if (updatedPlayer.level <= player.level) {
         animateReward("daily", xpToAdd, completionReward.gold);
       }
       void cancelDailyTrainingNotifications();
       void notifyDailyReward(
         updatedPlayer.settings.notifications,
         "Daily Quest ukończony",
         `Nagroda: +${Math.floor(xpToAdd)} XP, +${completionReward.gold} gold.`
       );
    }

    savePlayer(updatedPlayer);
    logHistory(updatedPlayer, xpToAdd);
  };

  const addWearableSample = (sample: WearableSample) => {
    if (!player) return;

    const currentSamples = player.wearableSamples || [];
    const nextSamples = appendWearableSample(currentSamples, sample);
    const currentLast = currentSamples[currentSamples.length - 1]?.id;
    const nextLast = nextSamples[nextSamples.length - 1]?.id;

    if (nextSamples.length === currentSamples.length && nextLast === currentLast) return;

    savePlayer({
      ...player,
      wearableSamples: nextSamples,
      settings: {
        ...player.settings,
        wearableConnected: sample.source === "directBle" ? true : player.settings.wearableConnected,
      },
    });
  };

  const startWorkoutPlanSession = () => {
    if (!player) return;
    if (player.activeWorkoutSession) {
      toast("Masz aktywną sesję planu do wznowienia.");
      return;
    }

    const session = createWorkoutPlanSession(player.workoutPlan || []);
    if (!session) {
      toast.error("Dodaj ćwiczenie do planu przed startem.");
      return;
    }

    savePlayer({
      ...player,
      activeWorkoutSession: session,
    });
    playTrainingStartSound();
  };

  const saveWorkoutPlanSession = (session: WorkoutPlanSession) => {
    if (!player) return;
    savePlayer({
      ...player,
      activeWorkoutSession: session,
    });
  };

  const completeWorkoutPlanSession = (session: WorkoutPlanSession) => {
    if (!player) return;

    const summary = summarizeWorkoutSession(session);
    const reward = session.reward ?? {
      xp: 0,
      gold: 0,
      completionRatio: summary.completionRatio,
      completedSets: summary.completedSets,
      totalSets: summary.totalSets,
      skippedSets: summary.skippedSets,
      pacePercent: summary.pacePercent,
      paceGrade: summary.paceGrade,
      newRecord: summary.newRecord,
      eligibleForPaceBonus: false,
    };

    const workoutPlan = applySessionSummaryToPlan(player.workoutPlan || [], summary);
    const tempPlayer = {
      ...player,
      gold: player.gold + reward.gold,
      workoutPlan,
      activeWorkoutSession: null,
      workoutSessions: [...(player.workoutSessions || []), summary],
    };
    const updatedPlayer = applyXpGain(tempPlayer, reward.xp);

    if (updatedPlayer.level > player.level) {
      toast.success(`AWANS NA ${updatedPlayer.level} POZIOM!`);
      playRewardSound();
    } else if (reward.xp > 0 || reward.gold > 0) {
      playRewardSound();
    }

    animateReward("workout", reward.xp, reward.gold);
    if (reward.newRecord) toast.success("NOWY REKORD PLANU!");
    if (reward.xp > 0 || reward.gold > 0) {
      void notifyDailyReward(updatedPlayer.settings.notifications, "Plan treningowy ukończony", `+${reward.xp} XP · +${reward.gold} gold`);
    }
    void clearWorkoutOngoingNotification();

    savePlayer(updatedPlayer);
    logHistory(updatedPlayer, reward.xp);
  };

  const discardWorkoutPlanSession = () => {
    if (!player) return;
    savePlayer({
      ...player,
      activeWorkoutSession: null,
    });
    void clearWorkoutOngoingNotification();
  };

  const logHistory = async (currentPlayerState: PlayerState, xpGainedDelta: number = 0) => {
    const dateKey = getLocalDateKey();
    try {
      const historyStr = localStorage.getItem(HISTORY_KEY) || "{}";
      const historyData = JSON.parse(historyStr);
      
      const prevEntry = historyData[dateKey] || { xpGained: 0 };
      const todayWorkoutSessions = (currentPlayerState.workoutSessions || []).filter((session) => session.dateKey === dateKey);
      const workoutPlanMinutes = todayWorkoutSessions.reduce((sum, session) => sum + session.activeSeconds, 0) / 60;
      const workoutPlanSets = todayWorkoutSessions.reduce((sum, session) => sum + session.completedSets, 0);
      const workoutPlanVolume = todayWorkoutSessions.reduce((sum, session) => sum + session.volumeKg, 0);
      const workoutPlanGold = todayWorkoutSessions.reduce((sum, session) => sum + session.goldReward, 0);

      const historyEntry = {
        date: dateKey,
        pushups: currentPlayerState.dailyQuest.pushups,
        situps: currentPlayerState.dailyQuest.situps,
        squats: currentPlayerState.dailyQuest.squats,
        runningKm: currentPlayerState.dailyQuest.runningKm,
        dailyItems: currentPlayerState.dailyQuest.items
          .filter((item) => item.enabled)
          .map((item) => ({
            id: item.id,
            label: item.label,
            unit: item.unit,
            target: item.target,
            value: getDailyQuestItemProgress(currentPlayerState.dailyQuest, item.id),
            source: item.trackableExerciseId ? "trackable" : "manual",
          })),
        xpGained: prevEntry.xpGained + (xpGainedDelta || 0),
        workoutPlanSessions: todayWorkoutSessions.length,
        workoutPlanMinutes: Number(workoutPlanMinutes.toFixed(1)),
        workoutPlanSets,
        workoutPlanVolume: Number(workoutPlanVolume.toFixed(1)),
        workoutPlanGold,
        completed: !!currentPlayerState.dailyQuest.completedAt,
        streak: currentPlayerState.dailyQuest.streak || 0,
        level: currentPlayerState.level,
        xp: currentPlayerState.xp,
        STR: currentPlayerState.stats.STR,
        VITALITY: currentPlayerState.stats.VITALITY,
        AGILITY: currentPlayerState.stats.AGILITY,
        INTELLIGENCE: currentPlayerState.stats.INTELLIGENCE,
        SENSE: currentPlayerState.stats.SENSE,
        hp: currentPlayerState.hp,
        maxHp: currentPlayerState.maxHp,
        mp: currentPlayerState.mp,
        maxMp: currentPlayerState.maxMp,
        gold: currentPlayerState.gold,
        updatedAt: new Date().toISOString(),
      };

      historyData[dateKey] = historyEntry;
      localStorage.setItem(HISTORY_KEY, JSON.stringify(historyData));
    } catch {
      // History is non-critical; gameplay state has already been saved.
    }
  }

  const triggerPenalty = () => {
    if (!player) return;
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const missedDateKey = getLocalDateKey(yesterday);
    const penalties = ensureDailyPenalty(player.penalties, missedDateKey, player.settings);
    const activePenalty = getActivePenalty(penalties);
    if (activePenalty) void notifyPenaltyCreated(player.settings.notifications, activePenalty);
    savePlayer({ ...player, penalties, dailyQuest: { ...player.dailyQuest, penaltyGiven: true } });
  };

  const clearPenalty = () => {
    if (!player) return;

    const activePenalty = getActivePenalty(player.penalties);
    const penalties = activePenalty ? completePenaltyState(player.penalties, activePenalty.id) : normalizePenalties(player.penalties);
    const hasRemainingPenalty = Boolean(getActivePenalty(penalties));

    let tempPlayer = {
      ...player, 
      penalties,
      dailyQuest: { 
        ...player.dailyQuest, 
        penaltyGiven: hasRemainingPenalty,
        completedAt: new Date().toISOString() 
      }
    };

    const updatedPlayer = applyXpGain(tempPlayer, 200);
    savePlayer(updatedPlayer);
    animateReward("penalty", 200, 0);

    logHistory(updatedPlayer, 200);
  };

  const completePenalty = (penaltyId: string) => {
    if (!player) return;

    const penalties = completePenaltyState(player.penalties, penaltyId);
    const hasRemainingPenalty = Boolean(getActivePenalty(penalties));
    const updatedPlayer = applyXpGain(
      {
        ...player,
        penalties,
        dailyQuest: {
          ...player.dailyQuest,
          penaltyGiven: hasRemainingPenalty,
        },
        gold: player.gold + 15,
      },
      80
    );

    toast.success("Kara wykonana. System wraca do normy.");
    animateReward("penalty", 80, 15);
    savePlayer(updatedPlayer);
    logHistory(updatedPlayer, 80);
  };

  const markPenaltyPrankApplied = (penaltyId: string, patch: { appliedWallpaper?: boolean; appliedFont?: boolean }) => {
    if (!player) return;
    savePlayer({
      ...player,
      penalties: markPenaltyPhoneAttempt(player.penalties, penaltyId, patch),
    });
  };

  const completeCombat = (xp: number, gold: number, hp: number, equipment: PlayerState["equipment"]) => {
    if (!player) return;

    let tempPlayer = {
      ...player,
      hp: hp,
      gold: player.gold + gold,
      equipment: equipment,
    };

    const updatedPlayer = applyXpGain(tempPlayer, xp);
    if (updatedPlayer.level > player.level) {
       toast.success(`AWANS NA ${updatedPlayer.level} POZIOM!`);
       playRewardSound();
    } else if (xp > 0 || gold > 0) {
       playRewardSound();
    }

    animateReward("combat", xp, gold);

    savePlayer(updatedPlayer);
    logHistory(updatedPlayer, xp);
  };

  const completeMiniGame = (result: MiniGameCompletionInput): MiniGameSettlement | null => {
    if (!player) return null;

    const today = getLocalDateKey();
    const miniGames = normalizeMiniGamesProgress(player.miniGames);
    const previousProgress = miniGames[result.gameId];
    const previousBest = previousProgress.bestScore;
    const completion = calculateMiniGameCompletion({
      progress: previousProgress,
      result,
      today,
    });
    const previousGameLevel = completion.difficultyLevel;
    const penaltyMultiplier = getPenaltyRewardMultiplier(player.penalties);
    const activePenalty = penaltyMultiplier < 1;
    const roundXpMultiplier = Math.min(1.45, Math.max(1, Number(result.xpMultiplier || 1)));
    const xpReward = Math.floor(completion.xpReward * penaltyMultiplier * roundXpMultiplier);
    const goldReward = Math.floor(completion.goldReward * penaltyMultiplier);
    const lowScoreLoss = !result.won && result.score < MINI_GAME_LOW_SCORE_FLOOR[result.gameId];
    const hpRestored = Math.max(0, Math.floor(result.hpRestored || 0));
    const hpPenalty = lowScoreLoss && hpRestored <= 0;
    const hpLoss = hpPenalty ? Math.max(10, Math.floor(player.maxHp * 0.05)) : 0;
    const nextHp = Math.max(0, Math.min(player.maxHp, player.hp + hpRestored - hpLoss));
    const hpBefore = player.hp;
    const goldBefore = player.gold;
    const xpBefore = player.xp;
    const playerLevelBefore = player.level;

    let tempPlayer = {
      ...player,
      gold: player.gold + goldReward,
      hp: nextHp,
      inventory: completion.loot ? [...player.inventory, completion.loot] : player.inventory,
      miniGames: {
        ...miniGames,
        [result.gameId]: completion.progress,
      },
      dailyQuest: {
        ...player.dailyQuest,
        miniGamesPlayed: player.dailyQuest.miniGamesPlayed + 1,
        penaltyGiven: player.dailyQuest.penaltyGiven,
      }
    };

    const updatedPlayer = applyXpGain(tempPlayer, xpReward);

    if (result.won) {
      playGateSound();
    } else {
      playAlertSound();
    }

    if (updatedPlayer.level > player.level) {
      playRewardSound();
    }

    const settlement: MiniGameSettlement = {
      gameId: result.gameId,
      result,
      score: Math.floor(result.score),
      won: result.won,
      previousBest,
      newBest: Math.floor(result.score) > previousBest,
      previousGameLevel,
      nextGameLevel: completion.progress.level,
      difficultyLevel: completion.difficultyLevel,
      rewardMultiplier: completion.progress.rewardMultiplier,
      xpReward,
      goldReward,
      loot: completion.loot ?? null,
      hpLoss,
      hpRestored,
      hpBefore,
      hpAfter: updatedPlayer.hp,
      playerLevelBefore,
      playerLevelAfter: updatedPlayer.level,
      xpBefore,
      xpAfter: updatedPlayer.xp,
      goldBefore,
      goldAfter: updatedPlayer.gold,
      penaltyApplied: activePenalty && (completion.xpReward > xpReward || completion.goldReward > goldReward),
      boosterApplied: roundXpMultiplier > 1,
      xpMultiplier: roundXpMultiplier,
    };

    savePlayer(updatedPlayer);
    logHistory(updatedPlayer, xpReward);
    return settlement;
  };

  const buyShadowExtractionEffect = (effectId: ShadowExtractionEffectId) => {
    if (!player) return;

    const shadowExtraction = normalizeShadowExtractionUpgrades(player.miniGameUpgrades?.shadowExtraction);
    if (shadowExtraction.ownedEffects.includes(effectId)) {
      savePlayer({
        ...player,
        miniGameUpgrades: {
          ...player.miniGameUpgrades,
          shadowExtraction: {
            ...shadowExtraction,
            selectedEffect: effectId,
          },
        },
      });
      return;
    }

    const effect = getShadowExtractionEffect(effectId);
    if (player.gold < effect.cost) {
      toast.error("Za mało złota.");
      return;
    }

    savePlayer({
      ...player,
      gold: player.gold - effect.cost,
      miniGameUpgrades: {
        ...player.miniGameUpgrades,
        shadowExtraction: {
          ...shadowExtraction,
          ownedEffects: [...shadowExtraction.ownedEffects, effectId],
          selectedEffect: effectId,
        },
      },
    });
    toast.success(`Kupiono efekt: ${effect.name}`);
  };

  const buyShadowExtractionUpgrade = (upgradeId: ShadowExtractionUpgradeId) => {
    if (!player) return;

    const shadowExtraction = normalizeShadowExtractionUpgrades(player.miniGameUpgrades?.shadowExtraction);
    const cost = getNextShadowExtractionUpgradeCost(shadowExtraction, upgradeId);
    if (cost === null) {
      toast("Ulepszenie ma maksymalny poziom.");
      return;
    }

    if (player.gold < cost) {
      toast.error("Za mało złota.");
      return;
    }

    savePlayer({
      ...player,
      gold: player.gold - cost,
      miniGameUpgrades: {
        ...player.miniGameUpgrades,
        shadowExtraction: {
          ...shadowExtraction,
          upgrades: {
            ...shadowExtraction.upgrades,
            [upgradeId]: shadowExtraction.upgrades[upgradeId] + 1,
          },
        },
      },
    });
    toast.success("Ulepszenie aktywne.");
  };

  const selectShadowExtractionEffect = (effectId: ShadowExtractionEffectId) => {
    if (!player) return;

    const shadowExtraction = normalizeShadowExtractionUpgrades(player.miniGameUpgrades?.shadowExtraction);
    if (!shadowExtraction.ownedEffects.includes(effectId)) {
      toast.error("Najpierw kup ten efekt.");
      return;
    }

    savePlayer({
      ...player,
      miniGameUpgrades: {
        ...player.miniGameUpgrades,
        shadowExtraction: {
          ...shadowExtraction,
          selectedEffect: effectId,
        },
      },
    });
  };

  const buyMiniGameEffect = (gameId: MiniGameCompletionInput["gameId"], effectId: MiniGameShopEffectId) => {
    if (!player || !isMiniGameShopEffectId(effectId)) return;
    const shop = normalizeMiniGameShop(player.miniGameUpgrades?.shop);
    const owned = shop.ownedEffects[gameId] || [];
    if (owned.includes(effectId)) {
      selectMiniGameEffect(gameId, effectId);
      return;
    }

    const effect = getMiniGameShopEffect(effectId);
    if (player.gold < effect.cost) {
      toast.error("Za mało złota.");
      return;
    }

    savePlayer({
      ...player,
      gold: player.gold - effect.cost,
      miniGameUpgrades: {
        ...player.miniGameUpgrades,
        shop: {
          ...shop,
          ownedEffects: {
            ...shop.ownedEffects,
            [gameId]: [...owned, effectId],
          },
          selectedEffectByGame: {
            ...shop.selectedEffectByGame,
            [gameId]: effectId,
          },
        },
      },
    });
    toast.success(`Kupiono efekt: ${effect.name}`);
  };

  const selectMiniGameEffect = (gameId: MiniGameCompletionInput["gameId"], effectId: MiniGameShopEffectId) => {
    if (!player || !isMiniGameShopEffectId(effectId)) return;
    const shop = normalizeMiniGameShop(player.miniGameUpgrades?.shop);
    if (!(shop.ownedEffects[gameId] || []).includes(effectId)) {
      toast.error("Najpierw kup ten efekt.");
      return;
    }

    savePlayer({
      ...player,
      miniGameUpgrades: {
        ...player.miniGameUpgrades,
        shop: {
          ...shop,
          selectedEffectByGame: {
            ...shop.selectedEffectByGame,
            [gameId]: effectId,
          },
        },
      },
    });
  };

  const buyMiniGameUpgrade = (gameId: MiniGameCompletionInput["gameId"], upgradeId: MiniGameShopUpgradeId) => {
    if (!player || !isMiniGameShopUpgradeId(upgradeId)) return;
    const shop = normalizeMiniGameShop(player.miniGameUpgrades?.shop);
    const upgrade = getMiniGameShopUpgrade(upgradeId);
    const cost = getNextMiniGameUpgradeCost(shop, gameId, upgradeId);
    if (cost === null) {
      toast("Ulepszenie ma maksymalny poziom.");
      return;
    }
    if (player.gold < cost) {
      toast.error("Za mało złota.");
      return;
    }

    savePlayer({
      ...player,
      gold: player.gold - cost,
      miniGameUpgrades: {
        ...player.miniGameUpgrades,
        shop: {
          ...shop,
          upgrades: {
            ...shop.upgrades,
            [gameId]: {
              ...(shop.upgrades[gameId] || {}),
              [upgradeId]: (shop.upgrades[gameId]?.[upgradeId] || 0) + 1,
            },
          },
        },
      },
    });
    toast.success(`Ulepszenie: ${upgrade.name}`);
  };

  const buyMiniGameBooster = (gameId: MiniGameCompletionInput["gameId"], boosterId: MiniGameShopBoosterId) => {
    if (!player || !isMiniGameShopBoosterId(boosterId)) return;
    const shop = normalizeMiniGameShop(player.miniGameUpgrades?.shop);
    const booster = getMiniGameShopBooster(boosterId);
    if (player.gold < booster.cost) {
      toast.error("Za mało złota.");
      return;
    }

    savePlayer({
      ...player,
      gold: player.gold - booster.cost,
      miniGameUpgrades: {
        ...player.miniGameUpgrades,
        shop: {
          ...shop,
          boosters: {
            ...shop.boosters,
            [gameId]: {
              ...(shop.boosters[gameId] || {}),
              [boosterId]: (shop.boosters[gameId]?.[boosterId] || 0) + 1,
            },
          },
          activeBoosterByGame: {
            ...shop.activeBoosterByGame,
            [gameId]: boosterId,
          },
        },
      },
    });
    toast.success(`Booster gotowy: ${booster.name}`);
  };

  const activateMiniGameBooster = (gameId: MiniGameCompletionInput["gameId"], boosterId: MiniGameShopBoosterId) => {
    if (!player || !isMiniGameShopBoosterId(boosterId)) return;
    const shop = normalizeMiniGameShop(player.miniGameUpgrades?.shop);
    if ((shop.boosters[gameId]?.[boosterId] || 0) <= 0) {
      toast.error("Nie masz tego boostera.");
      return;
    }

    savePlayer({
      ...player,
      miniGameUpgrades: {
        ...player.miniGameUpgrades,
        shop: {
          ...shop,
          activeBoosterByGame: {
            ...shop.activeBoosterByGame,
            [gameId]: boosterId,
          },
        },
      },
    });
  };

  const consumeMiniGameBooster = (gameId: MiniGameCompletionInput["gameId"]) => {
    if (!player) return;
    const shop = consumeActiveMiniGameBooster(player.miniGameUpgrades?.shop, gameId);
    savePlayer({
      ...player,
      miniGameUpgrades: {
        ...player.miniGameUpgrades,
        shop,
      },
    });
  };

  const resetAllData = () => {
      if(window.confirm("Na pewno chcesz zresetować postępy? Ta operacja jest nieodwracalna.")) {
          localStorage.removeItem(STORAGE_KEY);
          localStorage.removeItem(HISTORY_KEY);
          setPlayerState(null);
          window.location.reload();
      }
  }

  return (
    <PlayerContext.Provider
      value={{
        player,
        loading,
        setPlayer,
        updateStats,
        addXp,
        updateDailyQuest,
        addWearableSample,
        triggerPenalty,
        clearPenalty,
        completePenalty,
        markPenaltyPrankApplied,
        completeCombat,
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
        resetAllData,
      }}
    >
      {children}
    </PlayerContext.Provider>
  );
}

function applySessionSummaryToPlan(
  plan: PlayerState["workoutPlan"],
  summary: PlayerState["workoutSessions"][number]
) {
  return plan.map((exercise) => {
    const completedResults = summary.results.filter((result) =>
      !result.skipped &&
      summary.exercises[result.exerciseIndex]?.planExerciseId === exercise.id
    );

    if (completedResults.length === 0) return exercise;

    const nextSets = completedResults.map((result) => ({
      id: `session_${summary.id}_${result.id}`,
      dateKey: summary.dateKey,
      reps: result.reps,
      weightKg: result.weightKg,
      completed: true,
      timestamp: result.completedAt,
    }));

    return {
      ...exercise,
      sets: [...exercise.sets.slice(-80 + nextSets.length), ...nextSets],
      lastCompletedAt: summary.completedAt,
    };
  });
}

export function usePlayer() {
  const context = useContext(PlayerContext);
  if (context === undefined) {
    throw new Error("usePlayer must be used within a PlayerProvider");
  }
  return context;
}
