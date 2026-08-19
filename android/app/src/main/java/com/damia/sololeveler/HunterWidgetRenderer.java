package com.damia.sololeveler;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.widget.RemoteViews;

import org.json.JSONObject;

import java.util.Locale;

final class HunterWidgetRenderer {
    static final String ACTION_SNOOZE_REMINDER = "com.damia.sololeveler.widget.SNOOZE_REMINDER";

    private HunterWidgetRenderer() {}

    static void updateAll(Context context) {
        AppWidgetManager manager = AppWidgetManager.getInstance(context);
        updateProvider(context, manager, RunningGoalWidgetProvider.class);
        updateProvider(context, manager, TrainingProgressWidgetProvider.class);
        updateProvider(context, manager, QuickTrainingWidgetProvider.class);
        updateProvider(context, manager, ReminderWidgetProvider.class);
    }

    static void updateProvider(Context context, AppWidgetManager manager, Class<?> providerClass) {
        int[] ids = manager.getAppWidgetIds(new ComponentName(context, providerClass));
        if (providerClass == RunningGoalWidgetProvider.class) {
            updateRunning(context, manager, ids);
        } else if (providerClass == TrainingProgressWidgetProvider.class) {
            updateTraining(context, manager, ids);
        } else if (providerClass == QuickTrainingWidgetProvider.class) {
            updateQuick(context, manager, ids);
        } else if (providerClass == ReminderWidgetProvider.class) {
            updateReminder(context, manager, ids);
        }
    }

    static void updateRunning(Context context, AppWidgetManager manager, int[] appWidgetIds) {
        JSONObject state = HunterWidgetState.read(context);
        int percent = clampPercent(state.optInt("runningPercent", 0));
        double value = state.optDouble("runningValue", 0);
        double target = state.optDouble("runningTarget", 10);
        String distance = formatKm(value) + " / " + formatKm(target) + " km";
        String remaining = target > value ? "Zostało " + formatKm(target - value) + " km" : "Cel biegania gotowy";
        for (int appWidgetId : appWidgetIds) {
            RemoteViews views = progressViews(context, "BIEGANIE", "Cel dystansu", percent, distance, remaining, "Otwórz", false);
            views.setOnClickPendingIntent(R.id.widget_root, HunterWidgetActions.openAction(context, "open_training", 3101));
            views.setOnClickPendingIntent(R.id.widget_action, HunterWidgetActions.openAction(context, "open_training", 3102));
            manager.updateAppWidget(appWidgetId, views);
        }
    }

    static void updateTraining(Context context, AppWidgetManager manager, int[] appWidgetIds) {
        JSONObject state = HunterWidgetState.read(context);
        int percent = clampPercent(state.optInt("dailyPercent", 0));
        boolean completed = state.optBoolean("dailyCompleted", false);
        boolean alert = isReminderDue(state);
        String title = completed ? "Daily ukończone" : "Trening dnia";
        String summary = state.optString("dailySummary", completed ? "System przygotuje nowy cel po północy" : "Uzupełnij pozostałe ćwiczenia");
        for (int appWidgetId : appWidgetIds) {
            RemoteViews views = progressViews(context, completed ? "GOTOWE" : "DAILY", title, percent, percent + "%", summary, "Plan", alert);
            views.setOnClickPendingIntent(R.id.widget_root, HunterWidgetActions.openAction(context, "open_plan", 3201));
            views.setOnClickPendingIntent(R.id.widget_action, HunterWidgetActions.openAction(context, "open_plan", 3202));
            manager.updateAppWidget(appWidgetId, views);
        }
    }

