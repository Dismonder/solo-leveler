package com.damia.sololeveler;

import android.app.Activity;
import android.app.GameManager;
import android.app.GameState;
import android.content.Context;
import android.os.Build;
import android.os.PowerManager;
import android.view.Display;
import android.view.View;
import android.view.Window;
import android.view.WindowManager;
import android.webkit.WebSettings;
import android.webkit.WebView;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "HunterPerformance")
public class HunterPerformancePlugin extends Plugin {
    private static final float TARGET_REFRESH_RATE = 120f;
    private static final float REFRESH_RATE_TOLERANCE = 2f;

    @PluginMethod
    public void enableHighPerformanceMode(PluginCall call) {
        Activity activity = getActivity();
        String mode = call.getString("mode", "always120");
        activity.runOnUiThread(() -> {
            RefreshSelection selection = applyHighPerformanceWindow(activity, mode);
            applyWebViewAcceleration();
            call.resolve(toResult(selection, true));
        });
    }

    @PluginMethod
    public void getStatus(PluginCall call) {
        Activity activity = getActivity();
        activity.runOnUiThread(() -> {
            RefreshSelection selection = selectBestRefreshMode(activity);
            call.resolve(toResult(selection, false));
        });
    }

    @PluginMethod
    public void setGameState(PluginCall call) {
        Activity activity = getActivity();
        String state = call.getString("state", "app");
        activity.runOnUiThread(() -> {
            applyGameState(activity, state);
            JSObject result = new JSObject();
            result.put("applied", true);
            result.put("state", state);
            call.resolve(result);
        });
    }

    public static RefreshSelection applyHighPerformanceWindow(Activity activity) {
        return applyHighPerformanceWindow(activity, "always120");
    }

