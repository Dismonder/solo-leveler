import { getLocalDateKey } from "./game/playerMath";
import type { MiniGameCompletionInput, MiniGameId, MiniGameProgress } from "./game/miniGameProgress";
import {
  createDefaultShadowExtractionUpgrades,
  type ShadowExtractionUpgrades,
} from "./game/shadowExtractionUpgrades";
import {
  createDefaultMiniGameShop,
  type MiniGameShopState,
} from "./game/miniGameShop";

export type WorkoutSource = "manual" | "phoneSensor" | "wearable" | "healthConnect";

export type DailyQuestTrackableId = "pushups" | "situps" | "squats" | "runningKm";
export type DailyQuestStat = "STR" | "VITALITY" | "AGILITY" | "INTELLIGENCE" | "SENSE";

export type DailyQuestItem = {
  id: string;
  label: string;
  unit: string;
  target: number;
  manualSmall: number;
  manualLarge: number;
  stat: DailyQuestStat;
  catalogExerciseId?: string;
  trackableExerciseId?: DailyQuestTrackableId;
  enabled: boolean;
};

export type DailyQuestProgress = Record<string, number>;

export type DailyQuestState = {
  pushups: number;
  situps: number;
  squats: number;
  runningKm: number;
  items: DailyQuestItem[];
  progressByItemId: DailyQuestProgress;
  completedAt: string | null;
  penaltyGiven: boolean;
  miniGamesPlayed: number;
  streak: number;
};

export type WorkoutEntry = {
  id: string;
  exercise: string;
  exerciseLabel?: string;
  trackableExerciseId?: DailyQuestTrackableId;
  value: number;
  source: WorkoutSource;
  timestamp: string;
};

export type WearableSampleSource = "directBle" | "healthConnect";

export type WearableSample = {
  id: string;
  source: WearableSampleSource;
  timestamp: string;
  dateKey: string;
  deviceId?: string;
  deviceName?: string;
  provider?: string;
  connectionMode?: string;
  batteryLevel?: number;
  heartRate?: number;
  heartRateMin?: number;
  heartRateMax?: number;
  heartRateAvg?: number;
  heartRateSamples?: number;
  rssi?: number;
  steps?: number;
  distanceKm?: number;
  activeCaloriesKcal?: number;
  exerciseMinutes?: number;
  dataOrigins?: string[];
  services?: string[];
  characteristicsCount?: number;
  diagnostics?: string[];
};

export type WorkoutPlanSet = {
  id: string;
  dateKey: string;
  reps: number;
  weightKg: number;
  completed: boolean;
  timestamp: string;
};

export type WorkoutPlanExercise = {
  id: string;
  catalogExerciseId: string;
  name: string;
  category: string;
  equipment: string;
  primaryMuscles: string[];
  goal: string;
  targetArea: string;
  targetSets: number;
  targetReps: number;
  defaultWeightKg: number;
  restSeconds: number;
  notes: string;
  sets: WorkoutPlanSet[];
  createdAt: string;
  lastCompletedAt: string | null;
};

export type WorkoutPlanSessionStatus = "active" | "paused" | "resting" | "completed" | "cancelled";
export type WorkoutSessionPaceGrade = "tooFast" | "faster" | "onPace" | "slower";

export type WorkoutPlanSessionExerciseSnapshot = {
  id: string;
  planExerciseId: string;
  catalogExerciseId: string;
  name: string;
  category: string;
  equipment: string;
  primaryMuscles: string[];
  goal: string;
  targetArea: string;
  notes: string;
  order: number;
  targetSets: number;
  targetReps: number;
  weightKg: number;
  restSeconds: number;
};

export type WorkoutPlanSessionSetResult = {
  id: string;
  exerciseSnapshotId: string;
  exerciseIndex: number;
  setIndex: number;
  reps: number;
  weightKg: number;
  skipped: boolean;
  startedAt: string;
  completedAt: string;
  durationSeconds: number;
};

