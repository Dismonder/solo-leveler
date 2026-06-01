package com.damia.sololeveler;

import android.Manifest;
import android.app.WallpaperManager;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.database.Cursor;
import android.content.SharedPreferences;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.LinearGradient;
import android.graphics.Paint;
import android.graphics.RadialGradient;
import android.graphics.Shader;
import android.net.Uri;
import android.os.Build;
import android.provider.Settings;
import android.provider.MediaStore;
import android.util.DisplayMetrics;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;

@CapacitorPlugin(
        name = "HunterPenalty",
        permissions = {
                @Permission(alias = "images", strings = { Manifest.permission.READ_MEDIA_IMAGES }),
                @Permission(alias = "legacyImages", strings = { Manifest.permission.READ_EXTERNAL_STORAGE })
        }
)
public class HunterPenaltyPlugin extends Plugin {
    private static final String PREFS = "hunter_penalty_prefs";
    private static final String ORIGINAL_FONT_SCALE = "original_font_scale";

    @PluginMethod
    public void getStatus(PluginCall call) {
        JSObject result = new JSObject();
        result.put("android", true);
        result.put("wallpaperAvailable", true);
        result.put("galleryPermissionGranted", hasImageReadPermission());
        result.put("canWriteSettings", canWriteSystemSettings());
        result.put("message", canWriteSystemSettings()
                ? "Zgoda WRITE_SETTINGS aktywna. Tapeta i czcionka są dostępne."
                : "Tapeta jest dostępna. Czcionka wymaga specjalnej zgody Androida.");
        call.resolve(result);
    }

