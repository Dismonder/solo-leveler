package com.damia.sololeveler;

import android.content.SharedPreferences;
import android.content.pm.ActivityInfo;
import android.os.Bundle;

import com.badlogic.gdx.backends.android.AndroidApplication;
import com.badlogic.gdx.backends.android.AndroidApplicationConfiguration;

public class NativeGameActivity extends AndroidApplication implements ShadowExtractionGdxGame.Host {
    private SharedPreferences preferences;
    private String gameId;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setRequestedOrientation(ActivityInfo.SCREEN_ORIENTATION_SENSOR_LANDSCAPE);
        HunterPerformancePlugin.applyHighPerformanceWindow(this);
        HunterPerformancePlugin.applyNativeGameState(this, "loading");

        preferences = getSharedPreferences("native_fitness_rpg", MODE_PRIVATE);
        gameId = getIntent().getStringExtra("gameId");
        if (gameId == null || gameId.isEmpty()) {
            gameId = "shadow-extraction";
        }

        AndroidApplicationConfiguration config = new AndroidApplicationConfiguration();
        config.useAccelerometer = false;
        config.useCompass = false;
        config.useImmersiveMode = true;
        config.numSamples = 2;

        initialize(new ShadowExtractionGdxGame(gameId, this), config);
    }

    @Override
    protected void onResume() {
        super.onResume();
        HunterPerformancePlugin.applyHighPerformanceWindow(this);
        HunterPerformancePlugin.applyNativeGameState(this, "gameplay");
    }

    @Override
    protected void onPause() {
        HunterPerformancePlugin.applyNativeGameState(this, "paused");
        super.onPause();
    }

    @Override
    public int getBestScore(String id) {
        return preferences.getInt(id + "_best", 0);
    }

    @Override
    public void setBestScore(String id, int score) {
        preferences.edit().putInt(id + "_best", score).apply();
    }

    @Override
    public int getGameLevel(String id) {
        return preferences.getInt(id + "_level", 1);
    }

    @Override
    public void setGameLevel(String id, int level) {
        preferences.edit().putInt(id + "_level", Math.max(1, level)).apply();
    }

    @Override
    public int getGold() {
        return preferences.getInt("gold", 250);
    }

    @Override
    public void setGold(int gold) {
        preferences.edit().putInt("gold", Math.max(0, gold)).apply();
    }

    @Override
    public int getHp() {
        return preferences.getInt("hp", getBaseHp());
    }

    @Override
    public void setHp(int hp) {
        preferences.edit().putInt("hp", Math.max(0, Math.min(getBaseHp(), hp))).apply();
    }

    @Override
    public int getBaseHp() {
        return 1480;
    }

    @Override
    public int getPlayerLevel() {
        return preferences.getInt("player_level", 1);
    }

    @Override
    public void setPlayerLevel(int level) {
        preferences.edit().putInt("player_level", Math.max(1, level)).apply();
    }

    @Override
    public int getPlayerXp() {
        return preferences.getInt("player_xp", 0);
    }

    @Override
    public void setPlayerXp(int xp) {
        preferences.edit().putInt("player_xp", Math.max(0, xp)).apply();
    }

    @Override
    public void setNativeState(String state) {
        runOnUiThread(() -> HunterPerformancePlugin.applyNativeGameState(this, state));
    }

    @Override
    public void exitGame() {
        runOnUiThread(this::finish);
    }
}
