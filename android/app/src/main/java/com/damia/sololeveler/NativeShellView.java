package com.damia.sololeveler;

import android.content.Context;
import android.content.res.AssetManager;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.LinearGradient;
import android.graphics.Matrix;
import android.graphics.Paint;
import android.graphics.Path;
import android.graphics.RectF;
import android.graphics.Shader;
import android.graphics.Typeface;
import android.view.MotionEvent;
import android.view.View;

import java.io.InputStream;
import java.util.Locale;

public class NativeShellView extends View {
    public interface GameLauncher {
        void openGame(String gameId);
    }

    private static final int TAB_STATUS = 0;
    private static final int TAB_TRAINING = 1;
    private static final int TAB_GAME = 2;
    private static final int TAB_SYSTEM = 3;

    private final GameLauncher gameLauncher;
    private final Paint fill = new Paint(Paint.ANTI_ALIAS_FLAG);
    private final Paint stroke = new Paint(Paint.ANTI_ALIAS_FLAG);
    private final Paint text = new Paint(Paint.ANTI_ALIAS_FLAG);
    private final Paint imagePaint = new Paint(Paint.ANTI_ALIAS_FLAG | Paint.FILTER_BITMAP_FLAG);
    private final RectF work = new RectF();
    private final RectF content = new RectF();
    private final RectF startTrainingRect = new RectF();
    private final RectF questTrainingRect = new RectF();
    private final RectF questGameRect = new RectF();
    private final RectF[] navRects = new RectF[]{ new RectF(), new RectF(), new RectF(), new RectF() };
    private final RectF[] gameRects = new RectF[]{ new RectF(), new RectF(), new RectF(), new RectF(), new RectF() };

    private Bitmap background;
    private Bitmap avatar;
    private Bitmap gateThumb;
    private Bitmap manaThumb;
    private Bitmap strikeThumb;
    private Bitmap runeThumb;
    private Bitmap extractionThumb;
    private int activeTab = TAB_STATUS;
    private float density;
    private final float[] scrollOffsets = new float[]{0f, 0f, 0f, 0f};
    private float currentContentBottom;
    private float downX;
    private float downY;
    private float lastY;
    private boolean dragging;
    private boolean dragFromContent;

    public NativeShellView(Context context, GameLauncher gameLauncher) {
        super(context);
        this.gameLauncher = gameLauncher;
        density = getResources().getDisplayMetrics().density;
        setFocusable(true);
        setLayerType(LAYER_TYPE_HARDWARE, null);
        loadAssets();
    }

    @Override
    protected void onDraw(Canvas canvas) {
        super.onDraw(canvas);
        drawWallpaper(canvas);
        computeContent();
        currentContentBottom = content.bottom;
        int contentSave = canvas.save();
        canvas.clipRect(content);
        canvas.translate(0f, -scrollOffsets[activeTab]);
        if (activeTab == TAB_STATUS) drawStatus(canvas);
        if (activeTab == TAB_TRAINING) drawTraining(canvas);
        if (activeTab == TAB_GAME) drawGameHub(canvas);
        if (activeTab == TAB_SYSTEM) drawSystem(canvas);
        canvas.restoreToCount(contentSave);
        scrollOffsets[activeTab] = clamp(scrollOffsets[activeTab], 0f, maxScrollForActiveTab());
        drawBottomNav(canvas);
    }

    @Override
    public boolean onTouchEvent(MotionEvent event) {
        float x = event.getX();
        float y = event.getY();
        if (event.getAction() == MotionEvent.ACTION_DOWN) {
            downX = x;
            downY = y;
            lastY = y;
            dragging = false;
            dragFromContent = content.contains(x, y);
            return true;
        }
        if (event.getAction() == MotionEvent.ACTION_MOVE) {
            if (!dragFromContent) return true;
            float totalDy = y - downY;
            if (!dragging && Math.abs(totalDy) > dp(6)) dragging = true;
            if (dragging) {
                float dy = y - lastY;
                scrollOffsets[activeTab] = clamp(scrollOffsets[activeTab] - dy, 0f, maxScrollForActiveTab());
                invalidate();
            }
            lastY = y;
            return true;
        }
        if (event.getAction() != MotionEvent.ACTION_UP) return true;
        if (dragging) {
            dragging = false;
            return true;
        }
        for (int i = 0; i < navRects.length; i++) {
            if (navRects[i].contains(x, y)) {
                activeTab = i;
                invalidate();
                return true;
            }
        }
        float hitY = y + scrollOffsets[activeTab];
        if (activeTab == TAB_STATUS) {
            if (startTrainingRect.contains(x, hitY) || questTrainingRect.contains(x, hitY)) {
                activeTab = TAB_TRAINING;
                invalidate();
                return true;
            }
            if (questGameRect.contains(x, hitY)) {
                activeTab = TAB_GAME;
                invalidate();
                return true;
            }
        }
        if (activeTab == TAB_GAME) {
            for (int i = 0; i < gameRects.length; i++) {
                if (gameRects[i].contains(x, hitY)) {
                    if (i == 4) gameLauncher.openGame("shadow-extraction");
                    return true;
                }
            }
        }
        return true;
    }

