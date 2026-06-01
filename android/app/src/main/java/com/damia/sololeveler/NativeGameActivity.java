package com.damia.sololeveler;

import android.content.Context;
import android.content.SharedPreferences;
import android.content.pm.ActivityInfo;
import android.os.Bundle;
import android.util.Log;
import android.view.View;

import com.badlogic.gdx.backends.android.AndroidApplication;
import com.badlogic.gdx.backends.android.AndroidApplicationConfiguration;

import org.json.JSONObject;

public class NativeGameActivity extends AndroidApplication implements ShadowExtractionNativeGame.Host {
    private static final String TAG = "SoloNativeGame";
    static final String PREFS_NAME = "solo_leveler_native_game_v2";
    static final String KEY_LAST_RESULT = "shadowExtractionLastResultJson";
    static final String KEY_LAST_ERROR = "shadowExtractionLastErrorJson";
    private static final String KEY_BEST_SCORE = "shadowExtractionBestScore";
    private static final String KEY_GAME_LEVEL = "shadowExtractionLevel";
    private static final String KEY_PLAYER_GOLD = "playerGold";
    private static final String KEY_PLAYER_HP = "playerHp";
    private static final String KEY_PLAYER_BASE_HP = "playerBaseHp";
    private static final String KEY_PLAYER_LEVEL = "playerLevel";
    private static final String KEY_PLAYER_XP = "playerXp";

    private SharedPreferences prefs;
    private int bestScore;
    private int gameLevel;
    private int playerGold;
    private int playerHp;
    private int playerBaseHp;
    private int playerLevel;
    private int playerXp;
    private boolean fpsOverlayEnabled;
    private String graphicsQuality;
    private float xpMultiplier;
    private float scoreBonus;
    private float targetLifetimeBonusMs;
    private float hitWindowBonus;
    private float timePenaltyResist;
    private String selectedEffectId;
    private String selectedEffectName;
    private boolean showGrid;
    private Thread.UncaughtExceptionHandler previousNativeCrashHandler;
    private Thread.UncaughtExceptionHandler nativeCrashHandler;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setRequestedOrientation(ActivityInfo.SCREEN_ORIENTATION_SENSOR_LANDSCAPE);
        getWindow().getDecorView().setSystemUiVisibility(
            View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY
                | View.SYSTEM_UI_FLAG_FULLSCREEN
                | View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
                | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
                | View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
                | View.SYSTEM_UI_FLAG_LAYOUT_STABLE
        );
        HunterPerformancePlugin.applyHighPerformanceWindow(this, "always120");
        HunterPerformancePlugin.applyNativeGameState(this, "loading");

        prefs = getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        installNativeCrashReporter();
        bestScore = getIntent().getIntExtra("bestScore", prefs.getInt(KEY_BEST_SCORE, 0));
        gameLevel = Math.max(1, getIntent().getIntExtra("gameLevel", prefs.getInt(KEY_GAME_LEVEL, 1)));
        playerGold = getIntent().getIntExtra("gold", prefs.getInt(KEY_PLAYER_GOLD, 0));
        playerHp = getIntent().getIntExtra("hp", prefs.getInt(KEY_PLAYER_HP, 1000));
        playerBaseHp = Math.max(1, getIntent().getIntExtra("baseHp", prefs.getInt(KEY_PLAYER_BASE_HP, Math.max(1, playerHp))));
        playerLevel = Math.max(1, getIntent().getIntExtra("playerLevel", prefs.getInt(KEY_PLAYER_LEVEL, 1)));
        playerXp = Math.max(0, getIntent().getIntExtra("playerXp", prefs.getInt(KEY_PLAYER_XP, 0)));
        fpsOverlayEnabled = getIntent().getBooleanExtra("fpsOverlayEnabled", false);
        graphicsQuality = getIntent().getStringExtra("graphicsQuality");
        if (graphicsQuality == null || graphicsQuality.isEmpty()) {
            graphicsQuality = "balanced";
        }
        xpMultiplier = clampFloat((float) getIntent().getDoubleExtra("xpMultiplier", 1.0), 1f, 1.45f);
        scoreBonus = clampFloat((float) getIntent().getDoubleExtra("scoreBonus", 0.0), 0f, 0.15f);
        targetLifetimeBonusMs = clampFloat((float) getIntent().getDoubleExtra("targetLifetimeBonusMs", 0.0), 0f, 520f);
        hitWindowBonus = clampFloat((float) getIntent().getDoubleExtra("hitWindowBonus", 0.0), 0f, 0.12f);
        timePenaltyResist = clampFloat((float) getIntent().getDoubleExtra("timePenaltyResist", 0.0), 0f, 0.18f);
        selectedEffectId = getIntent().getStringExtra("selectedEffectId");
        if (selectedEffectId == null || selectedEffectId.isEmpty()) {
            selectedEffectId = "system-aura";
        }
        selectedEffectName = getIntent().getStringExtra("selectedEffectName");
        if (selectedEffectName == null || selectedEffectName.isEmpty()) {
            selectedEffectName = "Aura Systemu";
        }
        showGrid = getIntent().getBooleanExtra("showGrid", false);

        AndroidApplicationConfiguration config = new AndroidApplicationConfiguration();
        config.useAccelerometer = false;
        config.useCompass = false;
        config.useImmersiveMode = true;
        config.useWakelock = true;
        if ("cinematic".equals(graphicsQuality)) {
            config.numSamples = 4;
        } else if ("performance".equals(graphicsQuality)) {
            config.numSamples = 0;
        } else {
            config.numSamples = 2;
        }
        config.r = 8;
        config.g = 8;
        config.b = 8;
        config.a = 8;