    public static RefreshSelection applyHighPerformanceWindow(Activity activity, String mode) {
        Window window = activity.getWindow();
        window.setFlags(
            WindowManager.LayoutParams.FLAG_HARDWARE_ACCELERATED,
            WindowManager.LayoutParams.FLAG_HARDWARE_ACCELERATED
        );

        RefreshSelection selection = selectRefreshMode(activity, mode);
        WindowManager.LayoutParams params = window.getAttributes();
        params.preferredRefreshRate = selection.refreshRate;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M && selection.displayModeId > 0) {
            params.preferredDisplayModeId = selection.displayModeId;
        }
        window.setAttributes(params);
        return selection;
    }

    public static void applyNativeGameState(Activity activity, String state) {
        applyGameState(activity, state);
    }

    private static RefreshSelection selectRefreshMode(Activity activity, String mode) {
        if ("battery60".equals(mode)) {
            Display display = activity.getWindowManager().getDefaultDisplay();
            float currentRate = display.getRefreshRate();
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                Display.Mode activeMode = display.getMode();
                Display.Mode[] modes = display.getSupportedModes();
                Display.Mode best60 = null;
                for (Display.Mode displayMode : modes) {
                    boolean sameResolution =
                        activeMode != null
                            && displayMode.getPhysicalWidth() == activeMode.getPhysicalWidth()
                            && displayMode.getPhysicalHeight() == activeMode.getPhysicalHeight();
                    if (!sameResolution) continue;
                    if (best60 == null || Math.abs(displayMode.getRefreshRate() - 60f) < Math.abs(best60.getRefreshRate() - 60f)) {
                        best60 = displayMode;
                    }
                }
                if (best60 != null) {
                    return new RefreshSelection(best60.getRefreshRate(), best60.getModeId(), false, currentRate);
                }
            }
            return new RefreshSelection(Math.min(currentRate, 60f), 0, false, currentRate);
        }
        return selectBestRefreshMode(activity);
    }

    private static RefreshSelection selectBestRefreshMode(Activity activity) {
        Display display = activity.getWindowManager().getDefaultDisplay();
        float currentRate = display.getRefreshRate();
        RefreshSelection fallback = new RefreshSelection(currentRate, 0, false, currentRate);

        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.M) {
            return fallback;
        }

        Display.Mode activeMode = display.getMode();
        Display.Mode[] modes = display.getSupportedModes();
        Display.Mode bestSameResolution = null;
        Display.Mode bestAnyResolution = null;

        for (Display.Mode mode : modes) {
            if (bestAnyResolution == null || mode.getRefreshRate() > bestAnyResolution.getRefreshRate()) {
                bestAnyResolution = mode;
            }

            boolean sameResolution =
                activeMode != null
                    && mode.getPhysicalWidth() == activeMode.getPhysicalWidth()
                    && mode.getPhysicalHeight() == activeMode.getPhysicalHeight();

            if (sameResolution && (bestSameResolution == null || mode.getRefreshRate() > bestSameResolution.getRefreshRate())) {
                bestSameResolution = mode;
            }
        }

        Display.Mode best = bestSameResolution != null ? bestSameResolution : bestAnyResolution;
        if (best == null) {
            return fallback;
        }

        float bestRate = best.getRefreshRate();
        boolean supportsTarget = bestRate + REFRESH_RATE_TOLERANCE >= TARGET_REFRESH_RATE;
        return new RefreshSelection(bestRate, best.getModeId(), supportsTarget, currentRate);
    }

    private void applyWebViewAcceleration() {
        if (getBridge() == null || getBridge().getWebView() == null) {
            return;
        }

        WebView webView = getBridge().getWebView();
        webView.setLayerType(View.LAYER_TYPE_HARDWARE, null);
        WebSettings settings = webView.getSettings();
        settings.setTextZoom(100);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            settings.setOffscreenPreRaster(true);
        }
    }

    private JSObject toResult(RefreshSelection selection, boolean applied) {
        JSObject result = new JSObject();
        result.put("applied", applied);
        result.put("targetRefreshRate", TARGET_REFRESH_RATE);
        result.put("refreshRate", selection.refreshRate);
        result.put("displayModeId", selection.displayModeId);
        result.put("supports120Hz", selection.supportsTarget);
        result.put("currentRefreshRate", selection.currentRefreshRate);
        result.put("gameModeCode", getGameModeCode(getActivity()));
        result.put("gameMode", getGameModeLabel(getActivity()));
        result.put("thermalStatus", getThermalStatusLabel(getActivity()));
        return result;
    }

    private static void applyGameState(Activity activity, String state) {
        GameManager gameManager = activity.getSystemService(GameManager.class);
        if (gameManager == null) return;

        int mode;
        boolean loading = false;
        if ("loading".equals(state)) {
            mode = GameState.MODE_CONTENT;
            loading = true;
        } else if ("miniGame".equals(state) || "gameplay".equals(state)) {
            mode = GameState.MODE_GAMEPLAY_UNINTERRUPTIBLE;
        } else if ("paused".equals(state)) {
            mode = GameState.MODE_GAMEPLAY_INTERRUPTIBLE;
        } else {
            mode = GameState.MODE_CONTENT;
        }

        gameManager.setGameState(new GameState(loading, mode, 0, 0));
    }

    private static int getGameModeCode(Activity activity) {
        GameManager gameManager = activity.getSystemService(GameManager.class);
        if (gameManager == null) return GameManager.GAME_MODE_UNSUPPORTED;
        return gameManager.getGameMode();
    }

    private static String getGameModeLabel(Activity activity) {
        int mode = getGameModeCode(activity);
        if (mode == GameManager.GAME_MODE_PERFORMANCE) return "performance";
        if (mode == GameManager.GAME_MODE_BATTERY) return "battery";
        if (mode == GameManager.GAME_MODE_CUSTOM) return "custom";
        if (mode == GameManager.GAME_MODE_STANDARD) return "standard";
        return "unsupported";
    }

    private static String getThermalStatusLabel(Activity activity) {
        PowerManager powerManager = (PowerManager) activity.getSystemService(Context.POWER_SERVICE);
        if (powerManager == null) return "unknown";
        int status = powerManager.getCurrentThermalStatus();
        switch (status) {
            case PowerManager.THERMAL_STATUS_NONE:
                return "none";
            case PowerManager.THERMAL_STATUS_LIGHT:
                return "light";
            case PowerManager.THERMAL_STATUS_MODERATE:
                return "moderate";
            case PowerManager.THERMAL_STATUS_SEVERE:
                return "severe";
            case PowerManager.THERMAL_STATUS_CRITICAL:
                return "critical";
            case PowerManager.THERMAL_STATUS_EMERGENCY:
                return "emergency";
            case PowerManager.THERMAL_STATUS_SHUTDOWN:
                return "shutdown";
            default:
                return "unknown";
        }
    }

    public static class RefreshSelection {
        final float refreshRate;
        final int displayModeId;
        final boolean supportsTarget;
        final float currentRefreshRate;

        RefreshSelection(float refreshRate, int displayModeId, boolean supportsTarget, float currentRefreshRate) {
            this.refreshRate = refreshRate;
            this.displayModeId = displayModeId;
            this.supportsTarget = supportsTarget;
            this.currentRefreshRate = currentRefreshRate;
        }
    }
}