    private void computeContent() {
        float side = dp(18);
        float maxWidth = Math.min(getWidth() - side * 2f, dp(430));
        float left = (getWidth() - maxWidth) * 0.5f;
        float top = Math.max(dp(16), getRootWindowInsets() == null ? dp(16) : getRootWindowInsets().getSystemWindowInsetTop() + dp(10));
        float bottom = getHeight() - dp(132);
        content.set(left, top, left + maxWidth, bottom);
    }

    private void drawStatus(Canvas canvas) {
        float y = content.top;
        drawHunterCard(canvas, content.left, y, content.width(), dp(258));
        y += dp(274);
        drawQuestCard(canvas, content.left, y, content.width(), dp(270));
        y += dp(286);
        drawDailyList(canvas, content.left, y, content.width(), content.bottom - y);
        currentContentBottom = Math.max(content.bottom, y + Math.max(0f, content.bottom - y));
    }

    private void drawHunterCard(Canvas canvas, float x, float y, float w, float h) {
        drawPanel(canvas, x, y, w, h, dp(22), Color.argb(218, 3, 10, 25), Color.argb(112, 30, 207, 232));
        drawBitmapCover(canvas, background, new RectF(x, y, x + w, y + h), dp(22), 0.12f);
        drawPanelOverlay(canvas, x, y, w, h, dp(22));

        RectF avatarRect = new RectF(x + dp(16), y + dp(18), x + dp(82), y + dp(116));
        drawPanel(canvas, avatarRect.left, avatarRect.top, avatarRect.width(), avatarRect.height(), dp(16), Color.argb(180, 4, 14, 31), Color.argb(155, 44, 195, 235));
        drawBitmapCover(canvas, avatar, avatarRect, dp(16), 1f);

        drawText(canvas, "STATUS ŁOWCY", x + dp(98), y + dp(34), dp(10), Color.rgb(31, 213, 246), true, Paint.Align.LEFT, 0.28f);
        drawText(canvas, "ERYK", x + dp(98), y + dp(68), dp(25), Color.WHITE, true, Paint.Align.LEFT, 0.04f);
        drawBadge(canvas, x + w - dp(70), y + dp(18), dp(54), dp(28), "Lv.22", true);
        drawBadge(canvas, x + dp(98), y + dp(84), dp(72), dp(24), "NAJEMNIK", false);
        drawBadge(canvas, x + dp(178), y + dp(84), dp(66), dp(24), "B-RANK", true);
        drawBadge(canvas, x + dp(252), y + dp(84), dp(72), dp(24), "CP 808", false);

        drawProgressWithLabels(canvas, x + dp(16), y + dp(130), w - dp(32), "RANGA B", "DO LV.35", 0.30f);
        drawProgressWithLabels(canvas, x + dp(16), y + dp(166), w - dp(32), "XP", "1345 / 2200", 0.61f);
        startTrainingRect.set(x + dp(16), y + h - dp(62), x + w - dp(16), y + h - dp(16));
        drawButton(canvas, startTrainingRect, "START TRENINGU", true);
    }

    private void drawQuestCard(Canvas canvas, float x, float y, float w, float h) {
        drawPanel(canvas, x, y, w, h, dp(22), Color.argb(222, 2, 12, 26), Color.argb(102, 30, 207, 232));
        drawText(canvas, "DZISIEJSZY CEL", x + dp(16), y + dp(38), dp(10), Color.rgb(151, 166, 191), true, Paint.Align.LEFT, 0.24f);
        drawText(canvas, "QUEST AKTYWNY", x + dp(16), y + dp(72), dp(21), Color.WHITE, true, Paint.Align.LEFT, 0.06f);
        drawQuestRing(canvas, x + w - dp(94), y + dp(28), dp(72), 0f);

        float tileY = y + dp(104);
        float tileW = (w - dp(44)) / 3f;
        drawStatTile(canvas, x + dp(16), tileY, tileW, dp(74), "STREAK", "1 dni", "streak");
        drawStatTile(canvas, x + dp(22) + tileW, tileY, tileW, dp(74), "HP", "1480/1480", "hp");
        drawStatTile(canvas, x + dp(28) + tileW * 2f, tileY, tileW, dp(74), "GOLD", "2198", "gold");

        questTrainingRect.set(x + dp(16), y + h - dp(64), x + w * 0.5f - dp(6), y + h - dp(18));
        questGameRect.set(x + w * 0.5f + dp(6), y + h - dp(64), x + w - dp(16), y + h - dp(18));
        drawButton(canvas, questTrainingRect, "TRENING", true);
        drawButton(canvas, questGameRect, "GRA", false);
    }

    private void drawDailyList(Canvas canvas, float x, float y, float w, float h) {
        if (h < dp(180)) return;
        drawPanel(canvas, x, y, w, h, dp(22), Color.argb(216, 3, 12, 26), Color.argb(92, 30, 207, 232));
        String[] names = {"Pompki", "Brzuszki", "Przysiady"};
        float rowH = Math.min(dp(76), (h - dp(36)) / 3f);
        for (int i = 0; i < names.length; i++) {
            float rowY = y + dp(16) + i * (rowH + dp(8));
            drawExerciseRow(canvas, x + dp(16), rowY, w - dp(32), rowH, names[i], "0 / 100");
        }
    }

