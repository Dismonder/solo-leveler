package com.damia.sololeveler;

import android.Manifest;
import android.app.AlarmManager;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.PackageManager;
import android.graphics.Color;
import android.net.Uri;
import android.os.Build;
import android.os.PowerManager;
import android.provider.Settings;

import android.content.res.AssetManager;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.support.v4.media.MediaMetadataCompat;
import android.support.v4.media.session.MediaSessionCompat;
import android.support.v4.media.session.PlaybackStateCompat;
import androidx.media.app.NotificationCompat.MediaStyle;
import java.io.InputStream;

import androidx.core.app.NotificationCompat;
import androidx.core.app.NotificationManagerCompat;

import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.PermissionState;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;

import org.json.JSONArray;
import org.json.JSONObject;

@CapacitorPlugin(
        name = "HunterNotifications",
        permissions = {
                @Permission(alias = "notifications", strings = { Manifest.permission.POST_NOTIFICATIONS })
        }
)
public class HunterNotificationsPlugin extends Plugin {
    private static final String PREFS = "hunter_notifications";
    private static final String SCHEDULES = "schedules";
    private static final String LAST_ACTION = "last_action";
    private static final int WORKOUT_NOTIFICATION_ID = 74401;
    public static final int MEDIA_NOTIFICATION_ID = 74402;
    private static HunterNotificationsPlugin instance;
    private static MediaSessionCompat mediaSession;

    @Override
    public void load() {
        super.load();
        instance = this;
        ensureMediaSession();
    }

    public static void handleMediaAction(String action) {
        if (instance != null && action != null) {
            JSObject data = new JSObject();
            data.put("action", action);
            instance.notifyListeners("mediaAction", data);
        }
    }

    private synchronized void ensureMediaSession() {
        if (mediaSession != null) return;
        try {
            mediaSession = new MediaSessionCompat(getContext(), "SoloLevelerMediaSession");
            mediaSession.setCallback(new MediaSessionCompat.Callback() {
                @Override
                public void onPlay() {
                    handleMediaAction("media_toggle");
                }

                @Override
                public void onPause() {
                    handleMediaAction("media_toggle");
                }

                @Override
                public void onSkipToNext() {
                    handleMediaAction("media_next");
                }

                @Override
                public void onSkipToPrevious() {
                    handleMediaAction("media_prev");
                }

                @Override
                public void onStop() {
                    handleMediaAction("media_stop");
                }

                @Override
                public void onSeekTo(long pos) {
                    if (instance != null) {
                        JSObject data = new JSObject();
                        data.put("action", "media_seek");
                        data.put("seekTime", pos / 1000.0);
                        instance.notifyListeners("mediaAction", data);
                    }
                }

                @Override
                public void onSetShuffleMode(int shuffleMode) {
                    handleMediaAction("media_shuffle");
                }
            });
            mediaSession.setActive(true);
        } catch (Exception ignored) {
        }
    }



    @PluginMethod
    public void getStatus(PluginCall call) {
        ensureChannels(getContext());
        call.resolve(status(getContext()));
    }

    @PluginMethod
    public void configureChannels(PluginCall call) {
        ensureChannels(getContext());
        call.resolve(status(getContext()));
    }

