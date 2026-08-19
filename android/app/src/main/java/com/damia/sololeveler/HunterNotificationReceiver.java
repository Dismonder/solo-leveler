package com.damia.sololeveler;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;

public class HunterNotificationReceiver extends BroadcastReceiver {
    public static final String ACTION_ALARM = "com.damia.sololeveler.NOTIFICATION_ALARM";
    public static final String ACTION_SNOOZE = "com.damia.sololeveler.NOTIFICATION_SNOOZE";
    public static final String ACTION_OPEN = "com.damia.sololeveler.NOTIFICATION_OPEN";
    public static final String ACTION_BOOT = "android.intent.action.BOOT_COMPLETED";
    public static final String ACTION_MEDIA = "com.damia.sololeveler.NOTIFICATION_MEDIA";

    @Override
    public void onReceive(Context context, Intent intent) {
        if (intent == null || intent.getAction() == null) return;

        String action = intent.getAction();
        if (ACTION_BOOT.equals(action)) {
            HunterNotificationsPlugin.rescheduleStoredAlarms(context);
            return;
        }

        if (ACTION_MEDIA.equals(action)) {
            String mediaAction = intent.getStringExtra("media_action");
            HunterNotificationsPlugin.handleMediaAction(mediaAction);
            return;
        }

        if (ACTION_SNOOZE.equals(action)) {
            int minutes = intent.getIntExtra("minutes", 15);
            HunterNotificationsPlugin.scheduleSnooze(context, intent, minutes);
            return;
        }

        if (ACTION_OPEN.equals(action)) {
            HunterNotificationsPlugin.openMainActivity(context, intent.getStringExtra("hunter_action"));
            return;
        }

        if (ACTION_ALARM.equals(action)) {
            HunterNotificationsPlugin.showNotificationFromIntent(context, intent);
            HunterNotificationsPlugin.removeStoredSchedule(context, intent.getStringExtra("id"));
        }
    }
}