    private void drawTraining(Canvas canvas) {
        float y = content.top;
        drawCompactHeader(canvas, "PLAN ŁOWCY", "TRENING", "Plan, katalog i szybkie ćwiczenia w jednym miejscu.", y);
        y += dp(106);

        float tabH = dp(52);
        drawPanel(canvas, content.left, y, content.width(), tabH, dp(20), Color.argb(226, 3, 12, 26), Color.argb(86, 30, 207, 232));
        float tabW = (content.width() - dp(20)) / 3f;
        drawButton(canvas, new RectF(content.left + dp(8), y + dp(7), content.left + dp(8) + tabW, y + tabH - dp(7)), "DZIŚ", false);
        drawButton(canvas, new RectF(content.left + dp(10) + tabW, y + dp(7), content.left + dp(10) + tabW * 2f, y + tabH - dp(7)), "PLAN", true);
        drawButton(canvas, new RectF(content.left + dp(12) + tabW * 2f, y + dp(7), content.right - dp(8), y + tabH - dp(7)), "KATALOG", false);

        y += tabH + dp(14);
        drawPanel(canvas, content.left, y, content.width(), dp(178), dp(22), Color.argb(224, 3, 12, 26), Color.argb(98, 30, 207, 232));
        drawText(canvas, "PLAN ŁOWCY", content.left + dp(16), y + dp(30), dp(10), Color.rgb(31, 213, 246), true, Paint.Align.LEFT, 0.24f);
        drawText(canvas, "TWOJE ĆWICZENIA", content.left + dp(16), y + dp(60), dp(19), Color.WHITE, true, Paint.Align.LEFT, 0.04f);
        drawText(canvas, "Dodaj ruch z katalogu i dopiero wtedy odpal sesję.", content.left + dp(16), y + dp(86), dp(12), Color.rgb(166, 180, 205), false, Paint.Align.LEFT, 0f);
        RectF run = new RectF(content.left + dp(16), y + dp(102), content.right - dp(16), y + dp(144));
        drawButton(canvas, run, "URUCHOM PLAN", false);
        drawText(canvas, "ĆWICZENIA 0", content.left + dp(18), y + dp(164), dp(10), Color.rgb(151, 166, 191), true, Paint.Align.LEFT, 0.16f);
        drawText(canvas, "SERIE 0/0", content.left + content.width() * 0.5f, y + dp(164), dp(10), Color.rgb(151, 166, 191), true, Paint.Align.CENTER, 0.16f);
        drawText(canvas, "POSTĘP 0%", content.right - dp(18), y + dp(164), dp(10), Color.rgb(151, 166, 191), true, Paint.Align.RIGHT, 0.16f);

        y += dp(194);
        drawPanel(canvas, content.left, y, content.width(), dp(300), dp(22), Color.argb(224, 3, 12, 26), Color.argb(112, 30, 207, 232));
        drawText(canvas, "KATALOG ĆWICZEŃ", content.left + dp(16), y + dp(32), dp(10), Color.rgb(31, 213, 246), true, Paint.Align.LEFT, 0.24f);
        drawText(canvas, "BEZ SPRZĘTU", content.left + dp(16), y + dp(62), dp(20), Color.WHITE, true, Paint.Align.LEFT, 0.05f);
        drawInput(canvas, content.left + dp(16), y + dp(78), content.width() - dp(32), dp(40), "Szukaj ćwiczenia");
        drawCatalogItem(canvas, content.left + dp(16), y + dp(132), content.width() - dp(32), dp(46), "Pompki", "Siła · klatka · triceps", "+");
        drawCatalogItem(canvas, content.left + dp(16), y + dp(184), content.width() - dp(32), dp(46), "Plank", "Core · stabilizacja · kara", "+");
        drawCatalogItem(canvas, content.left + dp(16), y + dp(236), content.width() - dp(32), dp(46), "Mountain climbers", "Kondycja · brzuch · tempo", "+");
        currentContentBottom = y + dp(300);
    }

    private void drawCatalogItem(Canvas canvas, float x, float y, float w, float h, String name, String meta, String action) {
        drawPanel(canvas, x, y, w, h, dp(16), Color.argb(196, 1, 7, 18), Color.argb(82, 63, 180, 220));
        drawIconBox(canvas, x + dp(8), y + dp(7), dp(32), "plus");
        drawText(canvas, name, x + dp(52), y + dp(20), dp(14), Color.WHITE, true, Paint.Align.LEFT, 0f);
        drawText(canvas, meta, x + dp(52), y + dp(38), dp(10), Color.rgb(158, 174, 202), false, Paint.Align.LEFT, 0f);
        drawBadge(canvas, x + w - dp(46), y + dp(10), dp(32), dp(26), action, true);
    }

