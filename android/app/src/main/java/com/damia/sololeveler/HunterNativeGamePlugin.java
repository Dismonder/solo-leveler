package com.damia.sololeveler;

import android.app.Activity;
import android.content.Intent;

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
}
