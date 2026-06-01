package com.damia.sololeveler;

import android.app.Activity;
import android.content.Intent;
import android.content.pm.ActivityInfo;
import android.graphics.Color;
import android.os.Bundle;
import android.view.Window;

public class MainActivity extends Activity {
    private static final int BG = Color.rgb(3, 9, 22);

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setRequestedOrientation(ActivityInfo.SCREEN_ORIENTATION_PORTRAIT);
        HunterPerformancePlugin.applyHighPerformanceWindow(this);
        HunterPerformancePlugin.applyNativeGameState(this, "app");
        configureWindow();
        setContentView(new NativeShellView(this, this::openGame));
    }

    @Override
    protected void onResume() {
        super.onResume();
        HunterPerformancePlugin.applyHighPerformanceWindow(this);
        HunterPerformancePlugin.applyNativeGameState(this, "app");
    }

    private void configureWindow() {
        Window window = getWindow();
        window.setStatusBarColor(BG);
        window.setNavigationBarColor(Color.BLACK);
    }

    private void openGame(String gameId) {
        Intent intent = new Intent(this, NativeGameActivity.class);
        intent.putExtra("gameId", gameId);
        startActivity(intent);
    }
}