    private void drawCompactHeader(Canvas canvas, String kicker, String title, String body, float y) {
        drawPanel(canvas, content.left, y, content.width(), dp(86), dp(22), Color.argb(222, 3, 12, 26), Color.argb(96, 30, 207, 232));
        drawText(canvas, kicker, content.left + dp(16), y + dp(28), dp(10), Color.rgb(31, 213, 246), true, Paint.Align.LEFT, 0.28f);
        drawText(canvas, title, content.left + dp(16), y + dp(58), dp(22), Color.WHITE, true, Paint.Align.LEFT, 0.04f);
        drawText(canvas, body, content.left + dp(16), y + dp(78), dp(10), Color.rgb(166, 180, 205), false, Paint.Align.LEFT, 0f);
    }

    private void drawGameHub(Canvas canvas) {
        float y = content.top;
        drawCompactHeader(canvas, "BONUS", "GRY SYSTEMU", "Wybierz próbę. Rozgrywka otwiera osobną scenę.", y);
        y += dp(96);
        float panelH = Math.min(dp(548), content.bottom - y - dp(8));
        drawPanel(canvas, content.left, y, content.width(), panelH, dp(22), Color.argb(224, 3, 12, 26), Color.argb(104, 30, 207, 232));
        drawText(canvas, "SYSTEM GATES", content.left + dp(16), y + dp(30), dp(10), Color.rgb(31, 213, 246), true, Paint.Align.LEFT, 0.28f);
        drawText(canvas, "SYMULACJE RANGI", content.left + dp(16), y + dp(62), dp(20), Color.WHITE, true, Paint.Align.LEFT, 0.06f);
        drawText(canvas, "Mini-gry rozwijają rangę i loot.", content.left + dp(16), y + dp(86), dp(11), Color.rgb(166, 180, 205), false, Paint.Align.LEFT, 0f);
        drawBadge(canvas, content.right - dp(82), y + dp(22), dp(60), dp(42), "5/5", true);

        float gridTop = y + dp(104);
        float gap = dp(8);
        float colW = (content.width() - dp(32) - gap) / 2f;
        float cardH = Math.max(dp(112), Math.min(dp(136), (panelH - dp(120) - gap * 2f) / 3f));
        String[] titles = {"BRAMA REFLEKSU", "SEKWENCJA MANY", "CIĘCIE CIENIA", "ZAMEK RUNICZNY", "EKSTRAKCJA CIENIA"};
        String[] subtitles = {"Szybka reakcja · rekord 2075", "Pamięć i rytm · rekord 0", "Timing ataku · rekord 2642", "Sekwencja presji · rekord 600", "Analiza celu · rekord 7579"};
        Bitmap[] thumbs = {gateThumb, manaThumb, strikeThumb, runeThumb, extractionThumb};
        int[] levels = {4, 1, 8, 3, 17};
        for (int i = 0; i < titles.length; i++) {
            int col = i % 2;
            int row = i / 2;
            float rowX = content.left + dp(16) + col * (colW + gap);
            float rowY = gridTop + row * (cardH + gap);
            gameRects[i].set(rowX, rowY, rowX + colW, rowY + cardH);
            drawGameCard(canvas, gameRects[i], titles[i], subtitles[i], levels[i], thumbs[i], i == 4);
        }
        drawComingSoonCard(canvas, content.left + dp(16) + colW + gap, gridTop + 2f * (cardH + gap), colW, cardH);
        currentContentBottom = y + panelH;
    }

    private void drawComingSoonCard(Canvas canvas, float x, float y, float w, float h) {
        drawPanel(canvas, x, y, w, h, dp(20), Color.argb(150, 5, 11, 25), Color.argb(70, 95, 137, 165));
        drawText(canvas, "✦", x + dp(18), y + dp(34), dp(22), Color.rgb(145, 160, 185), true, Paint.Align.LEFT, 0f);
        drawBadge(canvas, x + w - dp(64), y + dp(14), dp(50), dp(24), "SOON", false);
        drawText(canvas, "NOWA", x + dp(14), y + h - dp(52), dp(15), Color.rgb(190, 205, 220), true, Paint.Align.LEFT, 0.08f);
        drawText(canvas, "SYMULACJA", x + dp(14), y + h - dp(30), dp(15), Color.rgb(190, 205, 220), true, Paint.Align.LEFT, 0.08f);
        drawProgress(canvas, x + dp(14), y + h - dp(12), w - dp(28), 0.33f);
    }

    private void drawSystem(Canvas canvas) {
        float y = content.top;
        drawHeader(canvas, "SYSTEM", "USTAWIENIA", "Natywny panel będzie przenoszony modułami: Health, audio, wydajność, sklep i dev.", y);
        y += dp(142);
        drawPanel(canvas, content.left, y, content.width(), dp(112), dp(22), Color.argb(224, 3, 18, 31), Color.argb(100, 30, 207, 232));
        drawText(canvas, "ANDROID 14+ / GAME MODE", content.left + dp(16), y + dp(38), dp(10), Color.rgb(31, 213, 246), true, Paint.Align.LEFT, 0.24f);
        drawText(canvas, "120 Hz · libGDX · GPU canvas", content.left + dp(16), y + dp(74), dp(20), Color.WHITE, true, Paint.Align.LEFT, 0.02f);
        y += dp(128);
        drawPanel(canvas, content.left, y, content.width(), dp(154), dp(22), Color.argb(224, 3, 18, 31), Color.argb(100, 30, 207, 232));
        drawStatTile(canvas, content.left + dp(16), y + dp(22), (content.width() - dp(44)) / 3f, dp(82), "TRYB", "GRA", "game");
        drawStatTile(canvas, content.left + dp(22) + (content.width() - dp(44)) / 3f, y + dp(22), (content.width() - dp(44)) / 3f, dp(82), "CEL", "120Hz", "hz");
        drawStatTile(canvas, content.left + dp(28) + ((content.width() - dp(44)) / 3f) * 2f, y + dp(22), (content.width() - dp(44)) / 3f, dp(82), "FPS", "DEV", "fps");
        currentContentBottom = y + dp(154);
    }

