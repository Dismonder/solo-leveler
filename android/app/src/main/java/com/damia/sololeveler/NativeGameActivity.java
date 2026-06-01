package com.damia.sololeveler;

import android.content.Context;
import android.content.SharedPreferences;
import android.content.pm.ActivityInfo;
import android.os.Bundle;
import android.view.View;

import com.badlogic.gdx.backends.android.AndroidApplication;
import com.badlogic.gdx.backends.android.AndroidApplicationConfiguration;

public class NativeGameActivity extends AndroidApplication implements ShadowExtractionNativeGame.Host {
    static final String PREFS_NAME = "solo_leveler_native_game_v2";
    static final String KEY_LAST_RESULT = "shadowExtractionLastResultJson";
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

        initialize(new ShadowExtractionNativeGame(this), config);
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
}