    @PluginMethod
    public void requestPermission(PluginCall call) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.TIRAMISU) {
            ensureChannels(getContext());
            call.resolve(status(getContext()));
            return;
        }

        if (getPermissionState("notifications") == PermissionState.GRANTED) {
            ensureChannels(getContext());
            call.resolve(status(getContext()));
            return;
        }

        requestPermissionForAlias("notifications", call, "notificationPermissionCallback");
    }

    @PermissionCallback
    private void notificationPermissionCallback(PluginCall call) {
        ensureChannels(getContext());
        call.resolve(status(getContext()));
    }

    @PluginMethod
    public void openExactAlarmSettings(PluginCall call) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.S) {
            JSObject result = new JSObject();
            result.put("opened", false);
            result.put("message", "Dokładne alarmy nie wymagają osobnej zgody na tym Androidzie.");
            call.resolve(result);
            return;
        }

        try {
            Intent intent = new Intent(Settings.ACTION_REQUEST_SCHEDULE_EXACT_ALARM);
            intent.setData(Uri.parse("package:" + getContext().getPackageName()));
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            getContext().startActivity(intent);
            JSObject result = new JSObject();
            result.put("opened", true);
            result.put("message", "Otworzono zgodę dokładnych alarmów Androida.");
            call.resolve(result);
        } catch (Exception error) {
            JSObject result = new JSObject();
            result.put("opened", false);
            result.put("message", "Nie udało się otworzyć ustawień dokładnych alarmów.");
            call.resolve(result);
        }
    }

    @PluginMethod
    public void requestIgnoreBatteryOptimizations(PluginCall call) {
        Context context = getContext();
        try {
            Intent intent = new Intent();
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                PowerManager pm = (PowerManager) context.getSystemService(Context.POWER_SERVICE);
                if (pm != null && !pm.isIgnoringBatteryOptimizations(context.getPackageName())) {
                    intent.setAction(Settings.ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS);
                    intent.setData(Uri.parse("package:" + context.getPackageName()));
                } else {
                    intent.setAction(Settings.ACTION_IGNORE_BATTERY_OPTIMIZATION_SETTINGS);
                }
            } else {
                intent.setAction(Settings.ACTION_APPLICATION_DETAILS_SETTINGS);
                intent.setData(Uri.parse("package:" + context.getPackageName()));
            }
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            context.startActivity(intent);
            JSObject result = new JSObject();
            result.put("opened", true);
            result.put("message", "Otworzono ustawienia optymalizacji baterii.");
            call.resolve(result);
        } catch (Exception e) {
            try {
                Intent fallback = new Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS);
                fallback.setData(Uri.parse("package:" + context.getPackageName()));
                fallback.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                context.startActivity(fallback);
                JSObject result = new JSObject();
                result.put("opened", true);
                result.put("message", "Otworzono informacje o aplikacji.");
                call.resolve(result);
            } catch (Exception e2) {
                JSObject result = new JSObject();
                result.put("opened", false);
                result.put("message", e2.getMessage());
                call.resolve(result);
            }
        }
    }

    @PluginMethod
    public void testNotification(PluginCall call) {
        ensureChannels(getContext());
        String channelId = call.getString("channelId", "daily_training");
        String title = call.getString("title", "System Łowcy");
        String body = call.getString("body", "Test lokalnego powiadomienia działa offline.");
        showNow(getContext(), "test_" + System.currentTimeMillis(), channelId, title, body, "open_status", false);

        JSObject result = new JSObject();
        result.put("shown", hasNotificationPermission(getContext()));
        result.put("message", hasNotificationPermission(getContext())
                ? "Wysłano testowe powiadomienie."
                : "Brak zgody POST_NOTIFICATIONS. Najpierw włącz powiadomienia.");
        call.resolve(result);
    }

    @PluginMethod
    public void scheduleNotifications(PluginCall call) {
        ensureChannels(getContext());
        JSArray notifications = call.getArray("notifications", new JSArray());
        int scheduled = 0;
        for (int i = 0; i < notifications.length(); i++) {
            try {
                JSONObject item = notifications.getJSONObject(i);
                if (scheduleOne(getContext(), item, true)) scheduled++;
            } catch (Exception ignored) {
            }
        }

        JSObject result = new JSObject();
        result.put("scheduledCount", scheduled);
        result.put("message", "Zaplanowano lokalne alerty: " + scheduled);
        call.resolve(result);
    }

    @PluginMethod
    public void cancelNotifications(PluginCall call) {
        String channelId = call.getString("channelId", null);
        JSArray ids = call.getArray("ids", null);
        int cancelled = cancelStored(getContext(), channelId, ids);
        JSObject result = new JSObject();
        result.put("cancelled", cancelled);
        result.put("message", "Anulowano alerty: " + cancelled);
        call.resolve(result);
    }

    @PluginMethod
    public void getScheduledNotifications(PluginCall call) {
        JSObject result = new JSObject();
        result.put("notifications", readSchedules(getContext()));
        call.resolve(result);
    }

    @PluginMethod
    public void showRewardNotification(PluginCall call) {
        ensureChannels(getContext());
        showNow(getContext(), "reward_" + System.currentTimeMillis(), "rewards", call.getString("title", "Nagroda Systemu"), call.getString("body", "Odebrano nagrodę."), "open_status", false);
        JSObject result = new JSObject();
        result.put("shown", hasNotificationPermission(getContext()));
        result.put("message", "Nagroda wysłana jako lokalne powiadomienie.");
        call.resolve(result);
    }

    @PluginMethod
    public void showPenaltyNotification(PluginCall call) {
        ensureChannels(getContext());
        showNow(getContext(), call.getString("penaltyId", "penalty"), "penalties", call.getString("title", "Kara Systemu"), call.getString("body", "Wykonaj ćwiczenie karne."), "open_system", true);
        JSObject result = new JSObject();
        result.put("shown", hasNotificationPermission(getContext()));
        result.put("message", "Powiadomienie kary wysłane.");
        call.resolve(result);
    }

    @PluginMethod
    public void showWorkoutOngoing(PluginCall call) {
        ensureChannels(getContext());
        NotificationCompat.Builder builder = baseBuilder(getContext(), "workout_session", call.getString("title", "Aktywny trening"), call.getString("body", "Plan treningowy trwa."), "open_plan")
                .setOngoing(true)
                .setOnlyAlertOnce(true)
                .setProgress(0, 0, true);
        boolean paused = call.getBoolean("paused", false);
        builder.addAction(0, paused ? "Wznów" : "Pauza", openAction(getContext(), paused ? "workout_resume" : "workout_pause"));
        builder.addAction(0, "Zakończ", openAction(getContext(), "workout_finish"));
        notify(getContext(), WORKOUT_NOTIFICATION_ID, builder.build());

        JSObject result = new JSObject();
        result.put("shown", hasNotificationPermission(getContext()));
        result.put("message", "Aktywne powiadomienie treningu zaktualizowane.");
        call.resolve(result);
    }

    @PluginMethod
    public void clearWorkoutOngoing(PluginCall call) {
        NotificationManagerCompat.from(getContext()).cancel(WORKOUT_NOTIFICATION_ID);
        JSObject result = new JSObject();
        result.put("cleared", true);
        result.put("message", "Powiadomienie treningu zamknięte.");
        call.resolve(result);
    }

    @PluginMethod
    public void showMediaPlaybackNotification(PluginCall call) {
        ensureChannels(getContext());
        ensureMediaSession();

        String title = call.getString("title", "Solo Leveler");
        String artist = call.getString("artist", "Solo Leveling OST");
        String backgroundName = call.getString("backgroundName", "01-shadow-citadel-purple.jpg");
        boolean isPlaying = call.getBoolean("isPlaying", true);
        long positionMs = (long) (call.getDouble("position", 0.0) * 1000);
        long durationMs = (long) (call.getDouble("duration", 0.0) * 1000);

        Bitmap artwork = loadArtworkBitmap(getContext(), backgroundName);

        if (mediaSession != null) {
            long playbackActions = PlaybackStateCompat.ACTION_PLAY
                    | PlaybackStateCompat.ACTION_PAUSE
                    | PlaybackStateCompat.ACTION_PLAY_PAUSE
                    | PlaybackStateCompat.ACTION_SKIP_TO_NEXT
                    | PlaybackStateCompat.ACTION_SKIP_TO_PREVIOUS
                    | PlaybackStateCompat.ACTION_STOP
                    | PlaybackStateCompat.ACTION_SEEK_TO
                    | PlaybackStateCompat.ACTION_SET_SHUFFLE_MODE;

            PlaybackStateCompat.Builder stateBuilder = new PlaybackStateCompat.Builder()
                    .setActions(playbackActions)
                    .setState(
                            isPlaying ? PlaybackStateCompat.STATE_PLAYING : PlaybackStateCompat.STATE_PAUSED,
                            positionMs,
                            1.0f
                    );
            mediaSession.setPlaybackState(stateBuilder.build());

            MediaMetadataCompat.Builder metaBuilder = new MediaMetadataCompat.Builder()
                    .putString(MediaMetadataCompat.METADATA_KEY_TITLE, title)
                    .putString(MediaMetadataCompat.METADATA_KEY_ARTIST, artist)
                    .putString(MediaMetadataCompat.METADATA_KEY_ALBUM, "Solo Leveler - Status Łowcy");
            if (durationMs > 0) {
                metaBuilder.putLong(MediaMetadataCompat.METADATA_KEY_DURATION, durationMs);
            }
            if (artwork != null) {
                metaBuilder.putBitmap(MediaMetadataCompat.METADATA_KEY_ALBUM_ART, artwork);
                metaBuilder.putBitmap(MediaMetadataCompat.METADATA_KEY_ART, artwork);
                metaBuilder.putBitmap(MediaMetadataCompat.METADATA_KEY_DISPLAY_ICON, artwork);
            }
            mediaSession.setMetadata(metaBuilder.build());
        }

        NotificationCompat.Builder builder = new NotificationCompat.Builder(getContext(), "media_playback")
                .setSmallIcon(R.drawable.ic_stat_hunter)
                .setContentTitle(title != null ? title : "Solo Leveler")
                .setContentText(artist != null ? artist : "Solo Leveling OST")
                .setSubText("Solo Leveler")
                .setOngoing(isPlaying)
                .setOnlyAlertOnce(true)
                .setColor(Color.rgb(34, 211, 238))
                .setContentIntent(openAction(getContext(), "open_status"))
                .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
                .setPriority(NotificationCompat.PRIORITY_LOW);

        if (artwork != null) {
            builder.setLargeIcon(artwork);
        }

        // Actions: 0=Shuffle, 1=Prev, 2=Play/Pause, 3=Next, 4=Stop
        builder.addAction(R.drawable.ic_media_shuffle, "Losuj", mediaAction(getContext(), "media_shuffle"));
        builder.addAction(R.drawable.ic_media_previous, "Poprzedni", mediaAction(getContext(), "media_prev"));
        builder.addAction(
                isPlaying ? R.drawable.ic_media_pause : R.drawable.ic_media_play,
                isPlaying ? "Pauza" : "Odtwarzaj",
                mediaAction(getContext(), "media_toggle")
        );
        builder.addAction(R.drawable.ic_media_next, "Następny", mediaAction(getContext(), "media_next"));
        builder.addAction(R.drawable.ic_media_stop, "Zatrzymaj", mediaAction(getContext(), "media_stop"));

        if (mediaSession != null) {
            MediaStyle mediaStyle = new MediaStyle()
                    .setMediaSession(mediaSession.getSessionToken())
                    .setShowActionsInCompactView(1, 2, 3)
                    .setShowCancelButton(true)
                    .setCancelButtonIntent(mediaAction(getContext(), "media_stop"));
            builder.setStyle(mediaStyle);
        }

        notify(getContext(), MEDIA_NOTIFICATION_ID, builder.build());

        JSObject result = new JSObject();
        result.put("shown", hasNotificationPermission(getContext()));
        result.put("message", "MediaStyle notification active.");
        call.resolve(result);
    }

    @PluginMethod
    public void clearMediaPlaybackNotification(PluginCall call) {
        NotificationManagerCompat.from(getContext()).cancel(MEDIA_NOTIFICATION_ID);
        if (mediaSession != null) {
            mediaSession.setActive(false);
        }
        JSObject result = new JSObject();
        result.put("cleared", true);
        result.put("message", "Powiadomienie odtwarzacza zamknięte.");
        call.resolve(result);
    }

    private static Bitmap loadArtworkBitmap(Context context, String backgroundName) {
        if (backgroundName == null || backgroundName.trim().isEmpty()) {
            backgroundName = "01-shadow-citadel-purple.jpg";
        }
        AssetManager assets = context.getAssets();
        String[] possiblePaths = {
                "public/backgrounds/" + backgroundName,
                "backgrounds/" + backgroundName,
                "public/assets/" + backgroundName
        };

        for (String path : possiblePaths) {
            try {
                InputStream is = assets.open(path);
                Bitmap bitmap = BitmapFactory.decodeStream(is);
                is.close();
                if (bitmap != null) return bitmap;
            } catch (Exception ignored) {
            }
        }

        try {
            return BitmapFactory.decodeResource(context.getResources(), R.drawable.splash);
        } catch (Exception ignored) {
            return null;
        }
    }


    @PluginMethod
    public void getLaunchAction(PluginCall call) {
        SharedPreferences prefs = getContext().getSharedPreferences(PREFS, Context.MODE_PRIVATE);
        JSObject result = new JSObject();
        result.put("action", prefs.getString(LAST_ACTION, null));
        call.resolve(result);
    }

    @PluginMethod
    public void clearLaunchAction(PluginCall call) {
        getContext().getSharedPreferences(PREFS, Context.MODE_PRIVATE).edit().remove(LAST_ACTION).apply();
        JSObject result = new JSObject();
        result.put("cleared", true);
        call.resolve(result);
    }

    public static void ensureChannels(Context context) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return;
        NotificationManager manager = context.getSystemService(NotificationManager.class);
        if (manager == null) return;
        createChannel(manager, "daily_training", "Daily Quest", "Przypomnienia o dziennym treningu.", NotificationManager.IMPORTANCE_DEFAULT);
        createChannel(manager, "deadline_alert", "Deadline Systemu", "Mocniejsze ostrzeżenie przed resetem dnia.", NotificationManager.IMPORTANCE_HIGH);
        createChannel(manager, "workout_session", "Aktywny trening", "Status trwającej sesji treningowej.", NotificationManager.IMPORTANCE_LOW);
        createChannel(manager, "media_playback", "Odtwarzacz Muzyki", "Sterowanie muzyką w tle.", NotificationManager.IMPORTANCE_LOW);
        createChannel(manager, "penalties", "Kary Systemu", "Kary za pominięty dzień.", NotificationManager.IMPORTANCE_DEFAULT);
        createChannel(manager, "rewards", "Nagrody", "XP, gold, streak i ukończenie celu.", NotificationManager.IMPORTANCE_DEFAULT);
    }

    private static PendingIntent mediaAction(Context context, String action) {
        Intent intent = new Intent(context, HunterNotificationReceiver.class);
        intent.setAction(HunterNotificationReceiver.ACTION_MEDIA);
        intent.putExtra("media_action", action);
        return PendingIntent.getBroadcast(context, requestCode("media_" + action), intent, flags());
    }


    public static void showNotificationFromIntent(Context context, Intent intent) {
        ensureChannels(context);
        String action = intent.getStringExtra("hunter_action");
        if (action == null || action.trim().isEmpty()) {
            action = "open_training";
        }
        showNow(
                context,
                intent.getStringExtra("id"),
                intent.getStringExtra("channelId"),
                intent.getStringExtra("title"),
                intent.getStringExtra("body"),
                action,
                "deadline_alert".equals(intent.getStringExtra("channelId"))
        );
    }

    public static void scheduleSnooze(Context context, Intent source, int minutes) {
        try {
            JSONObject item = new JSONObject();
            item.put("id", "snooze_" + System.currentTimeMillis());
            item.put("channelId", source.getStringExtra("channelId") != null ? source.getStringExtra("channelId") : "daily_training");
            item.put("title", source.getStringExtra("title") != null ? source.getStringExtra("title") : "Daily Quest czeka");
            item.put("body", "Drzemka zakończona. System wraca z przypomnieniem.");
            item.put("action", source.getStringExtra("hunter_action") != null ? source.getStringExtra("hunter_action") : "open_training");
            item.put("atMs", System.currentTimeMillis() + minutes * 60_000L);
            item.put("exact", false);
            scheduleOne(context, item, true);
        } catch (Exception ignored) {
        }
    }

    public static void rescheduleStoredAlarms(Context context) {
        JSONArray schedules = readSchedules(context);
        long now = System.currentTimeMillis();
        for (int i = 0; i < schedules.length(); i++) {
            try {
                JSONObject item = schedules.getJSONObject(i);
                if (item.optLong("atMs", 0) > now) scheduleOne(context, item, false);
            } catch (Exception ignored) {
            }
        }
    }

    public static void removeStoredSchedule(Context context, String id) {
        if (id == null) return;
        JSONArray schedules = readSchedules(context);
        JSONArray next = new JSONArray();
        for (int i = 0; i < schedules.length(); i++) {
            JSONObject item = schedules.optJSONObject(i);
            if (item == null || id.equals(item.optString("id"))) continue;
            next.put(item);
        }
        writeSchedules(context, next);
    }

    public static void openMainActivity(Context context, String hunterAction) {
        if (hunterAction != null) {
            context.getSharedPreferences(PREFS, Context.MODE_PRIVATE).edit().putString(LAST_ACTION, hunterAction).apply();
            if (instance != null) {
                JSObject data = new JSObject();
                data.put("action", hunterAction);
                instance.notifyListeners("hunterAction", data);
            }
        }
        Intent open = new Intent(context, MainActivity.class);
        open.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP | Intent.FLAG_ACTIVITY_SINGLE_TOP);
        if (hunterAction != null) open.putExtra("hunter_action", hunterAction);
        context.startActivity(open);
    }

    private static boolean scheduleOne(Context context, JSONObject item, boolean store) {
        long atMs = item.optLong("atMs", 0);
        if (atMs <= System.currentTimeMillis()) return false;

        Intent intent = new Intent(context, HunterNotificationReceiver.class);
        intent.setAction(HunterNotificationReceiver.ACTION_ALARM);
        intent.putExtra("id", item.optString("id"));
        intent.putExtra("channelId", item.optString("channelId", "daily_training"));
        intent.putExtra("title", item.optString("title", "System Łowcy"));
        intent.putExtra("body", item.optString("body", "Przypomnienie Systemu."));
        intent.putExtra("hunter_action", item.optString("action", "open_training"));


        PendingIntent pendingIntent = PendingIntent.getBroadcast(context, requestCode(item.optString("id")), intent, flags());
        AlarmManager alarmManager = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
        if (alarmManager == null) return false;

        boolean exact = item.optBoolean("exact", false) && canScheduleExact(context);
        if (exact) {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) alarmManager.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, atMs, pendingIntent);
            else alarmManager.setExact(AlarmManager.RTC_WAKEUP, atMs, pendingIntent);
        } else if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            alarmManager.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, atMs, pendingIntent);
        } else {
            alarmManager.set(AlarmManager.RTC_WAKEUP, atMs, pendingIntent);
        }

        if (store) upsertSchedule(context, item);
        return true;
    }

    private static int cancelStored(Context context, String channelId, JSArray ids) {
        JSONArray schedules = readSchedules(context);
        JSONArray next = new JSONArray();
        int cancelled = 0;
        for (int i = 0; i < schedules.length(); i++) {
            JSONObject item = schedules.optJSONObject(i);
            if (item == null) continue;
            boolean match = channelId != null && channelId.equals(item.optString("channelId"));
            if (ids != null) {
                for (int j = 0; j < ids.length(); j++) {
                    if (item.optString("id").equals(ids.optString(j))) match = true;
                }
            }
            if (match) {
                cancelAlarm(context, item.optString("id"));
                cancelled++;
            } else {
                next.put(item);
            }
        }
        writeSchedules(context, next);
        return cancelled;
    }

    private static void cancelAlarm(Context context, String id) {
        Intent intent = new Intent(context, HunterNotificationReceiver.class);
        intent.setAction(HunterNotificationReceiver.ACTION_ALARM);
        PendingIntent pendingIntent = PendingIntent.getBroadcast(context, requestCode(id), intent, flags());
        AlarmManager alarmManager = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
        if (alarmManager != null) alarmManager.cancel(pendingIntent);
    }

    private static void showNow(Context context, String id, String channelId, String title, String body, String openAction, boolean alert) {
        NotificationCompat.Builder builder = baseBuilder(context, channelId, title, body, openAction);
        if (alert) builder.setPriority(NotificationCompat.PRIORITY_HIGH).setVibrate(new long[] { 0, 120, 90, 120 });
        if ("daily_training".equals(channelId) || "deadline_alert".equals(channelId)) {
            builder.addAction(0, "Start treningu", openAction(context, "open_training"));
            builder.addAction(0, "Otwórz plan", openAction(context, "open_plan"));
            builder.addAction(0, "Drzemka 15 min", snoozeAction(context, id, channelId, title, body, 15));
            builder.addAction(0, "Drzemka 1 h", snoozeAction(context, id, channelId, title, body, 60));
        }
        notify(context, requestCode(id), builder.build());
    }

    private static NotificationCompat.Builder baseBuilder(Context context, String channelId, String title, String body, String openAction) {
        return new NotificationCompat.Builder(context, channelId != null ? channelId : "daily_training")
                .setSmallIcon(R.drawable.ic_stat_hunter)
                .setContentTitle(title != null ? title : "System Łowcy")
                .setContentText(body != null ? body : "Przypomnienie Systemu.")
                .setStyle(new NotificationCompat.BigTextStyle().bigText(body != null ? body : "Przypomnienie Systemu."))
                .setAutoCancel(true)
                .setContentIntent(openAction(context, openAction != null ? openAction : "open_status"))
                .setColor(Color.rgb(34, 211, 238))
                .setPriority(NotificationCompat.PRIORITY_DEFAULT);
    }

    private static void notify(Context context, int id, android.app.Notification notification) {
        if (!hasNotificationPermission(context)) return;
        NotificationManagerCompat.from(context).notify(id, notification);
    }

    private static PendingIntent openAction(Context context, String action) {
        Intent intent = new Intent(context, HunterNotificationReceiver.class);
        intent.setAction(HunterNotificationReceiver.ACTION_OPEN);
        intent.putExtra("hunter_action", action);
        return PendingIntent.getBroadcast(context, requestCode("open_" + action), intent, flags());
    }

    private static PendingIntent snoozeAction(Context context, String id, String channelId, String title, String body, int minutes) {
        Intent intent = new Intent(context, HunterNotificationReceiver.class);
        intent.setAction(HunterNotificationReceiver.ACTION_SNOOZE);
        intent.putExtra("id", id);
        intent.putExtra("channelId", channelId);
        intent.putExtra("title", title);
        intent.putExtra("body", body);
        intent.putExtra("minutes", minutes);
        return PendingIntent.getBroadcast(context, requestCode("snooze_" + id + "_" + minutes), intent, flags());
    }

    private static JSObject status(Context context) {
        JSObject result = new JSObject();
        PowerManager pm = (PowerManager) context.getSystemService(Context.POWER_SERVICE);
        boolean batteryIgnored = true;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M && pm != null) {
            batteryIgnored = pm.isIgnoringBatteryOptimizations(context.getPackageName());
        }
        result.put("android", true);
        result.put("permissionGranted", hasNotificationPermission(context));
        result.put("batteryOptimizationIgnored", batteryIgnored);
        result.put("exactAlarmAvailable", Build.VERSION.SDK_INT >= Build.VERSION_CODES.S);
        result.put("exactAlarmGranted", canScheduleExact(context));
        result.put("channelsReady", true);
        result.put("scheduledCount", readSchedules(context).length());
        result.put("message", hasNotificationPermission(context)
                ? "Powiadomienia lokalne są aktywne."
                : "Android wymaga zgody POST_NOTIFICATIONS.");
        return result;
    }

    private static void createChannel(NotificationManager manager, String id, String name, String description, int importance) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return;
        NotificationChannel channel = new NotificationChannel(id, name, importance);
        channel.setDescription(description);
        manager.createNotificationChannel(channel);
    }

    private static boolean hasNotificationPermission(Context context) {
        return Build.VERSION.SDK_INT < Build.VERSION_CODES.TIRAMISU
                || context.checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS) == PackageManager.PERMISSION_GRANTED;
    }

    private static boolean canScheduleExact(Context context) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.S) return true;
        AlarmManager alarmManager = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
        return alarmManager != null && alarmManager.canScheduleExactAlarms();
    }

    private static JSONArray readSchedules(Context context) {
        SharedPreferences prefs = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
        try {
            return new JSONArray(prefs.getString(SCHEDULES, "[]"));
        } catch (Exception error) {
            return new JSONArray();
        }
    }

    private static void writeSchedules(Context context, JSONArray schedules) {
        context.getSharedPreferences(PREFS, Context.MODE_PRIVATE).edit().putString(SCHEDULES, schedules.toString()).apply();
    }

    private static void upsertSchedule(Context context, JSONObject item) {
        JSONArray schedules = readSchedules(context);
        JSONArray next = new JSONArray();
        String id = item.optString("id");
        for (int i = 0; i < schedules.length(); i++) {
            JSONObject existing = schedules.optJSONObject(i);
            if (existing == null || id.equals(existing.optString("id"))) continue;
            next.put(existing);
        }
        next.put(item);
        writeSchedules(context, next);
    }

    private static int requestCode(String value) {
        return Math.abs((value != null ? value : "notification").hashCode());
    }

    private static int flags() {
        int flags = PendingIntent.FLAG_UPDATE_CURRENT;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) flags |= PendingIntent.FLAG_IMMUTABLE;
        return flags;
    }
}