    private void drawHeader(Canvas canvas, String kicker, String title, String body, float y) {
        drawPanel(canvas, content.left, y, content.width(), dp(120), dp(22), Color.argb(222, 3, 12, 26), Color.argb(96, 30, 207, 232));
        drawText(canvas, kicker, content.left + dp(16), y + dp(34), dp(10), Color.rgb(31, 213, 246), true, Paint.Align.LEFT, 0.28f);
        drawText(canvas, title, content.left + dp(16), y + dp(70), dp(24), Color.WHITE, true, Paint.Align.LEFT, 0.04f);
        drawText(canvas, body, content.left + dp(16), y + dp(98), dp(13), Color.rgb(166, 180, 205), false, Paint.Align.LEFT, 0f);
    }

    private void drawGameCard(Canvas canvas, RectF r, String title, String subtitle, int level, Bitmap thumb, boolean nativeReady) {
        drawPanel(canvas, r.left, r.top, r.width(), r.height(), dp(22),
            nativeReady ? Color.argb(224, 2, 18, 34) : Color.argb(214, 3, 12, 26),
            nativeReady ? Color.argb(170, 30, 207, 232) : Color.argb(86, 55, 122, 150));
        drawBitmapCover(canvas, thumb, r, dp(22), nativeReady ? 0.28f : 0.20f);
        drawPanelOverlay(canvas, r.left, r.top, r.width(), r.height(), dp(22));

        float left = r.left + dp(14);
        float right = r.right - dp(14);
        drawBadge(canvas, right - dp(56), r.top + dp(10), dp(56), dp(24), "LV." + level, true);
        drawText(canvas, title, left, r.top + dp(52), dp(14), Color.WHITE, true, Paint.Align.LEFT, 0.03f);
        drawText(canvas, subtitle, left, r.top + dp(74), dp(9), Color.rgb(174, 188, 212), false, Paint.Align.LEFT, 0f);
        drawText(canvas, nativeReady ? "DOTKNIJ, ABY WEJŚĆ" : "ODKRYJ WKRÓTCE", left, r.bottom - dp(30), dp(7), nativeReady ? Color.rgb(55, 229, 245) : Color.rgb(116, 134, 162), true, Paint.Align.LEFT, 0.18f);
        drawProgress(canvas, left, r.bottom - dp(18), r.width() - dp(28), nativeReady ? 1f : Math.min(0.85f, level / 12f));
    }

    private void drawExerciseRow(Canvas canvas, float x, float y, float w, float h, String name, String value) {
        drawPanel(canvas, x, y, w, h, dp(18), Color.argb(196, 1, 7, 18), Color.argb(82, 63, 180, 220));
        drawText(canvas, name, x + dp(14), y + dp(28), dp(16), Color.WHITE, true, Paint.Align.LEFT, 0f);
        drawText(canvas, value, x + w - dp(14), y + dp(28), dp(12), Color.rgb(166, 180, 205), false, Paint.Align.RIGHT, 0f);
        drawProgress(canvas, x + dp(14), y + h - dp(18), w - dp(28), 0f);
    }

    private void drawBottomNav(Canvas canvas) {
        float left = content.left;
        float right = content.right;
        float y = getHeight() - dp(104);
        float gap = dp(8);
        float itemW = (right - left - gap * 3f) / 4f;
        String[] labels = {"STATUS", "TRENING", "GRA", "SYSTEM"};
        for (int i = 0; i < 4; i++) {
            float x = left + i * (itemW + gap);
            navRects[i].set(x, y, x + itemW, y + dp(78));
            boolean active = activeTab == i;
            drawPanel(canvas, x, y, itemW, dp(78), dp(18),
                active ? Color.argb(226, 0, 71, 92) : Color.argb(218, 5, 10, 24),
                active ? Color.argb(190, 52, 220, 244) : Color.argb(104, 55, 90, 120));
            drawNavIcon(canvas, i, x + itemW * 0.5f, y + dp(28), dp(11), active ? Color.WHITE : Color.rgb(145, 160, 185));
            drawText(canvas, labels[i], x + itemW * 0.5f, y + dp(58), dp(10), active ? Color.WHITE : Color.rgb(145, 160, 185), true, Paint.Align.CENTER, 0.18f);
        }
    }

