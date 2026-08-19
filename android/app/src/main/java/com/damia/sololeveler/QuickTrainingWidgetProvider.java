package com.damia.sololeveler;

import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.Context;

public class QuickTrainingWidgetProvider extends AppWidgetProvider {
    @Override
    public void onUpdate(Context context, AppWidgetManager appWidgetManager, int[] appWidgetIds) {
        HunterWidgetRenderer.updateQuick(context, appWidgetManager, appWidgetIds);
    }
}