        try {
            Log.i(TAG, "Starting libGDX shadow-extraction runtime. quality=" + graphicsQuality + " level=" + gameLevel);
            initialize(new ShadowExtractionNativeGame(this), config);
        } catch (Throwable throwable) {
            saveLastError("initialize", throwable);
            Log.e(TAG, "Native game initialization failed", throwable);
            finish();
        }
    }

    @Override
    protected void onResume() {
        super.onResume();
        HunterPerformancePlugin.applyHighPerformanceWindow(this, "always120");
        HunterPerformancePlugin.applyNativeGameState(this, "gameplay");
    }

    @Override
    protected void onPause() {
        HunterPerformancePlugin.applyNativeGameState(this, "paused");
        saveState();
        super.onPause();
    }

    @Override
    protected void onDestroy() {
        if (nativeCrashHandler != null && Thread.getDefaultUncaughtExceptionHandler() == nativeCrashHandler) {
            Thread.setDefaultUncaughtExceptionHandler(previousNativeCrashHandler);
        }
        super.onDestroy();
    }

    @Override
    public int getBestScore() {
        return bestScore;
    }

    @Override
    public void setBestScore(int score) {
        bestScore = Math.max(bestScore, score);
        saveState();
    }

    @Override
    public int getGameLevel() {
        return gameLevel;
    }

    @Override
    public void setGameLevel(int level) {
        gameLevel = Math.max(1, level);
        saveState();
    }

    @Override
    public int getGold() {
        return playerGold;
    }

    @Override
    public void setGold(int gold) {
        playerGold = Math.max(0, gold);
        saveState();
    }

    @Override
    public int getHp() {
        return playerHp;
    }

    @Override
    public void setHp(int hp) {
        playerHp = Math.max(0, Math.min(playerBaseHp, hp));
        saveState();
    }

    @Override
    public int getBaseHp() {
        return playerBaseHp;
    }

    @Override
    public int getPlayerLevel() {
        return playerLevel;
    }

    @Override
    public void setPlayerLevel(int level) {
        playerLevel = Math.max(1, level);
        saveState();
    }

    @Override
    public int getPlayerXp() {
        return playerXp;
    }

    @Override
    public boolean shouldShowFpsOverlay() {
        return fpsOverlayEnabled;
    }

    @Override
    public String getGraphicsQuality() {
        return graphicsQuality;
    }

    @Override
    public float getXpMultiplier() {
        return xpMultiplier;
    }

    @Override
    public float getScoreBonus() {
        return scoreBonus;
    }

    @Override
    public float getTargetLifetimeBonusMs() {
        return targetLifetimeBonusMs;
    }

    @Override
    public float getHitWindowBonus() {
        return hitWindowBonus;
    }

    @Override
    public float getTimePenaltyResist() {
        return timePenaltyResist;
    }

    @Override
    public String getSelectedEffectId() {
        return selectedEffectId;
    }

    @Override
    public String getSelectedEffectName() {
        return selectedEffectName;
    }

    @Override
    public boolean shouldShowGrid() {
        return showGrid;
    }

    @Override
    public void setPlayerXp(int xp) {
        playerXp = Math.max(0, xp);
        saveState();
    }

    @Override
    public void setNativeState(String state) {
        runOnUiThread(() -> HunterPerformancePlugin.applyNativeGameState(this, state));
    }

    @Override
    public void saveRoundResult(String resultJson) {
        if (prefs == null || resultJson == null || resultJson.isEmpty()) return;
        prefs.edit().putString(KEY_LAST_RESULT, resultJson).apply();
    }

    @Override
    public void exitGame() {
        saveState();
        runOnUiThread(this::finish);
    }

    private void installNativeCrashReporter() {
        previousNativeCrashHandler = Thread.getDefaultUncaughtExceptionHandler();
        nativeCrashHandler = (thread, throwable) -> {
            saveLastError("uncaught:" + thread.getName(), throwable);
            Log.e(TAG, "Uncaught native game error on " + thread.getName(), throwable);
            if (previousNativeCrashHandler != null) {
                previousNativeCrashHandler.uncaughtException(thread, throwable);
            }
        };
        Thread.setDefaultUncaughtExceptionHandler(nativeCrashHandler);
    }

    private void saveLastError(String stage, Throwable throwable) {
        if (prefs == null) return;
        try {
            JSONObject error = new JSONObject();
            error.put("id", "native_error_" + System.currentTimeMillis());
            error.put("gameId", "shadow-extraction");
            error.put("stage", stage);
            error.put("message", throwable == null || throwable.getMessage() == null ? "Unknown native game error" : throwable.getMessage());
            error.put("type", throwable == null ? "Throwable" : throwable.getClass().getName());
            error.put("gameLevel", gameLevel);
            error.put("graphicsQuality", graphicsQuality);
            error.put("timestamp", System.currentTimeMillis());
            prefs.edit().putString(KEY_LAST_ERROR, error.toString()).commit();
        } catch (Exception ignored) {
            prefs.edit().putString(KEY_LAST_ERROR, "{\"gameId\":\"shadow-extraction\",\"stage\":\"" + stage + "\",\"message\":\"Native game error\"}").commit();
        }
    }

    private void saveState() {
        if (prefs == null) return;
        prefs.edit()
            .putInt(KEY_BEST_SCORE, bestScore)
            .putInt(KEY_GAME_LEVEL, gameLevel)
            .putInt(KEY_PLAYER_GOLD, playerGold)
            .putInt(KEY_PLAYER_HP, playerHp)
            .putInt(KEY_PLAYER_BASE_HP, playerBaseHp)
            .putInt(KEY_PLAYER_LEVEL, playerLevel)
            .putInt(KEY_PLAYER_XP, playerXp)
            .apply();
    }

    private float clampFloat(float value, float min, float max) {
        return Math.max(min, Math.min(max, value));
    }
}