export type WorkoutPlanSessionReward = {
  xp: number;
  gold: number;
  completionRatio: number;
  completedSets: number;
  totalSets: number;
  skippedSets: number;
  pacePercent: number;
  paceGrade: WorkoutSessionPaceGrade;
  newRecord: boolean;
  eligibleForPaceBonus: boolean;
};

export type WorkoutPlanSession = {
  id: string;
  planSignature: string;
  status: WorkoutPlanSessionStatus;
  exercises: WorkoutPlanSessionExerciseSnapshot[];
  exerciseIndex: number;
  setIndex: number;
  results: WorkoutPlanSessionSetResult[];
  startedAt: string;
  updatedAt: string;
  currentStepStartedAt: string;
  pausedAt: string | null;
  totalPausedSeconds: number;
  restStartedAt: string | null;
  restEndsAt: string | null;
  estimatedSeconds: number;
  completedAt: string | null;
  reward: WorkoutPlanSessionReward | null;
};

export type WorkoutPlanSessionSummary = {
  id: string;
  planSignature: string;
  dateKey: string;
  startedAt: string;
  completedAt: string;
  activeSeconds: number;
  estimatedSeconds: number;
  totalPausedSeconds: number;
  completedSets: number;
  totalSets: number;
  skippedSets: number;
  totalReps: number;
  volumeKg: number;
  completionRatio: number;
  pacePercent: number;
  paceGrade: WorkoutSessionPaceGrade;
  newRecord: boolean;
  xpReward: number;
  goldReward: number;
  exercises: WorkoutPlanSessionExerciseSnapshot[];
  results: WorkoutPlanSessionSetResult[];
};

export type TrackerStatus = "idle" | "calibrating" | "active" | "unavailable" | "error";

export type BonusGameResult = {
  score: number;
  completed: boolean;
  xpReward: number;
  streakBonus: number;
};

export type PenaltyIntensity = "light" | "normal" | "hard";

export type PenaltySettings = {
  penaltyExercisesEnabled: boolean;
  funnyPenaltiesEnabled: boolean;
  phonePranksEnabled: boolean;
  wallpaperPenaltyEnabled: boolean;
  fontPenaltyEnabled: boolean;
  penaltyIntensity: PenaltyIntensity;
  penaltyConsentSeen: boolean;
};

export type NotificationQuietHours = {
  enabled: boolean;
  from: string;
  to: string;
};

export type NotificationSettings = {
  enabled: boolean;
  dailyReminderTimes: string[];
  deadlineAlertEnabled: boolean;
  exactAlarmEnabled: boolean;
  quietHours: NotificationQuietHours;
  workoutOngoingEnabled: boolean;
  rewardNotifications: boolean;
  penaltyNotifications: boolean;
  hydrationReminders: boolean;
  miniGameReminders: boolean;
  exerciseTipReminders: boolean;
};

export type MusicTrackSettings = {
  appTrackId: "auto" | string;
  workoutTrackId: "auto" | string;
  miniGameTrackIds: Partial<Record<MiniGameId, "auto" | string>>;
};

export type PerformanceMode = "always120" | "auto120" | "battery60";
export type GraphicsQualityMode = "performance" | "balanced" | "cinematic";

export type AppThemeId =
  | "system-dark"
  | "system-light"
  | "system-blue"
  | "system-red"
  | "system-pink"
  | "anime"
  | "isekai"
  | "kawaii";

export type ThemeEffectId = "none" | "monarch-code";

export const EQUIPMENT_SLOT_IDS = [
  "weapon",
  "helmet",
  "armor",
  "gloves",
  "boots",
  "ring1",
  "ring2",
  "necklace",
  "artifact",
] as const;

export type EquipmentSlotId = (typeof EQUIPMENT_SLOT_IDS)[number];
export type LegacyEquipmentSlotId = "accessory";
export type EquipmentType = EquipmentSlotId | LegacyEquipmentSlotId;

export type MiniGameRelicPerk = {
  gameId: MiniGameId | "all";
  kind: "scoreBonus" | "targetLifetime" | "hitWindow" | "timePenaltyResist";
  value: number;
};