    static void updateQuick(Context context, AppWidgetManager manager, int[] appWidgetIds) {
        JSONObject state = HunterWidgetState.read(context);
        int percent = clampPercent(state.optInt("dailyPercent", 0));
        for (int appWidgetId : appWidgetIds) {
            RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.widget_hunter_quick);
            views.setTextViewText(R.id.widget_subtitle, percent + "% DAILY");
            views.setTextViewText(R.id.widget_title, "Szybki trening");
            views.setTextViewText(R.id.widget_progress_text, "Otwórz katalog lub plan bez szukania w aplikacji.");
            views.setTextViewText(R.id.widget_action, "Start");
            views.setOnClickPendingIntent(R.id.widget_root, HunterWidgetActions.openAction(context, "open_training", 3301));
            views.setOnClickPendingIntent(R.id.widget_action, HunterWidgetActions.openAction(context, "open_training", 3302));
            manager.updateAppWidget(appWidgetId, views);
        }
    }

    static void updateReminder(Context context, AppWidgetManager manager, int[] appWidgetIds) {
        JSONObject state = HunterWidgetState.read(context);
        boolean completed = state.optBoolean("dailyCompleted", false);
        boolean due = isReminderDue(state);
        int percent = clampPercent(state.optInt("dailyPercent", 0));
        for (int appWidgetId : appWidgetIds) {
            RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.widget_hunter_reminder);
            views.setInt(R.id.widget_root, "setBackgroundResource", due ? R.drawable.widget_hunter_bg_alert : R.drawable.widget_hunter_bg_done);
            views.setTextViewText(R.id.widget_subtitle, completed ? "SPOKÓJ SYSTEMU" : due ? "ALARM QUESTU" : "DRZEMKA");
            views.setTextViewText(R.id.widget_title, completed ? "Cel zrobiony" : "Trening czeka");
            views.setTextViewText(R.id.widget_progress_text, completed ? "Wróć jutro po nowy zestaw." : percent + "% wykonane. Kliknij drzemkę, jeśli wrócisz za chwilę.");
            views.setTextViewText(R.id.widget_action, completed ? "Status" : "Trening");
            views.setTextViewText(R.id.widget_snooze, due ? "Drzemka" : "OK");
            views.setOnClickPendingIntent(R.id.widget_root, HunterWidgetActions.openAction(context, completed ? "open_status" : "open_training", 3401));
            views.setOnClickPendingIntent(R.id.widget_action, HunterWidgetActions.openAction(context, completed ? "open_status" : "open_training", 3402));
            views.setOnClickPendingIntent(R.id.widget_snooze, snoozeIntent(context));
            manager.updateAppWidget(appWidgetId, views);
        }
    }

    private static RemoteViews progressViews(Context context, String subtitle, String title, int percent, String metric, String details, String action, boolean alert) {
        RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.widget_hunter_progress);
        views.setInt(R.id.widget_root, "setBackgroundResource", alert ? R.drawable.widget_hunter_bg_alert : R.drawable.widget_hunter_bg);
        views.setTextViewText(R.id.widget_subtitle, subtitle);
        views.setTextViewText(R.id.widget_title, title);
        views.setTextViewText(R.id.widget_badge, percent + "%");
        views.setTextViewText(R.id.widget_metric, metric);
        views.setTextViewText(R.id.widget_progress_text, details);
        views.setTextViewText(R.id.widget_action, action);
        views.setProgressBar(R.id.widget_progress_bar, 100, percent, false);
        return views;
    }

    private static PendingIntent snoozeIntent(Context context) {
        Intent intent = new Intent(context, ReminderWidgetProvider.class);
        intent.setAction(ACTION_SNOOZE_REMINDER);
        return PendingIntent.getBroadcast(
                context,
                3450,
                intent,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );
    }

    private static boolean isReminderDue(JSONObject state) {
        boolean completed = state.optBoolean("dailyCompleted", false);
        long snoozeUntil = state.optLong("snoozeUntil", 0L);
        return !completed && System.currentTimeMillis() > snoozeUntil;
    }

    private static int clampPercent(int value) {
        return Math.max(0, Math.min(100, value));
    }

    private static String formatKm(double value) {
        if (value >= 10) return String.format(Locale.US, "%.0f", value);
        return String.format(Locale.US, "%.1f", Math.max(0, value));
    }
}
