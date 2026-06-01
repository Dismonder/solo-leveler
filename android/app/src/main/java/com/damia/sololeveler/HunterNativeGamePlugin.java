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
                intent.putExtra("fpsOverlayEnabled", call.getBoolean("fpsOverlayEnabled", false));
                intent.putExtra("graphicsQuality", call.getString("graphicsQuality", "balanced"));
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
}