    private void drawWallpaper(Canvas canvas) {
        drawBitmapCover(canvas, background, new RectF(0, 0, getWidth(), getHeight()), 0, 1f);
        fill.setShader(new LinearGradient(0, 0, 0, getHeight(), Color.argb(206, 2, 7, 18), Color.argb(228, 1, 5, 14), Shader.TileMode.CLAMP));
        canvas.drawRect(0, 0, getWidth(), getHeight(), fill);
        fill.setShader(null);
    }

    private void drawPanel(Canvas canvas, float x, float y, float w, float h, float radius, int color, int border) {
        work.set(x, y, x + w, y + h);
        fill.setStyle(Paint.Style.FILL);
        fill.setColor(color);
        canvas.drawRoundRect(work, radius, radius, fill);
        stroke.setStyle(Paint.Style.STROKE);
        stroke.setStrokeWidth(dp(1));
        stroke.setColor(border);
        canvas.drawRoundRect(work, radius, radius, stroke);
    }

    private void drawPanelOverlay(Canvas canvas, float x, float y, float w, float h, float radius) {
        work.set(x, y, x + w, y + h);
        fill.setShader(new LinearGradient(x, y, x + w, y, Color.argb(232, 3, 10, 25), Color.argb(136, 3, 10, 25), Shader.TileMode.CLAMP));
        canvas.drawRoundRect(work, radius, radius, fill);
        fill.setShader(null);
    }

    private void drawButton(Canvas canvas, RectF r, String label, boolean primary) {
        drawPanel(canvas, r.left, r.top, r.width(), r.height(), dp(16),
            primary ? Color.argb(226, 0, 78, 98) : Color.argb(220, 11, 18, 36),
            primary ? Color.argb(175, 53, 223, 246) : Color.argb(105, 67, 101, 135));
        drawText(canvas, label, r.centerX(), r.centerY() + dp(5), dp(13), primary ? Color.WHITE : Color.rgb(175, 186, 205), true, Paint.Align.CENTER, 0.16f);
    }

    private void setupIconStroke(int color, float width) {
        stroke.setShader(null);
        stroke.setStyle(Paint.Style.STROKE);
        stroke.setStrokeWidth(width);
        stroke.setStrokeCap(Paint.Cap.ROUND);
        stroke.setStrokeJoin(Paint.Join.ROUND);
        stroke.setColor(color);
    }

    private void drawPlusIcon(Canvas canvas, float cx, float cy, float s, int color) {
        setupIconStroke(color, dp(2.2f));
        canvas.drawLine(cx - s, cy, cx + s, cy, stroke);
        canvas.drawLine(cx, cy - s, cx, cy + s, stroke);
    }

    private void drawNavIcon(Canvas canvas, int type, float cx, float cy, float s, int color) {
        setupIconStroke(color, dp(1.9f));
        if (type == TAB_STATUS) {
            Path p = new Path();
            p.moveTo(cx - s, cy);
            p.lineTo(cx, cy - s * 0.85f);
            p.lineTo(cx + s, cy);
            canvas.drawPath(p, stroke);
            work.set(cx - s * 0.62f, cy, cx + s * 0.62f, cy + s * 0.95f);
            canvas.drawRoundRect(work, dp(2), dp(2), stroke);
            return;
        }
        if (type == TAB_TRAINING) {
            canvas.drawLine(cx - s * 1.15f, cy, cx + s * 1.15f, cy, stroke);
            canvas.drawLine(cx - s * 0.78f, cy - s * 0.58f, cx - s * 0.78f, cy + s * 0.58f, stroke);
            canvas.drawLine(cx + s * 0.78f, cy - s * 0.58f, cx + s * 0.78f, cy + s * 0.58f, stroke);
            canvas.drawLine(cx - s * 1.08f, cy - s * 0.4f, cx - s * 1.08f, cy + s * 0.4f, stroke);
            canvas.drawLine(cx + s * 1.08f, cy - s * 0.4f, cx + s * 1.08f, cy + s * 0.4f, stroke);
            return;
        }
        if (type == TAB_GAME) {
            work.set(cx - s * 1.05f, cy - s * 0.62f, cx + s * 1.05f, cy + s * 0.62f);
            canvas.drawRoundRect(work, dp(6), dp(6), stroke);
            canvas.drawLine(cx - s * 0.58f, cy, cx - s * 0.22f, cy, stroke);
            canvas.drawLine(cx - s * 0.4f, cy - s * 0.18f, cx - s * 0.4f, cy + s * 0.18f, stroke);
            fill.setStyle(Paint.Style.FILL);
            fill.setColor(color);
            canvas.drawCircle(cx + s * 0.38f, cy - s * 0.12f, dp(1.5f), fill);
            canvas.drawCircle(cx + s * 0.66f, cy + s * 0.14f, dp(1.5f), fill);
            return;
        }
        canvas.drawCircle(cx, cy, s * 0.52f, stroke);
        for (int i = 0; i < 8; i++) {
            double a = i * Math.PI / 4.0;
            float x1 = cx + (float) Math.cos(a) * s * 0.78f;
            float y1 = cy + (float) Math.sin(a) * s * 0.78f;
            float x2 = cx + (float) Math.cos(a) * s * 1.08f;
            float y2 = cy + (float) Math.sin(a) * s * 1.08f;
            canvas.drawLine(x1, y1, x2, y2, stroke);
        }
    }

