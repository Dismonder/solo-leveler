package com.damia.sololeveler;

import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.Context;

public class TrainingProgressWidgetProvider extends AppWidgetProvider {
    @Override
    public void onUpdate(Context context, AppWidgetManager appWidgetManager, int[] appWidgetIds) {
        HunterWidgetRenderer.updateTraining(context, appWidgetManager, appWidgetIds);
    }
}
