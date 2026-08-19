package com.damia.sololeveler;

import android.content.Context;
import android.content.SharedPreferences;

import org.json.JSONException;
import org.json.JSONObject;

final class HunterWidgetState {
    static final String PREFS = "hunter_widgets";
    private static final String STATE = "state";
    private static final String SNOOZE_UNTIL = "snoozeUntil";

    private HunterWidgetState() {}

    static JSONObject read(Context context) {
        SharedPreferences prefs = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
        String raw = prefs.getString(STATE, "{}");
        try {
            JSONObject data = new JSONObject(raw != null ? raw : "{}");
            long snoozeUntil = prefs.getLong(SNOOZE_UNTIL, data.optLong(SNOOZE_UNTIL, 0L));
            data.put(SNOOZE_UNTIL, snoozeUntil);
            return data;
        } catch (JSONException error) {
            return new JSONObject();
        }
    }

    static void write(Context context, JSONObject data) {
        JSONObject copy = data != null ? data : new JSONObject();
        try {
            copy.put("updatedAt", System.currentTimeMillis());
        } catch (JSONException ignored) {
            // Non-critical metadata.
        }
        context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
                .edit()
                .putString(STATE, copy.toString())
                .apply();
    }

    static void snooze(Context context, long minutes) {
        long safeMinutes = Math.max(5L, Math.min(240L, minutes));
        long until = System.currentTimeMillis() + safeMinutes * 60_000L;
        context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
                .edit()
                .putLong(SNOOZE_UNTIL, until)
                .apply();
    }
}