    private void drawSmallIcon(Canvas canvas, String type, float cx, float cy, float s, int color) {
        setupIconStroke(color, dp(1.6f));
        if ("streak".equals(type)) {
            work.set(cx - s, cy - s * 0.75f, cx + s, cy + s * 0.45f);
            canvas.drawRoundRect(work, dp(3), dp(3), stroke);
            canvas.drawLine(cx - s * 0.55f, cy + s * 0.45f, cx - s * 0.2f, cy + s * 1.05f, stroke);
            canvas.drawLine(cx + s * 0.55f, cy + s * 0.45f, cx + s * 0.2f, cy + s * 1.05f, stroke);
            canvas.drawLine(cx - s * 0.65f, cy + s * 1.05f, cx + s * 0.65f, cy + s * 1.05f, stroke);
        } else if ("hp".equals(type)) {
            Path p = new Path();
            p.moveTo(cx, cy - s * 1.15f);
            p.lineTo(cx + s, cy - s * 0.45f);
            p.lineTo(cx + s * 0.72f, cy + s * 0.8f);
            p.lineTo(cx, cy + s * 1.2f);
            p.lineTo(cx - s * 0.72f, cy + s * 0.8f);
            p.lineTo(cx - s, cy - s * 0.45f);
            p.close();
            canvas.drawPath(p, stroke);
        } else if ("gold".equals(type)) {
            work.set(cx - s * 1.2f, cy - s * 0.55f, cx + s * 1.2f, cy + s * 0.55f);
            canvas.drawRoundRect(work, dp(3), dp(3), stroke);
            canvas.drawLine(cx - s * 0.55f, cy - s * 0.55f, cx - s * 0.2f, cy + s * 0.55f, stroke);
            canvas.drawLine(cx + s * 0.2f, cy - s * 0.55f, cx + s * 0.55f, cy + s * 0.55f, stroke);
        } else if ("game".equals(type)) {
            drawNavIcon(canvas, TAB_GAME, cx, cy, s, color);
        } else if ("hz".equals(type)) {
            Path p = new Path();
            p.moveTo(cx - s * 1.3f, cy);
            p.cubicTo(cx - s * 0.75f, cy - s, cx - s * 0.3f, cy + s, cx + s * 0.2f, cy);
            p.cubicTo(cx + s * 0.55f, cy - s * 0.65f, cx + s * 0.92f, cy - s * 0.3f, cx + s * 1.3f, cy - s * 0.72f);
            canvas.drawPath(p, stroke);
        } else if ("fps".equals(type)) {
            Path p = new Path();
            p.moveTo(cx + s * 0.15f, cy - s * 1.25f);
            p.lineTo(cx - s * 0.75f, cy + s * 0.1f);
            p.lineTo(cx + s * 0.05f, cy + s * 0.1f);
            p.lineTo(cx - s * 0.18f, cy + s * 1.25f);
            p.lineTo(cx + s * 0.85f, cy - s * 0.25f);
            p.lineTo(cx + s * 0.05f, cy - s * 0.25f);
            canvas.drawPath(p, stroke);
        }
    }

    private void drawInput(Canvas canvas, float x, float y, float w, float h, String label) {
        drawPanel(canvas, x, y, w, h, dp(16), Color.argb(202, 2, 8, 19), Color.argb(80, 88, 129, 158));
        drawText(canvas, label, x + dp(16), y + dp(31), dp(14), Color.rgb(140, 156, 181), false, Paint.Align.LEFT, 0f);
    }

    private void drawIconBox(Canvas canvas, float x, float y, float size, String icon) {
        drawPanel(canvas, x, y, size, size, dp(14), Color.argb(222, 3, 66, 82), Color.argb(170, 51, 220, 244));
        if ("plus".equals(icon)) {
            drawPlusIcon(canvas, x + size * 0.5f, y + size * 0.5f, size * 0.24f, Color.rgb(210, 252, 255));
        }
    }

    private void drawStatTile(Canvas canvas, float x, float y, float w, float h, String label, String value, String icon) {
        drawPanel(canvas, x, y, w, h, dp(16), Color.argb(190, 1, 7, 18), Color.argb(78, 70, 113, 145));
        if (!icon.isEmpty()) drawSmallIcon(canvas, icon, x + dp(22), y + dp(20), dp(7), Color.rgb(39, 223, 246));
        drawText(canvas, label, x + dp(14), y + dp(42), dp(9), Color.rgb(145, 160, 185), true, Paint.Align.LEFT, 0.16f);
        drawText(canvas, value, x + dp(14), y + dp(64), dp(15), Color.WHITE, true, Paint.Align.LEFT, 0f);
    }

    private void drawProgressWithLabels(Canvas canvas, float x, float y, float w, String left, String right, float pct) {
        drawText(canvas, left, x, y, dp(10), Color.rgb(145, 160, 185), true, Paint.Align.LEFT, 0.16f);
        drawText(canvas, right, x + w, y, dp(10), Color.rgb(145, 160, 185), true, Paint.Align.RIGHT, 0.16f);
        drawProgress(canvas, x, y + dp(14), w, pct);
    }