export type MiniGameBackgroundGalleryItem = {
  id: string;
  name: string;
  createdAt: string;
  previewDataUrl: string;
};

export type MiniGameBackgroundsState = {
  ownedIds: string[];
  selectedByGame: Partial<Record<MiniGameId, string>>;
  galleryBackgrounds: MiniGameBackgroundGalleryItem[];
};

export type DailyPenalty = {
  id: string;
  missedDateKey: string;
  createdAt: string;
  completedAt: string | null;
  type: "appExercise" | "wallpaper" | "font";
  status: "active" | "completed" | "cancelled";
  exerciseId: string;
  exerciseName: string;
  exerciseDescription: string;
  requiredAmount: number;
  intensity: PenaltyIntensity;
  appliedWallpaper: boolean;
  appliedFont: boolean;
  phoneAttempted: boolean;
};

export interface Equipment {
  id: string;
  name: string;
  type: EquipmentType;
  equippedSlot?: EquipmentSlotId;
  legacyType?: EquipmentType;
  miniGamePerk?: MiniGameRelicPerk;
  rarity?: 'common' | 'rare' | 'epic' | 'legendary';
  bonusType: keyof PlayerState["stats"];
  bonusValue: number;
  durability: number;
  maxDurability: number;
}

export interface Skill {
  id: string;
  name: string;
  description: string;
  requiredLevel: number;
  unlocked: boolean;
  active: boolean; // Is it an active skill?
}

export interface Quest {
  id: string;
  title: string;
  description: string;
  type: 'story' | 'side';
  status: 'active' | 'completed';
  progress: number;
  maxProgress: number;
  rewardStr: string;
}

export interface PlayerState {
  name: string;
  avatarUrl: string;
  level: number;
  xp: number;
  jobClass: string;
  rank: string;
  gold: number;
  skillPoints: number;
  skills: string[]; // List of unlocked skill IDs
  quests: Quest[]; // List of current/past quests
  stats: {
    STR: number;
    VITALITY: number;
    AGILITY: number;
    INTELLIGENCE: number;
    SENSE: number;
  };
  availablePoints: number;
  hp: number;
  maxHp: number;
  mp: number;
  maxMp: number;
  dailyQuest: DailyQuestState;
  workoutHistory: WorkoutEntry[];
  wearableSamples: WearableSample[];
  workoutPlan: WorkoutPlanExercise[];
  activeWorkoutSession: WorkoutPlanSession | null;
  workoutSessions: WorkoutPlanSessionSummary[];
  settings: {
    sensorEnabled: boolean;
    wearableConnected: boolean;
    reducedMotion: boolean;
    unlockAllMiniGames: boolean;
    systemAudioEnabled: boolean;
    backgroundMusicEnabled: boolean;
    backgroundMusicVolume: number;
    musicTracks: MusicTrackSettings;
    miniGameGridByGame: Partial<Record<MiniGameId, boolean>>;
    performanceMode: PerformanceMode;
    graphicsQuality: GraphicsQualityMode;
    fpsOverlayEnabled: boolean;
    advancedUnlockedUntil: number | null;
    healthAutoSync: boolean;
    uiSurfaceOpacity: number;
    marqueeSpeed: number;
    themeId: AppThemeId;
    ownedThemeIds: AppThemeId[];
    activeThemeEffectId: ThemeEffectId;
    ownedThemeEffectIds: ThemeEffectId[];
    activeWallpaperId: string | null;
    ownedThemeWallpaperIds: string[];
    notifications: NotificationSettings;
  } & PenaltySettings;
  penalties: DailyPenalty[];
  miniGames: Record<MiniGameId, MiniGameProgress>;
  miniGameUpgrades: {
    shadowExtraction: ShadowExtractionUpgrades;
    shop: MiniGameShopState;
  };
  miniGameBackgrounds: MiniGameBackgroundsState;
  lastLoginDate: string;
  inventory: Equipment[];
  equipment: Record<EquipmentSlotId, Equipment | null>;
}