    @PluginMethod
    public void requestGalleryPermission(PluginCall call) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.M || hasImageReadPermission()) {
            call.resolve(statusObject("Dostęp do galerii jest aktywny."));
            return;
        }

        requestPermissionForAlias(imagePermissionAlias(), call, "galleryPermissionCallback");
    }

    @PermissionCallback
    private void galleryPermissionCallback(PluginCall call) {
        call.resolve(statusObject(hasImageReadPermission()
                ? "Dostęp do galerii aktywny. Kara tapety może używać losowego zdjęcia."
                : "Brak dostępu do galerii. Kara tapety użyje wygenerowanego fallbacku."));
    }

    @PluginMethod
    public void setPenaltyWallpaper(PluginCall call) {
        String seed = call.getString("seed", "system");
        String intensity = call.getString("intensity", "normal");

        try {
            if (trySetRandomGalleryWallpaper(seed)) {
                JSObject result = new JSObject();
                result.put("applied", true);
                result.put("message", "Ustawiono losową tapetę z galerii zdjęć.");
                call.resolve(result);
                return;
            }

            Bitmap bitmap = createPenaltyWallpaper(seed, intensity);
            WallpaperManager.getInstance(getContext()).setBitmap(bitmap);

            JSObject result = new JSObject();
            result.put("applied", true);
            result.put("message", "Tapeta kary została ustawiona przez System.");
            call.resolve(result);
        } catch (Exception error) {
            call.reject("Nie udało się ustawić tapety kary: " + error.getLocalizedMessage(), error);
        }
    }

    @PluginMethod
    public void canWriteSettings(PluginCall call) {
        JSObject result = new JSObject();
        result.put("canWriteSettings", canWriteSystemSettings());
        result.put("message", canWriteSystemSettings()
                ? "Aplikacja może zmieniać skalę czcionki."
                : "Włącz specjalny dostęp WRITE_SETTINGS dla psot czcionki.");
        call.resolve(result);
    }

    @PluginMethod
    public void openWriteSettings(PluginCall call) {
        try {
            Intent intent = new Intent(Settings.ACTION_MANAGE_WRITE_SETTINGS);
            intent.setData(Uri.parse("package:" + getContext().getPackageName()));
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            getContext().startActivity(intent);

            JSObject result = new JSObject();
            result.put("opened", true);
            result.put("message", "Otworzono ekran specjalnej zgody Androida.");
            call.resolve(result);
        } catch (Exception error) {
            JSObject result = new JSObject();
            result.put("opened", false);
            result.put("message", "Nie udało się otworzyć ekranu WRITE_SETTINGS.");
            call.resolve(result);
        }
    }

    @PluginMethod
    public void setFontScale(PluginCall call) {
        if (!canWriteSystemSettings()) {
            JSObject result = new JSObject();
            result.put("applied", false);
            result.put("message", "Brak zgody WRITE_SETTINGS. Kara przechodzi na wariant w aplikacji.");
            call.resolve(result);
            return;
        }

        float requested = call.getDouble("scale", 1.12).floatValue();
        float scale = Math.max(0.85f, Math.min(1.45f, requested));

        try {
            SharedPreferences prefs = getContext().getSharedPreferences(PREFS, Context.MODE_PRIVATE);
            if (!prefs.contains(ORIGINAL_FONT_SCALE)) {
                float original = Settings.System.getFloat(getContext().getContentResolver(), Settings.System.FONT_SCALE, 1.0f);
                prefs.edit().putFloat(ORIGINAL_FONT_SCALE, original).apply();
            }

            Settings.System.putFloat(getContext().getContentResolver(), Settings.System.FONT_SCALE, scale);

            JSObject result = new JSObject();
            result.put("applied", true);
            result.put("scale", scale);
            result.put("message", "Skala czcionki została zmieniona przez karę Systemu.");
            call.resolve(result);
        } catch (Exception error) {
            call.reject("Nie udało się zmienić czcionki: " + error.getLocalizedMessage(), error);
        }
    }

    @PluginMethod
    public void restoreFontScale(PluginCall call) {
        if (!canWriteSystemSettings()) {
            JSObject result = new JSObject();
            result.put("restored", false);
            result.put("message", "Brak zgody WRITE_SETTINGS, nie ma czego przywracać.");
            call.resolve(result);
            return;
        }

        SharedPreferences prefs = getContext().getSharedPreferences(PREFS, Context.MODE_PRIVATE);
        if (!prefs.contains(ORIGINAL_FONT_SCALE)) {
            JSObject result = new JSObject();
            result.put("restored", false);
            result.put("message", "Nie zapisano wcześniejszej skali czcionki.");
            call.resolve(result);
            return;
        }

        float original = prefs.getFloat(ORIGINAL_FONT_SCALE, 1.0f);
        Settings.System.putFloat(getContext().getContentResolver(), Settings.System.FONT_SCALE, original);
        prefs.edit().remove(ORIGINAL_FONT_SCALE).apply();

        JSObject result = new JSObject();
        result.put("restored", true);
        result.put("scale", original);
        result.put("message", "Przywrócono zapisaną skalę czcionki.");
        call.resolve(result);
    }

    private boolean canWriteSystemSettings() {
        return Settings.System.canWrite(getContext());
    }

    private boolean trySetRandomGalleryWallpaper(String seed) {
        if (!hasImageReadPermission()) {
            return false;
        }

        String[] projection = new String[] { MediaStore.Images.Media._ID };
        String selection = MediaStore.Images.Media.WIDTH + ">=? AND " + MediaStore.Images.Media.HEIGHT + ">=?";
        String[] args = new String[] { "720", "720" };

        try (Cursor cursor = getContext().getContentResolver().query(
                MediaStore.Images.Media.EXTERNAL_CONTENT_URI,
                projection,
                selection,
                args,
                MediaStore.Images.Media.DATE_ADDED + " DESC"
        )) {
            if (cursor == null || cursor.getCount() <= 0) {
                return false;
            }

            int offset = Math.abs(seed.hashCode()) % cursor.getCount();
            if (!cursor.moveToPosition(offset)) {
                return false;
            }

            long id = cursor.getLong(cursor.getColumnIndexOrThrow(MediaStore.Images.Media._ID));
            Uri uri = Uri.withAppendedPath(MediaStore.Images.Media.EXTERNAL_CONTENT_URI, String.valueOf(id));
            Bitmap bitmap = BitmapFactory.decodeStream(getContext().getContentResolver().openInputStream(uri));
            if (bitmap == null) {
                return false;
            }
            WallpaperManager.getInstance(getContext()).setBitmap(bitmap);
            return true;
        } catch (Exception ignored) {
            return false;
        }
    }

    private boolean hasImageReadPermission() {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.M) {
            return true;
        }
        String permission = Build.VERSION.SDK_INT >= 33
                ? Manifest.permission.READ_MEDIA_IMAGES
                : Manifest.permission.READ_EXTERNAL_STORAGE;
        return getContext().checkSelfPermission(permission) == PackageManager.PERMISSION_GRANTED;
    }

    private String imagePermissionAlias() {
        return Build.VERSION.SDK_INT >= 33 ? "images" : "legacyImages";
    }

    private JSObject statusObject(String message) {
        JSObject result = new JSObject();
        result.put("android", true);
        result.put("wallpaperAvailable", true);
        result.put("galleryPermissionGranted", hasImageReadPermission());
        result.put("canWriteSettings", canWriteSystemSettings());
        result.put("message", message);
        return result;
    }

    private Bitmap createPenaltyWallpaper(String seed, String intensity) {
        DisplayMetrics metrics = getContext().getResources().getDisplayMetrics();
        int width = Math.max(1080, metrics.widthPixels);
        int height = Math.max(1920, metrics.heightPixels);
        int hash = Math.abs(seed.hashCode());

        Bitmap bitmap = Bitmap.createBitmap(width, height, Bitmap.Config.ARGB_8888);
        Canvas canvas = new Canvas(bitmap);

        Paint paint = new Paint(Paint.ANTI_ALIAS_FLAG);
        paint.setShader(new LinearGradient(
                0,
                0,
                width,
                height,
                new int[] { Color.rgb(2, 6, 23), Color.rgb(7, 23, 49), Color.rgb(26, 7, 39) },
                null,
                Shader.TileMode.CLAMP
        ));
        canvas.drawRect(0, 0, width, height, paint);

        paint.setShader(new RadialGradient(
                width * (0.25f + (hash % 30) / 100f),
                height * 0.28f,
                width * 0.7f,
                Color.argb(130, 34, 211, 238),
                Color.TRANSPARENT,
                Shader.TileMode.CLAMP
        ));
        canvas.drawCircle(width * 0.35f, height * 0.28f, width * 0.7f, paint);

        paint.setShader(null);
        paint.setStyle(Paint.Style.STROKE);
        paint.setStrokeWidth(2f);
        paint.setColor(Color.argb(45, 125, 211, 252));
        int grid = Math.max(52, width / 18);
        for (int x = 0; x <= width; x += grid) {
            canvas.drawLine(x, 0, x, height, paint);
        }
        for (int y = 0; y <= height; y += grid) {
            canvas.drawLine(0, y, width, y, paint);
        }

        paint.setStyle(Paint.Style.FILL);
        paint.setTextAlign(Paint.Align.CENTER);
        paint.setFakeBoldText(true);
        paint.setColor(Color.argb(230, 236, 254, 255));
        paint.setTextSize(width * 0.072f);
        canvas.drawText("SYSTEM PENALTY", width / 2f, height * 0.42f, paint);

        paint.setFakeBoldText(false);
        paint.setTextSize(width * 0.035f);
        paint.setLetterSpacing(0.12f);
        paint.setColor(Color.argb(205, 103, 232, 249));
        canvas.drawText("DAILY QUEST FAILED", width / 2f, height * 0.47f, paint);

        paint.setStyle(Paint.Style.STROKE);
        paint.setStrokeWidth(width * 0.012f);
        paint.setColor(Color.argb(210, 34, 211, 238));
        float radius = width * ("hard".equals(intensity) ? 0.19f : "light".equals(intensity) ? 0.13f : 0.16f);
        canvas.drawCircle(width / 2f, height * 0.56f, radius, paint);
        canvas.drawLine(width / 2f - radius * 0.65f, height * 0.56f, width / 2f + radius * 0.65f, height * 0.56f, paint);
        canvas.drawLine(width / 2f, height * 0.56f - radius * 0.65f, width / 2f, height * 0.56f + radius * 0.65f, paint);

        paint.setStyle(Paint.Style.FILL);
        paint.setTextSize(width * 0.034f);
        paint.setColor(Color.argb(210, 203, 213, 225));
        canvas.drawText("Wykonaj karę w aplikacji, żeby zdjąć status.", width / 2f, height * 0.72f, paint);

        return bitmap;
    }
}
