package com.damia.sololeveler;

import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.Context;
import android.content.Intent;

public class ReminderWidgetProvider extends AppWidgetProvider {
    @Override
    public void onUpdate(Context context, AppWidgetManager appWidgetManager, int[] appWidgetIds) {
        HunterWidgetRenderer.updateReminder(context, appWidgetManager, appWidgetIds);
    }

    @Override
    public void onReceive(Context context, Intent intent) {
        super.onReceive(context, intent);
        if (intent != null && HunterWidgetRenderer.ACTION_SNOOZE_REMINDER.equals(intent.getAction())) {
            HunterWidgetState.snooze(context, 45L);
            HunterWidgetRenderer.updateAll(context);
        }
    }
}