export type RewardAnimationEvent = {
  id: string;
  type: "xp" | "gold";
  amount: number;
  source: "daily" | "mini-game" | "workout" | "penalty" | "combat" | "system";
  createdAt: number;
};

export type MiniGameSettlement = {
  gameId: MiniGameId;
  result: MiniGameCompletionInput;
  score: number;
  won: boolean;
  previousBest: number;
  newBest: boolean;
  previousGameLevel: number;
  nextGameLevel: number;
  difficultyLevel: number;
  rewardMultiplier: number;
  xpReward: number;
  goldReward: number;
  loot: Equipment | null;
  hpLoss: number;
  hpRestored: number;
  hpBefore: number;
  hpAfter: number;
  playerLevelBefore: number;
  playerLevelAfter: number;
  xpBefore: number;
  xpAfter: number;
  goldBefore: number;
  goldAfter: number;
  penaltyApplied: boolean;
  boosterApplied: boolean;
  xpMultiplier: number;
};

export const INITIAL_PLAYER: PlayerState = {
  name: "Sung Jin-Woo", // Default
  avatarUrl: "",
  level: 1,
  xp: 0,
  jobClass: "None",
  rank: "E-Rank",
  gold: 0,
  skillPoints: 0,
  skills: [],
  quests: [
    {
      id: "q1",
      title: "Przebudzenie Gracza",
      description: "Przeżyj Podwójne Lochy i zdobądź system.",
      type: "story",
      status: "completed",
      progress: 1,
      maxProgress: 1,
      rewardStr: "Tytuł: Niezbuntowany"
    },
    {
      id: "q2",
      title: "Gobliński Król",
      description: "Zabij 10 Goblinów w lochu.",
      type: "side",
      status: "active",
      progress: 0,
      maxProgress: 10,
      rewardStr: "+100 Gold, Miecz Kasaki"
    }
  ],
  stats: {
    STR: 10,
    VITALITY: 10,
    AGILITY: 10,
    INTELLIGENCE: 10,
    SENSE: 10,
  },
  availablePoints: 0,
  hp: 100,
  maxHp: 100,
  mp: 10,
  maxMp: 10,
  dailyQuest: {
    pushups: 0,
    situps: 0,
    squats: 0,
    runningKm: 0,
    items: [
      {
        id: "pushups",
        label: "Pompki",
        unit: "powt.",
        target: 100,
        manualSmall: 1,
        manualLarge: 10,
        stat: "STR",
        trackableExerciseId: "pushups",
        catalogExerciseId: "pompki-klasyczne",
        enabled: true,
      },
      {
        id: "situps",
        label: "Brzuszki",
        unit: "powt.",
        target: 100,
        manualSmall: 1,
        manualLarge: 10,
        stat: "VITALITY",
        trackableExerciseId: "situps",
        catalogExerciseId: "brzuszki",
        enabled: true,
      },
      {
        id: "squats",
        label: "Przysiady",
        unit: "powt.",
        target: 100,
        manualSmall: 1,
        manualLarge: 10,
        stat: "AGILITY",
        trackableExerciseId: "squats",
        catalogExerciseId: "przysiad-klasyczny",
        enabled: true,
      },
      {
        id: "runningKm",
        label: "Bieganie",
        unit: "km",
        target: 10,
        manualSmall: 0.1,
        manualLarge: 1,
        stat: "SENSE",
        trackableExerciseId: "runningKm",
        enabled: true,
      },
    ],
    progressByItemId: {
      pushups: 0,
      situps: 0,
      squats: 0,
      runningKm: 0,
    },
    completedAt: null,
    penaltyGiven: false,
    miniGamesPlayed: 0,
    streak: 0,
  },
  workoutHistory: [],
  wearableSamples: [],
  workoutPlan: [],
  activeWorkoutSession: null,
  workoutSessions: [],
  settings: {
    sensorEnabled: false,
    wearableConnected: false,
    reducedMotion: false,
    unlockAllMiniGames: false,
    systemAudioEnabled: true,
    backgroundMusicEnabled: true,
    backgroundMusicVolume: 0.2,
    musicTracks: {
      appTrackId: "auto",
      workoutTrackId: "auto",
      miniGameTrackIds: {},
    },
    miniGameGridByGame: {
      "shadow-extraction": false,
    },
    performanceMode: "always120",
    graphicsQuality: "balanced",
    fpsOverlayEnabled: false,
    advancedUnlockedUntil: null,
    healthAutoSync: true,
    uiSurfaceOpacity: 0.84,
    marqueeSpeed: 42,
    themeId: "system-dark",
    ownedThemeIds: ["system-dark"],
    activeThemeEffectId: "none",
    ownedThemeEffectIds: ["none"],
    activeWallpaperId: "solo-purple-citadel",
    ownedThemeWallpaperIds: ["none", "solo-purple-citadel"],
    notifications: {
      enabled: false,
      dailyReminderTimes: ["09:00", "18:00"],
      deadlineAlertEnabled: false,
      exactAlarmEnabled: false,
      quietHours: {
        enabled: true,
        from: "22:00",
        to: "07:00",
      },
      workoutOngoingEnabled: true,
      rewardNotifications: true,
      penaltyNotifications: true,
    },
    funnyPenaltiesEnabled: false,
    phonePranksEnabled: false,
    wallpaperPenaltyEnabled: false,
    fontPenaltyEnabled: false,
    penaltyIntensity: "normal",
    penaltyConsentSeen: false,
  },
  penalties: [],
  miniGames: {
    "gate-dodge": {
      id: "gate-dodge",
      level: 1,
      wins: 0,
      losses: 0,
      bestScore: 0,
      winStreak: 0,
      lastPlayedDate: null,
      rewardMultiplier: 1,
      lootChance: 0.05,
    },
    "shadow-strike": {
      id: "shadow-strike",
      level: 1,
      wins: 0,
      losses: 0,
      bestScore: 0,
      winStreak: 0,
      lastPlayedDate: null,
      rewardMultiplier: 1,
      lootChance: 0.05,
    },
    "mana-memory": {
      id: "mana-memory",
      level: 1,
      wins: 0,
      losses: 0,
      bestScore: 0,
      winStreak: 0,
      lastPlayedDate: null,
      rewardMultiplier: 1,
      lootChance: 0.05,
    },
    "rune-lock": {
      id: "rune-lock",
      level: 1,
      wins: 0,
      losses: 0,
      bestScore: 0,
      winStreak: 0,
      lastPlayedDate: null,
      rewardMultiplier: 1,
      lootChance: 0.05,
    },
    "shadow-extraction": {
      id: "shadow-extraction",
      level: 1,
      wins: 0,
      losses: 0,
      bestScore: 0,
      winStreak: 0,
      lastPlayedDate: null,
      rewardMultiplier: 1,
      lootChance: 0.05,
    },
  },
  miniGameUpgrades: {
    shadowExtraction: createDefaultShadowExtractionUpgrades(),
    shop: createDefaultMiniGameShop(),
  },
  miniGameBackgrounds: {
    ownedIds: ["system-grid"],
    selectedByGame: {},
    galleryBackgrounds: [],
  },
  lastLoginDate: getLocalDateKey(),
  inventory: [],
  equipment: {
    weapon: null,
    helmet: null,
    armor: null,
    gloves: null,
    boots: null,
    ring1: null,
    ring2: null,
    necklace: null,
    artifact: null,
  }
};

export function normalizeMusicTrackSettings(settings?: Partial<MusicTrackSettings>): MusicTrackSettings {
  return {
    appTrackId: normalizeTrackSetting(settings?.appTrackId),
    workoutTrackId: normalizeTrackSetting(settings?.workoutTrackId),
    miniGameTrackIds: Object.fromEntries(
      Object.entries(settings?.miniGameTrackIds || {}).map(([gameId, trackId]) => [
        gameId,
        normalizeTrackSetting(trackId),
      ])
    ) as Partial<Record<MiniGameId, "auto" | string>>,
  };
}

function normalizeTrackSetting(value: unknown): "auto" | string {
  return typeof value === "string" && value.length > 0 ? value : "auto";
}
