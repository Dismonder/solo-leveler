package com.damia.sololeveler;

import android.content.pm.ActivityInfo;
import android.os.Bundle;

import com.getcapacitor.BridgeActivity;

public class LegacyWebActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(HunterMotionPlugin.class);
        registerPlugin(HunterHealthConnectPlugin.class);
        registerPlugin(HunterOrientationPlugin.class);
        registerPlugin(HunterPenaltyPlugin.class);
        registerPlugin(HunterPerformancePlugin.class);
        registerPlugin(HunterNotificationsPlugin.class);
        setRequestedOrientation(ActivityInfo.SCREEN_ORIENTATION_PORTRAIT);
        HunterPerformancePlugin.applyHighPerformanceWindow(this);
        super.onCreate(savedInstanceState);
    }

    @Override
    public void onResume() {
        super.onResume();
        HunterPerformancePlugin.applyHighPerformanceWindow(this);
    }
}
