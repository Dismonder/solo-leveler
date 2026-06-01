package com.damia.sololeveler;

import android.app.Activity;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "HunterNativeGame")
public class HunterNativeGamePlugin extends Plugin {
    @PluginMethod
    public void isAvailable(PluginCall call) {
        JSObject result = new JSObject();
        result.put("available", true);
        result.put("engine", "libgdx");
        result.put("runtime", "native-android");
        call.resolve(result);
    }

    @PluginMethod
    public void launch(PluginCall call) {
        Activity activity = getActivity();
        String gameId = call.getString("gameId", "shadow-extraction");
        if (!"shadow-extraction".equals(gameId)) {
            call.reject("Native runtime is currently enabled only for shadow-extraction");
            return;
        }

        activity.runOnUiThread(() -> {
            try {
                HunterPerformancePlugin.applyNativeGameState(activity, "loading");
                Intent intent = new Intent(activity, NativeGameActivity.class);
                intent.putExtra("gameId", gameId);
                intent.putExtra("bestScore", call.getInt("bestScore", 0));
                intent.putExtra("gameLevel", call.getInt("gameLevel", 1));
                intent.putExtra("gold", call.getInt("gold", 0));
                intent.putExtra("hp", call.getInt("hp", 1000));
                intent.putExtra("baseHp", call.getInt("baseHp", 1000));
                intent.putExtra("playerLevel", call.getInt("playerLevel", 1));
                intent.putExtra("playerXp", call.getInt("playerXp", 0));
                intent.putExtra("fpsOverlayEnabled", call.getBoolean("fpsOverlayEnabled", false));
                intent.putExtra("graphicsQuality", call.getString("graphicsQuality", "balanced"));
                intent.putExtra("xpMultiplier", call.getDouble("xpMultiplier", 1.0));
                intent.putExtra("scoreBonus", call.getDouble("scoreBonus", 0.0));
                intent.putExtra("targetLifetimeBonusMs", call.getDouble("targetLifetimeBonusMs", 0.0));
                intent.putExtra("hitWindowBonus", call.getDouble("hitWindowBonus", 0.0));
                intent.putExtra("timePenaltyResist", call.getDouble("timePenaltyResist", 0.0));
                intent.putExtra("selectedEffectId", call.getString("selectedEffectId", "system-aura"));
                intent.putExtra("selectedEffectName", call.getString("selectedEffectName", "Aura Systemu"));
                intent.putExtra("showGrid", call.getBoolean("showGrid", false));
                activity.startActivity(intent);

                JSObject result = new JSObject();
                result.put("launched", true);
                result.put("gameId", gameId);
                result.put("engine", "libgdx");
                call.resolve(result);
            } catch (Exception exception) {
                call.reject("Native game launch failed", exception);
            }
        });
    }

    @PluginMethod
    public void consumeLastResult(PluginCall call) {
        SharedPreferences prefs = getContext().getSharedPreferences(NativeGameActivity.PREFS_NAME, Context.MODE_PRIVATE);
        String resultJson = prefs.getString(NativeGameActivity.KEY_LAST_RESULT, null);
        if (resultJson != null) {
            prefs.edit().remove(NativeGameActivity.KEY_LAST_RESULT).apply();
        }

        JSObject result = new JSObject();
        result.put("resultJson", resultJson);
        call.resolve(result);
    }

    @PluginMethod
    public void consumeLastError(PluginCall call) {
        SharedPreferences prefs = getContext().getSharedPreferences(NativeGameActivity.PREFS_NAME, Context.MODE_PRIVATE);
        String errorJson = prefs.getString(NativeGameActivity.KEY_LAST_ERROR, null);
        if (errorJson != null) {
            prefs.edit().remove(NativeGameActivity.KEY_LAST_ERROR).apply();
        }

        JSObject result = new JSObject();
        result.put("errorJson", errorJson);
        call.resolve(result);
    }
}