    private void drawProgress(Canvas canvas, float x, float y, float w, float pct) {
        drawPanel(canvas, x, y, w, dp(7), dp(5), Color.argb(210, 0, 0, 0), Color.argb(95, 74, 116, 136));
        fill.setColor(Color.rgb(38, 221, 235));
        canvas.drawRoundRect(new RectF(x, y, x + w * Math.max(0f, Math.min(1f, pct)), y + dp(7)), dp(5), dp(5), fill);
    }

    private void drawQuestRing(Canvas canvas, float x, float y, float size, float pct) {
        float strokeWidth = dp(8);
        RectF ring = new RectF(x + strokeWidth, y + strokeWidth, x + size - strokeWidth, y + size - strokeWidth);
        stroke.setStyle(Paint.Style.STROKE);
        stroke.setStrokeWidth(strokeWidth);
        stroke.setStrokeCap(Paint.Cap.ROUND);
        stroke.setColor(Color.argb(220, 5, 11, 27));
        canvas.drawOval(ring, stroke);
        stroke.setColor(Color.rgb(28, 213, 238));
        canvas.drawArc(ring, -90, 360f * pct, false, stroke);
        stroke.setStrokeCap(Paint.Cap.BUTT);
        drawText(canvas, Math.round(pct * 100f) + "%", x + size * 0.5f, y + size * 0.50f, dp(18), Color.WHITE, true, Paint.Align.CENTER, 0f);
        drawText(canvas, "QUEST", x + size * 0.5f, y + size * 0.70f, dp(8), Color.rgb(145, 160, 185), true, Paint.Align.CENTER, 0.12f);
    }

    private void drawBadge(Canvas canvas, float x, float y, float w, float h, String label, boolean active) {
        drawPanel(canvas, x, y, w, h, h * 0.5f,
            active ? Color.argb(220, 8, 83, 101) : Color.argb(190, 10, 17, 35),
            active ? Color.argb(150, 51, 220, 244) : Color.argb(100, 83, 118, 150));
        drawText(canvas, label, x + w * 0.5f, y + h * 0.66f, dp(10), active ? Color.WHITE : Color.rgb(190, 205, 220), true, Paint.Align.CENTER, 0.1f);
    }

    private void drawBitmapCover(Canvas canvas, Bitmap bitmap, RectF dst, float radius, float alpha) {
        if (bitmap == null || bitmap.isRecycled()) return;
        int save = canvas.save();
        if (radius > 0f) {
            Path path = new Path();
            path.addRoundRect(dst, radius, radius, Path.Direction.CW);
            canvas.clipPath(path);
        }
        float scale = Math.max(dst.width() / bitmap.getWidth(), dst.height() / bitmap.getHeight());
        float dx = dst.left + (dst.width() - bitmap.getWidth() * scale) * 0.5f;
        float dy = dst.top + (dst.height() - bitmap.getHeight() * scale) * 0.5f;
        Matrix matrix = new Matrix();
        matrix.setScale(scale, scale);
        matrix.postTranslate(dx, dy);
        imagePaint.setAlpha(Math.round(255 * Math.max(0f, Math.min(1f, alpha))));
        canvas.drawBitmap(bitmap, matrix, imagePaint);
        imagePaint.setAlpha(255);
        canvas.restoreToCount(save);
    }

    private void drawText(Canvas canvas, String value, float x, float baseline, float size, int color, boolean bold, Paint.Align align, float letterSpacing) {
        text.setShader(null);
        text.setColor(color);
        text.setTextSize(size);
        text.setTextAlign(align);
        text.setTypeface(bold ? Typeface.DEFAULT_BOLD : Typeface.DEFAULT);
        text.setLetterSpacing(letterSpacing);
        canvas.drawText(value, x, baseline, text);
    }

    private Bitmap loadBitmapByPrefix(String prefix) {
        try {
            AssetManager assets = getContext().getAssets();
            String[] names = assets.list("public/assets");
            if (names == null) return null;
            for (String name : names) {
                if (name.toLowerCase(Locale.ROOT).startsWith(prefix.toLowerCase(Locale.ROOT))) {
                    try (InputStream input = assets.open("public/assets/" + name)) {
                        return BitmapFactory.decodeStream(input);
                    }
                }
            }
        } catch (Exception ignored) {
            return null;
        }
        return null;
    }

    private void loadAssets() {
        background = loadBitmapByPrefix("solo-purple-citadel");
        if (background == null) background = loadBitmapByPrefix("01-shadow-citadel-purple");
        avatar = loadBitmapByPrefix("Ranga_B_Eryk");
        gateThumb = loadBitmapByPrefix("game-gate-dodge");
        manaThumb = loadBitmapByPrefix("game-mana-memory");
        strikeThumb = loadBitmapByPrefix("game-shadow-strike");
        runeThumb = loadBitmapByPrefix("game-rune-lock");
        extractionThumb = loadBitmapByPrefix("game-shadow-extraction");
    }

    private float dp(float value) {
        return value * density;
    }

    private float maxScrollForActiveTab() {
        return Math.max(0f, currentContentBottom - content.bottom);
    }

    private float clamp(float value, float min, float max) {
        return Math.max(min, Math.min(max, value));
    }
}
