package com.damia.sololeveler;

import com.badlogic.gdx.ApplicationAdapter;
import com.badlogic.gdx.Gdx;
import com.badlogic.gdx.Input;
import com.badlogic.gdx.graphics.Color;
import com.badlogic.gdx.graphics.GL20;
import com.badlogic.gdx.graphics.OrthographicCamera;
import com.badlogic.gdx.graphics.Texture;
import com.badlogic.gdx.graphics.g2d.BitmapFont;
import com.badlogic.gdx.graphics.g2d.GlyphLayout;
import com.badlogic.gdx.graphics.g2d.SpriteBatch;
import com.badlogic.gdx.graphics.g2d.freetype.FreeTypeFontGenerator;
import com.badlogic.gdx.graphics.g2d.freetype.FreeTypeFontGenerator.FreeTypeFontParameter;
import com.badlogic.gdx.graphics.glutils.ShapeRenderer;
import com.badlogic.gdx.math.MathUtils;

import java.util.ArrayList;
import java.util.Iterator;
import java.util.List;

import org.json.JSONObject;

public class ShadowExtractionNativeGame extends ApplicationAdapter {
    public interface Host {
        int getBestScore();
        void setBestScore(int score);
        int getGameLevel();
        void setGameLevel(int level);
        int getGold();
        void setGold(int gold);
        int getHp();
        void setHp(int hp);
        int getBaseHp();
        int getPlayerLevel();
        void setPlayerLevel(int level);
        int getPlayerXp();
        void setPlayerXp(int xp);
        boolean shouldShowFpsOverlay();
        String getGraphicsQuality();
        void setNativeState(String state);
        void saveRoundResult(String resultJson);
        void exitGame();
    }

    private enum Phase {
        READY,
        RUNNING,
        PAUSED,
        RESULT
    }

    private enum TargetType {
        SHADOW,
        GOLD,
        BOMB,
        HEART,
        TIME,
        DECOY
    }

    private static class Button {
        float x;
        float y;
        float w;
        float h;

        void set(float x, float y, float w, float h) {
            this.x = x;
            this.y = y;
            this.w = w;
            this.h = h;
        }

        boolean contains(float px, float py) {
            return px >= x && px <= x + w && py >= y && py <= y + h;
        }
    }

    private static class Target {
        TargetType type;
        float x;
        float y;
        float vx;
        float vy;
        float radius;
        float age;
        float life;
        boolean alive;

        void reset(TargetType type, float x, float y, float vx, float vy, float radius, float life) {
            this.type = type;
            this.x = x;
            this.y = y;
            this.vx = vx;
            this.vy = vy;
            this.radius = radius;
            this.age = 0f;
            this.life = life;
            this.alive = true;
        }
    }

    private static class Burst {
        float x;
        float y;
        float age;
        float life;
        Color color;
        boolean bomb;

        Burst(float x, float y, Color color, boolean bomb) {
            this.x = x;
            this.y = y;
            this.color = new Color(color);
            this.bomb = bomb;
            this.life = bomb ? 0.52f : 0.34f;
        }
    }

    private static class TrailPoint {
        float x;
        float y;
        float age;

        TrailPoint(float x, float y) {
            this.x = x;
            this.y = y;
        }
    }

    private final Host host;
    private final Button topActionButton = new Button();
    private final Button startButton = new Button();
    private final Button replayButton = new Button();
    private final Button exitButton = new Button();
    private final Button continueButton = new Button();
    private final Button pauseExitButton = new Button();
    private final List<Target> targets = new ArrayList<>();
    private final List<Burst> bursts = new ArrayList<>();
    private final List<TrailPoint> trail = new ArrayList<>();
    private final GlyphLayout layout = new GlyphLayout();
    private final Color colorBgDark = new Color(0.005f, 0.01f, 0.03f, 1f);
    private final Color colorPanel = new Color(0.02f, 0.055f, 0.09f, 0.92f);
    private final Color colorTextStrong = new Color(0.94f, 0.98f, 1f, 1f);
    private final Color colorMuted = new Color(0.62f, 0.70f, 0.82f, 1f);
    private final Color colorAccent = new Color(0.09f, 0.78f, 0.88f, 1f);
    private final Color colorCyan = new Color(0.20f, 0.92f, 1f, 1f);
    private final Color colorGold = new Color(1f, 0.72f, 0.12f, 1f);
    private final Color colorDanger = new Color(0.72f, 0.12f, 0.18f, 1f);
    private final Color colorSuccess = new Color(0.20f, 0.95f, 0.58f, 1f);
    private final Color colorViolet = new Color(0.62f, 0.26f, 1f, 1f);
    private final Color colorDecoy = new Color(0.8f, 0.16f, 0.2f, 1f);
    private final Color colorProgressTrack = new Color(0.0f, 0.0f, 0.0f, 0.52f);

    private ShapeRenderer shapes;
    private SpriteBatch batch;
    private BitmapFont font;
    private OrthographicCamera camera;
    private Texture backgroundTexture;
    private Texture shadowTexture;
    private Texture decoyTexture;
    private Texture heartTexture;
    private Phase phase = Phase.READY;

    private float width;
    private float height;
    private float scale;
    private float elapsed;
    private float roundTime;
    private float roundDuration;
    private float spawnTimer;
    private float resultTimer;
    private float lastX;
    private float lastY;
    private boolean slicing;

    private int score;
    private int combo;
    private int missed;
    private int previousBest;
    private int gameLevelBefore;
    private int gameLevelAfter;
    private int playerLevelBefore;
    private int playerLevelAfter;
    private int playerXpBefore;
    private int playerXpAfter;
    private int goldBefore;
    private int goldAfter;
    private int hpBefore;
    private int hpAfter;
    private int xpReward;
    private int goldReward;
    private int hpDelta;
    private boolean won;
    private boolean newBest;
    private String lootName = "";
    private String resultNote = "";
    private String tip = "Tnij dlugim gestem przez srodek cienia.";
    private String graphicsQuality = "balanced";
    private boolean fpsOverlayEnabled;
    private float fpsSampleTimer;
    private int fpsSampleFrames;
    private float fpsCurrent;
    private float fpsAverage;
    private float fpsMin = 999f;
    private float fpsFrameMs;
    private int fpsSampleCount;

    public ShadowExtractionNativeGame(Host host) {
        this.host = host;
    }

    private Texture loadTexture(String path) {
        try {
            Texture texture = new Texture(Gdx.files.internal(path));
            texture.setFilter(Texture.TextureFilter.Linear, Texture.TextureFilter.Linear);
            return texture;
        } catch (Exception exception) {
            return null;
        }
    }

    private BitmapFont createInterfaceFont() {
        try {
            FreeTypeFontGenerator generator = new FreeTypeFontGenerator(Gdx.files.internal("native-game/Orbitron-wght.ttf"));
            FreeTypeFontParameter parameter = new FreeTypeFontParameter();
            parameter.size = 34;
            parameter.characters = FreeTypeFontGenerator.DEFAULT_CHARS + "ąćęłńóśźżĄĆĘŁŃÓŚŹŻ";
            parameter.minFilter = Texture.TextureFilter.Linear;
            parameter.magFilter = Texture.TextureFilter.Linear;
            BitmapFont generatedFont = generator.generateFont(parameter);
            generatedFont.setUseIntegerPositions(false);
            generator.dispose();
            return generatedFont;
        } catch (Exception exception) {
            BitmapFont fallback = new BitmapFont();
            fallback.getRegion().getTexture().setFilter(Texture.TextureFilter.Linear, Texture.TextureFilter.Linear);
            fallback.setUseIntegerPositions(false);
            return fallback;
        }
    }

    @Override
    public void create() {
        shapes = new ShapeRenderer();
        batch = new SpriteBatch();
        font = createInterfaceFont();
        camera = new OrthographicCamera();
        fpsOverlayEnabled = host.shouldShowFpsOverlay();
        graphicsQuality = normalizeGraphicsQuality(host.getGraphicsQuality());
        backgroundTexture = loadTexture("native-game/shadow-extraction-bg.jpg");
        shadowTexture = loadTexture("native-game/shadow-wraith.png");
        decoyTexture = loadTexture("native-game/shadow-decoy.png");
        heartTexture = loadTexture("native-game/heart-relic.png");
        Gdx.input.setCatchKey(Input.Keys.BACK, true);
        resize(Gdx.graphics.getWidth(), Gdx.graphics.getHeight());
        host.setNativeState("miniGame");
    }

    @Override
    public void resize(int w, int h) {
        width = Math.max(1, w);
        height = Math.max(1, h);
        scale = MathUtils.clamp(Math.min(width / 900f, height / 430f), 0.72f, 1.35f);
        camera.setToOrtho(false, width, height);
        shapes.setProjectionMatrix(camera.combined);
        batch.setProjectionMatrix(camera.combined);
        float pad = 18f * scale;
        topActionButton.set(width - pad - 74f * scale, height - pad - 48f * scale, 74f * scale, 48f * scale);
    }

    @Override
    public void render() {
        float rawDelta = Math.max(0.0001f, Gdx.graphics.getDeltaTime());
        float delta = Math.min(rawDelta, 1f / 30f);
        updateFps(rawDelta);
        handleInput();
        update(delta);

        Gdx.gl.glClearColor(0.008f, 0.016f, 0.038f, 1f);
        Gdx.gl.glClear(GL20.GL_COLOR_BUFFER_BIT);

        batch.begin();
        drawBackgroundTexture();
        batch.end();

        shapes.begin(ShapeRenderer.ShapeType.Filled);
        drawBackground();
        if (phase == Phase.RUNNING || phase == Phase.PAUSED) {
            drawTargets();
        }
        shapes.end();

        batch.begin();
        if (phase == Phase.RUNNING || phase == Phase.PAUSED) {
            drawTargetSprites();
        }
        batch.end();

        shapes.begin(ShapeRenderer.ShapeType.Filled);
        if (phase == Phase.RUNNING || phase == Phase.PAUSED) {
            drawTrail();
            drawBursts();
        }
        shapes.end();

        batch.begin();
        if (phase == Phase.READY) drawReady();
        if (phase == Phase.RUNNING) drawHud(true);
        if (phase == Phase.PAUSED) drawPause();
        if (phase == Phase.RESULT) drawResult();
        if (fpsOverlayEnabled) drawFpsOverlay();
        batch.end();

        shapes.begin(ShapeRenderer.ShapeType.Line);
        if (phase == Phase.RUNNING) drawHudLines();
        shapes.end();
    }

    private void handleInput() {
        if (Gdx.input.isKeyJustPressed(Input.Keys.BACK)) {
            if (phase == Phase.RUNNING) {
                pauseRound();
            } else {
                host.exitGame();
            }
            return;
        }

        boolean justTouched = Gdx.input.justTouched();
        boolean touched = Gdx.input.isTouched();
        float x = Gdx.input.getX();
        float y = height - Gdx.input.getY();

        if (justTouched) {
            if (phase == Phase.READY) {
                if (topActionButton.contains(x, y)) {
                    host.exitGame();
                    return;
                }
                layoutReadyButtons();
                if (startButton.contains(x, y)) {
                    startRound();
                    return;
                }
            } else if (phase == Phase.RUNNING) {
                if (topActionButton.contains(x, y)) {
                    pauseRound();
                    return;
                }
                slicing = true;
                lastX = x;
                lastY = y;
                addTrail(x, y);
            } else if (phase == Phase.PAUSED) {
                layoutPauseButtons();
                if (continueButton.contains(x, y)) {
                    phase = Phase.RUNNING;
                    host.setNativeState("gameplay");
                    return;
                }
                if (pauseExitButton.contains(x, y)) {
                    host.exitGame();
                    return;
                }
            } else if (phase == Phase.RESULT) {
                layoutResultButtons();
                if (replayButton.contains(x, y)) {
                    phase = Phase.READY;
                    host.setNativeState("miniGame");
                    return;
                }
                if (exitButton.contains(x, y)) {
                    host.exitGame();
                    return;
                }
            }
        }

        if (phase == Phase.RUNNING && touched && slicing) {
            if (Math.abs(x - lastX) > 2f || Math.abs(y - lastY) > 2f) {
                checkSlice(lastX, lastY, x, y);
                addTrail(x, y);
                lastX = x;
                lastY = y;
            }
        } else if (!touched) {
            slicing = false;
        }
    }

    private void update(float delta) {
        elapsed += delta;
        updateTrail(delta);
        updateBursts(delta);

        if (phase != Phase.RUNNING) {
            if (phase == Phase.RESULT) resultTimer += delta;
            return;
        }

        roundTime -= delta;
        spawnTimer -= delta;
        if (spawnTimer <= 0f) {
            spawnTarget();
            spawnTimer = MathUtils.clamp(1.0f - gameLevelBefore * 0.018f, 0.32f, 0.95f);
        }

        for (Target target : targets) {
            if (!target.alive) continue;
            target.age += delta;
            target.x += target.vx * delta;
            target.y += target.vy * delta;
            target.vy -= 52f * delta * scale;
            if (target.age > target.life || target.x < -80f || target.x > width + 80f || target.y < -80f) {
                if (target.type == TargetType.SHADOW) {
                    missed += 1;
                    combo = 0;
                }
                target.alive = false;
            }
        }
        compactTargets();

        if (roundTime <= 0f) {
            finishRound();
        }
    }

    private void startRound() {
        previousBest = host.getBestScore();
        gameLevelBefore = Math.max(1, host.getGameLevel());
        gameLevelAfter = gameLevelBefore;
        playerLevelBefore = host.getPlayerLevel();
        playerLevelAfter = playerLevelBefore;
        playerXpBefore = host.getPlayerXp();
        playerXpAfter = playerXpBefore;
        goldBefore = host.getGold();
        goldAfter = goldBefore;
        hpBefore = host.getHp();
        hpAfter = hpBefore;
        hpDelta = 0;
        xpReward = 0;
        goldReward = 0;
        score = 0;
        combo = 0;
        missed = 0;
        won = false;
        newBest = false;
        lootName = "";
        resultNote = "";
        targets.clear();
        bursts.clear();
        trail.clear();
        resultTimer = 0f;
        roundDuration = MathUtils.clamp(31f + gameLevelBefore * 0.25f, 32f, 46f);
        roundTime = roundDuration;
        spawnTimer = 0.15f;
        phase = Phase.RUNNING;
        host.setNativeState("gameplay");
    }

    private void pauseRound() {
        phase = Phase.PAUSED;
        host.setNativeState("paused");
        tip = pickTip();
    }

    private void finishRound() {
        int minScore = 680 + gameLevelBefore * 110;
        won = score >= minScore;
        newBest = score > previousBest;
        gameLevelAfter = won ? gameLevelBefore + 1 : gameLevelBefore;

        int survived = Math.round(roundDuration);
        int collectedGoldBonus = goldReward;
        float multiplier = won ? (1f + (gameLevelAfter - 1) * 0.12f) : 0.34f;
        xpReward = Math.max(8, Math.round((90 + score / 12f + survived * 1.5f) * multiplier));
        goldReward = (won ? Math.max(1, Math.round((15 + gameLevelAfter * 2.1f) * multiplier)) : Math.max(1, gameLevelBefore / 2)) + collectedGoldBonus;

        playerXpAfter = playerXpBefore + xpReward;
        playerLevelAfter = playerLevelBefore;
        int xpLimit = xpToNext(playerLevelAfter);
        while (playerXpAfter >= xpLimit) {
            playerXpAfter -= xpLimit;
            playerLevelAfter += 1;
            xpLimit = xpToNext(playerLevelAfter);
        }

        goldAfter = goldBefore + goldReward;
        hpAfter = Math.max(0, Math.min(host.getBaseHp(), host.getHp()));
        hpDelta = hpAfter - hpBefore;
        if (!won && score < minScore) {
            int loss = Math.max(10, Math.round(host.getBaseHp() * 0.04f));
            hpAfter = Math.max(0, hpAfter - loss);
            hpDelta = hpAfter - hpBefore;
            resultNote = "Za niski wynik. System zabral HP.";
        } else {
            resultNote = won ? "Proba zaliczona. Poziom symulacji wzrosl." : "Proba zakonczona bez awansu.";
        }

        if (won && MathUtils.random() < Math.min(0.18f, 0.04f + gameLevelAfter * 0.003f)) {
            lootName = createLootName(gameLevelAfter);
        }

        host.setBestScore(score);
        host.setGameLevel(gameLevelAfter);
        host.setGold(goldAfter);
        host.setHp(hpAfter);
        host.setPlayerLevel(playerLevelAfter);
        host.setPlayerXp(playerXpAfter);
        host.saveRoundResult(buildResultJson());
        phase = Phase.RESULT;
        resultTimer = 0f;
        host.setNativeState("miniGame");
    }

    private String buildResultJson() {
        try {
            JSONObject result = new JSONObject();
            result.put("id", "native_shadow_" + System.currentTimeMillis());
            result.put("gameId", "shadow-extraction");
            result.put("score", score);
            result.put("won", won);
            result.put("previousBest", previousBest);
            result.put("newBest", newBest);
            result.put("previousGameLevel", gameLevelBefore);
            result.put("nextGameLevel", gameLevelAfter);
            result.put("xpReward", xpReward);
            result.put("goldReward", goldReward);
            result.put("lootName", lootName);
            result.put("hpBefore", hpBefore);
            result.put("hpAfter", hpAfter);
            result.put("hpLoss", Math.max(0, hpBefore - hpAfter));
            result.put("hpRestored", Math.max(0, hpAfter - hpBefore));
            result.put("playerLevelBefore", playerLevelBefore);
            result.put("playerLevelAfter", playerLevelAfter);
            result.put("playerXpBefore", playerXpBefore);
            result.put("playerXpAfter", playerXpAfter);
            result.put("goldBefore", goldBefore);
            result.put("goldAfter", goldAfter);
            result.put("difficultyLevel", gameLevelBefore);
            result.put("rewardMultiplier", won ? (1f + (gameLevelAfter - 1) * 0.12f) : 0.34f);
            result.put("penaltyApplied", hpAfter < hpBefore);
            return result.toString();
        } catch (Exception exception) {
            return "";
        }
    }

    private int xpToNext(int level) {
        return 900 + Math.max(1, level) * 70;
    }

    private String createLootName(int level) {
        String rank = level >= 50 ? "S" : level >= 35 ? "A" : level >= 20 ? "B" : level >= 10 ? "C" : "D";
        String[] names = { "Ostrze Cienia ", "Helm Cienia ", "Rekawice Cienia ", "Rdzen Cienia " };
        return names[level % names.length] + rank;
    }

    private void spawnTarget() {
        int targetLimit = "performance".equals(graphicsQuality) ? 9 : "cinematic".equals(graphicsQuality) ? 15 : 12;
        if (targets.size() > targetLimit) return;

        TargetType type = TargetType.SHADOW;
        float roll = MathUtils.random();
        if (roll > 0.93f) type = TargetType.BOMB;
        else if (roll > 0.86f) type = TargetType.GOLD;
        else if (roll > 0.835f) type = TargetType.DECOY;
        else if (roll > 0.825f) type = TargetType.HEART;
        else if (roll > 0.815f) type = TargetType.TIME;

        float radius = (type == TargetType.TIME ? 25f : type == TargetType.HEART ? 24f : 30f) * scale;
        float side = MathUtils.randomBoolean() ? -1f : 1f;
        float x = side < 0 ? radius + 8f : width - radius - 8f;
        float minY = height * 0.24f;
        float maxY = height * 0.72f;
        if (MathUtils.random() < 0.35f) {
            minY = height * 0.45f;
            maxY = height * 0.84f;
        }
        float y = MathUtils.random(minY, maxY);
        float vx = -side * MathUtils.random(65f, 180f) * scale;
        float vy = MathUtils.random(-16f, 72f) * scale;
        float life = MathUtils.clamp(2.4f - gameLevelBefore * 0.012f, 1.45f, 2.35f);
        if (type == TargetType.TIME || type == TargetType.HEART) life += 0.4f;

        Target target = obtainTarget();
        target.reset(type, x, y, vx, vy, radius, life);
    }

    private Target obtainTarget() {
        for (Target target : targets) {
            if (!target.alive) return target;
        }
        Target target = new Target();
        targets.add(target);
        return target;
    }

    private void compactTargets() {
        Iterator<Target> iterator = targets.iterator();
        while (iterator.hasNext()) {
            if (!iterator.next().alive) iterator.remove();
        }
    }

    private void checkSlice(float ax, float ay, float bx, float by) {
        for (Target target : targets) {
            if (!target.alive) continue;
            float distance = distanceToSegment(target.x, target.y, ax, ay, bx, by);
            if (distance <= target.radius * 0.95f) {
                hitTarget(target);
            }
        }
    }

    private void hitTarget(Target target) {
        target.alive = false;
        if (target.type == TargetType.SHADOW) {
            combo += 1;
            score += 110 + gameLevelBefore * 7 + combo * 18;
            addBurst(target.x, target.y, cyan(), false);
        } else if (target.type == TargetType.GOLD) {
            score += 70 + combo * 5;
            goldReward += 2;
            addBurst(target.x, target.y, gold(), false);
        } else if (target.type == TargetType.BOMB) {
            combo = 0;
            score = Math.max(0, score - 170);
            roundTime = Math.max(0f, roundTime - 1.25f);
            addBurst(target.x, target.y, danger(), true);
        } else if (target.type == TargetType.HEART) {
            int restore = Math.max(1, Math.round(host.getBaseHp() * 0.05f));
            hpAfter = Math.min(host.getBaseHp(), Math.max(0, host.getHp()) + restore);
            host.setHp(hpAfter);
            addBurst(target.x, target.y, success(), false);
        } else if (target.type == TargetType.TIME) {
            roundTime = Math.min(roundDuration + 8f, roundTime + 4f);
            addBurst(target.x, target.y, violet(), false);
        } else {
            combo = 0;
            score = Math.max(0, score - 80);
            addBurst(target.x, target.y, danger(), false);
        }
    }

    private float distanceToSegment(float px, float py, float ax, float ay, float bx, float by) {
        float dx = bx - ax;
        float dy = by - ay;
        if (dx == 0f && dy == 0f) return (float) Math.sqrt((px - ax) * (px - ax) + (py - ay) * (py - ay));
        float t = ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy);
        t = MathUtils.clamp(t, 0f, 1f);
        float cx = ax + t * dx;
        float cy = ay + t * dy;
        float sx = px - cx;
        float sy = py - cy;
        return (float) Math.sqrt(sx * sx + sy * sy);
    }

    private void addTrail(float x, float y) {
        trail.add(new TrailPoint(x, y));
        int trailLimit = "performance".equals(graphicsQuality) ? 12 : "cinematic".equals(graphicsQuality) ? 24 : 18;
        while (trail.size() > trailLimit) trail.remove(0);
    }

    private void updateTrail(float delta) {
        Iterator<TrailPoint> iterator = trail.iterator();
        while (iterator.hasNext()) {
            TrailPoint point = iterator.next();
            point.age += delta;
            if (point.age > 0.28f) iterator.remove();
        }
    }

    private void addBurst(float x, float y, Color color, boolean bomb) {
        bursts.add(new Burst(x, y, color, bomb));
        int burstLimit = "performance".equals(graphicsQuality) ? 7 : "cinematic".equals(graphicsQuality) ? 14 : 10;
        while (bursts.size() > burstLimit) bursts.remove(0);
    }

    private void updateBursts(float delta) {
        Iterator<Burst> iterator = bursts.iterator();
        while (iterator.hasNext()) {
            Burst burst = iterator.next();
            burst.age += delta;
            if (burst.age > burst.life) iterator.remove();
        }
    }

    private void drawBackground() {
        if (backgroundTexture == null) {
            shapes.setColor(bgDark());
            shapes.rect(0, 0, width, height);
        }
        shapes.setColor(0.01f, 0.03f, 0.08f, backgroundTexture == null ? 0.68f : 0.58f);
        shapes.rect(0, 0, width, height);
        shapes.setColor(0.18f, 0.06f, 0.38f, 0.18f);
        for (int i = 0; i < 7; i++) {
            float cx = width * (0.12f + i * 0.14f) + MathUtils.sin(elapsed * 0.18f + i) * 14f;
            shapes.circle(cx, height * 0.48f + MathUtils.cos(elapsed * 0.12f + i) * 28f, 80f * scale + i * 9f);
        }
    }

    private void drawBackgroundTexture() {
        if (backgroundTexture == null) return;
        float textureW = backgroundTexture.getWidth();
        float textureH = backgroundTexture.getHeight();
        float cover = Math.max(width / textureW, height / textureH);
        float drawW = textureW * cover;
        float drawH = textureH * cover;
        batch.setColor(1f, 1f, 1f, 1f);
        batch.draw(backgroundTexture, (width - drawW) / 2f, (height - drawH) / 2f, drawW, drawH);
    }

    private void drawTargets() {
        for (Target target : targets) {
            if (!target.alive) continue;
            Color color = colorFor(target.type);
            float pulse = 1f + MathUtils.sin((elapsed + target.age) * 8f) * 0.04f;
            shapes.setColor(color.r, color.g, color.b, 0.18f);
            shapes.circle(target.x, target.y, target.radius * 1.55f * pulse);
            shapes.setColor(color.r, color.g, color.b, 0.36f);
            shapes.circle(target.x, target.y, target.radius * 1.08f);
            shapes.setColor(color);
            shapes.circle(target.x, target.y, target.radius * 0.64f);

            if (target.type == TargetType.BOMB) {
                shapes.setColor(1f, 0.12f, 0.12f, 0.9f);
                shapes.circle(target.x, target.y, target.radius * 0.3f);
                shapes.rect(target.x - target.radius * 0.12f, target.y + target.radius * 0.36f, target.radius * 0.24f, target.radius * 0.22f);
            } else if (target.type == TargetType.GOLD) {
                shapes.setColor(1f, 0.82f, 0.22f, 1f);
                shapes.rect(target.x - target.radius * 0.48f, target.y - target.radius * 0.18f, target.radius * 0.96f, target.radius * 0.36f);
                shapes.setColor(1f, 0.96f, 0.55f, 1f);
                shapes.rect(target.x - target.radius * 0.28f, target.y - target.radius * 0.07f, target.radius * 0.56f, target.radius * 0.14f);
            } else if (target.type == TargetType.HEART) {
                shapes.setColor(1f, 0.25f, 0.45f, 1f);
                shapes.circle(target.x - target.radius * 0.18f, target.y + target.radius * 0.08f, target.radius * 0.26f);
                shapes.circle(target.x + target.radius * 0.18f, target.y + target.radius * 0.08f, target.radius * 0.26f);
                shapes.triangle(target.x - target.radius * 0.42f, target.y, target.x + target.radius * 0.42f, target.y, target.x, target.y - target.radius * 0.48f);
            } else if (target.type == TargetType.TIME) {
                shapes.setColor(0.75f, 0.45f, 1f, 1f);
                shapes.circle(target.x, target.y, target.radius * 0.42f);
                shapes.setColor(1f, 1f, 1f, 0.95f);
                shapes.rect(target.x - target.radius * 0.04f, target.y, target.radius * 0.08f, target.radius * 0.34f);
                shapes.rect(target.x, target.y - target.radius * 0.04f, target.radius * 0.26f, target.radius * 0.08f);
            }
        }
    }

    private void drawTargetSprites() {
        for (Target target : targets) {
            if (!target.alive) continue;
            Texture texture = textureForTarget(target.type);
            if (texture == null) continue;
            float size = target.radius * (target.type == TargetType.HEART ? 1.62f : 1.86f);
            float alpha = target.type == TargetType.DECOY ? 0.62f : 0.92f;
            batch.setColor(1f, 1f, 1f, alpha);
            batch.draw(texture, target.x - size / 2f, target.y - size / 2f, size, size);
        }
        batch.setColor(Color.WHITE);
    }

    private Texture textureForTarget(TargetType type) {
        if (type == TargetType.SHADOW) return shadowTexture;
        if (type == TargetType.DECOY) return decoyTexture;
        if (type == TargetType.HEART) return heartTexture;
        return null;
    }

    private void drawTrail() {
        for (int i = 1; i < trail.size(); i++) {
            TrailPoint a = trail.get(i - 1);
            TrailPoint b = trail.get(i);
            float alpha = MathUtils.clamp(1f - b.age / 0.28f, 0f, 1f);
            shapes.setColor(0.32f, 0.95f, 1f, alpha * 0.92f);
            shapes.rectLine(a.x, a.y, b.x, b.y, (8f + i * 0.4f) * scale);
            shapes.setColor(1f, 1f, 1f, alpha * 0.82f);
            shapes.rectLine(a.x, a.y, b.x, b.y, (2.3f + i * 0.12f) * scale);
        }
    }

    private void drawBursts() {
        for (Burst burst : bursts) {
            float t = MathUtils.clamp(burst.age / burst.life, 0f, 1f);
            float alpha = 1f - t;
            shapes.setColor(burst.color.r, burst.color.g, burst.color.b, alpha * 0.64f);
            float radius = (burst.bomb ? 92f : 50f) * scale * (0.25f + t);
            shapes.circle(burst.x, burst.y, radius);
            int rays = "performance".equals(graphicsQuality) ? (burst.bomb ? 8 : 5) : "cinematic".equals(graphicsQuality) ? (burst.bomb ? 16 : 10) : (burst.bomb ? 12 : 7);
            shapes.setColor(burst.color.r, burst.color.g, burst.color.b, alpha);
            for (int i = 0; i < rays; i++) {
                float angle = i * 360f / rays + t * 80f;
                float dx = MathUtils.cosDeg(angle) * radius;
                float dy = MathUtils.sinDeg(angle) * radius;
                shapes.rectLine(burst.x, burst.y, burst.x + dx, burst.y + dy, (burst.bomb ? 5f : 3f) * scale);
            }
        }
    }

    private void drawReady() {
        drawTopButton("X");
        drawCenteredTitle("EKSTRAKCJA CIENIA", "Tnij cienie gestem. Bomby resetuja combo, zloto daje bonus.", height * 0.58f);
        drawTextCentered("PROTIP: " + pickTip(), width / 2f, height * 0.38f, 0.72f * scale, muted(), true);
        layoutReadyButtons();
        drawFilledButton(startButton, "START", accent(), textStrong());
    }

    private void drawHud(boolean includeStop) {
        if (includeStop) drawTopButton("STOP");
        drawPill(18f * scale, height - 58f * scale, 118f * scale, 38f * scale, "TIME " + Math.max(0, Math.round(roundTime)) + "S");
        drawPill(width / 2f - 75f * scale, height - 58f * scale, 150f * scale, 38f * scale, "SCORE " + score);
        drawPill(width - 250f * scale, height - 58f * scale, 130f * scale, 38f * scale, "COMBO " + combo);

        float barW = Math.min(width * 0.58f, 520f * scale);
        float barX = width / 2f - barW / 2f;
        float barY = height - 84f * scale;
        float progress = MathUtils.clamp(roundTime / roundDuration, 0f, 1f);
        batch.end();
        shapes.begin(ShapeRenderer.ShapeType.Filled);
        shapes.setColor(0f, 0f, 0f, 0.45f);
        fillRoundRect(barX, barY, barW, 5f * scale, 2.5f * scale);
        shapes.setColor(accent());
        fillRoundRect(barX, barY, barW * progress, 5f * scale, 2.5f * scale);
        shapes.end();
        batch.begin();
    }

    private void drawHudLines() {
        shapes.setColor(0.0f, 0.85f, 1f, 0.18f);
        shapes.rect(14f * scale, height - 66f * scale, 122f * scale, 44f * scale);
        shapes.rect(width / 2f - 77f * scale, height - 66f * scale, 154f * scale, 44f * scale);
        shapes.rect(width - 252f * scale, height - 66f * scale, 132f * scale, 44f * scale);
    }

    private void drawPause() {
        drawHud(false);
        float modalW = Math.min(width * 0.72f, 560f * scale);
        float modalH = Math.min(height * 0.58f, 250f * scale);
        float x = width / 2f - modalW / 2f;
        float y = height / 2f - modalH / 2f;
        batch.end();
        shapes.begin(ShapeRenderer.ShapeType.Filled);
        shapes.setColor(0.0f, 0.01f, 0.04f, 0.72f);
        shapes.rect(0, 0, width, height);
        shapes.setColor(panel());
        fillRoundRect(x, y, modalW, modalH, 26f * scale);
        shapes.end();
        batch.begin();

        drawTextCentered("PAUZA", width / 2f, y + modalH - 42f * scale, 1.15f * scale, textStrong(), true);
        drawTextCentered(pickTip(), width / 2f, y + modalH - 86f * scale, 0.74f * scale, muted(), true);
        layoutPauseButtons();
        drawFilledButton(continueButton, "KONTYNUUJ", accent(), textStrong());
        drawFilledButton(pauseExitButton, "WYJDZ", danger(), Color.WHITE);
    }

    private void drawResult() {
        float progress = MathUtils.clamp(resultTimer / 4.4f, 0f, 1f);
        int shownGold = goldBefore + Math.round((goldAfter - goldBefore) * smooth(progress));
        boolean levelUp = playerLevelAfter > playerLevelBefore;
        int shownLevel = playerLevelBefore;
        int shownXp;
        int xpLimit;
        if (levelUp) {
            float fillPhase = MathUtils.clamp(progress / 0.62f, 0f, 1f);
            float resetPhase = MathUtils.clamp((progress - 0.62f) / 0.38f, 0f, 1f);
            int beforeLimit = xpToNext(playerLevelBefore);
            if (progress < 0.62f) {
                xpLimit = beforeLimit;
                shownXp = playerXpBefore + Math.round((beforeLimit - playerXpBefore) * smooth(fillPhase));
            } else {
                shownLevel = playerLevelAfter;
                xpLimit = xpToNext(playerLevelAfter);
                shownXp = Math.round(playerXpAfter * smooth(resetPhase));
            }
        } else {
            shownXp = playerXpBefore + Math.round((playerXpAfter - playerXpBefore) * smooth(progress));
            xpLimit = xpToNext(playerLevelAfter);
        }

        drawCenteredTitle("RAPORT RUNDY", "Ekstrakcja Cienia", height * 0.78f);
        float cardW = Math.min(width * 0.78f, 700f * scale);
        float cardX = width / 2f - cardW / 2f;
        float cardY = height * 0.23f;
        float cardH = height * 0.46f;

        batch.end();
        shapes.begin(ShapeRenderer.ShapeType.Filled);
        shapes.setColor(panel());
        fillRoundRect(cardX, cardY, cardW, cardH, 24f * scale);
        shapes.setColor(0f, 0.85f, 1f, 0.12f);
        fillRoundRect(cardX + 18f * scale, cardY + cardH - 7f * scale, cardW - 36f * scale, 4f * scale, 3f * scale);
        shapes.end();
        batch.begin();

        float left = cardX + 28f * scale;
        float top = cardY + cardH - 36f * scale;
        drawText("WYNIK " + score, left, top, 1.05f * scale, textStrong(), true);
        drawText((newBest ? "NOWY REKORD" : "REKORD " + previousBest), left, top - 32f * scale, 0.68f * scale, newBest ? accent() : muted(), true);
        drawText("GRA LV. " + gameLevelBefore + " -> " + gameLevelAfter, left, top - 62f * scale, 0.72f * scale, muted(), true);
        drawText("LOWCA LV. " + shownLevel + (playerLevelAfter > playerLevelBefore ? "  AWANS" : ""), left, top - 98f * scale, 0.8f * scale, textStrong(), true);

        float barW = cardW - 56f * scale;
        float barY = top - 126f * scale;
        batch.end();
        shapes.begin(ShapeRenderer.ShapeType.Filled);
        shapes.setColor(progressTrack());
        fillRoundRect(left, barY, barW, 8f * scale, 4f * scale);
        shapes.setColor(accent());
        fillRoundRect(left, barY, barW * MathUtils.clamp((float) shownXp / xpLimit, 0f, 1f), 8f * scale, 4f * scale);
        shapes.end();
        batch.begin();
        drawText("+" + xpReward + " XP   " + shownXp + " / " + xpLimit, left, barY - 14f * scale, 0.58f * scale, muted(), true);
        drawText("GOLD " + shownGold + "  (+" + goldReward + ")", left, barY - 42f * scale, 0.7f * scale, gold(), true);
        drawText("HP " + hpBefore + " -> " + hpAfter + (hpDelta < 0 ? "  " + hpDelta : ""), left, barY - 68f * scale, 0.68f * scale, hpDelta < 0 ? danger() : success(), true);
        if (!lootName.isEmpty()) {
            drawText("LOOT: " + lootName, left, barY - 96f * scale, 0.68f * scale, violet(), true);
        }
        drawText(resultNote, left, cardY + 30f * scale, 0.62f * scale, muted(), true);

        layoutResultButtons();
        drawFilledButton(replayButton, "ZAGRAJ PONOWNIE", accent(), textStrong());
        drawFilledButton(exitButton, "WYJDZ", danger(), Color.WHITE);
    }

    private void updateFps(float rawDelta) {
        fpsFrameMs = rawDelta * 1000f;
        fpsSampleTimer += rawDelta;
        fpsSampleFrames += 1;
        if (fpsSampleTimer < 0.25f) return;

        fpsCurrent = fpsSampleFrames / fpsSampleTimer;
        fpsMin = Math.min(fpsMin, fpsCurrent);
        fpsSampleCount += 1;
        fpsAverage += (fpsCurrent - fpsAverage) / Math.max(1, fpsSampleCount);
        fpsSampleTimer = 0f;
        fpsSampleFrames = 0;
    }

    private void drawFpsOverlay() {
        float boxW = 156f * scale;
        float boxH = 68f * scale;
        float x = 16f * scale;
        float y = 16f * scale;

        batch.end();
        shapes.begin(ShapeRenderer.ShapeType.Filled);
        shapes.setColor(0f, 0.018f, 0.045f, 0.72f);
        fillRoundRect(x, y, boxW, boxH, 14f * scale);
        shapes.setColor(0f, 0.85f, 1f, 0.24f);
        fillRoundRect(x, y + boxH - 3f * scale, boxW, 3f * scale, 2f * scale);
        shapes.end();
        batch.begin();

        drawText("FPS " + Math.round(fpsCurrent), x + 10f * scale, y + boxH - 18f * scale, 0.48f * scale, accent(), true);
        drawText("AVG " + Math.round(fpsAverage) + "  LOW " + Math.round(fpsMin == 999f ? fpsCurrent : fpsMin), x + 10f * scale, y + boxH - 38f * scale, 0.43f * scale, textStrong(), true);
        drawText(Math.round(fpsFrameMs * 10f) / 10f + "MS  " + graphicsQuality.toUpperCase(), x + 10f * scale, y + boxH - 56f * scale, 0.38f * scale, muted(), true);
    }

    private void layoutReadyButtons() {
        float w = Math.min(240f * scale, width * 0.36f);
        startButton.set(width / 2f - w / 2f, height * 0.19f, w, 52f * scale);
    }

    private void layoutPauseButtons() {
        float w = Math.min(250f * scale, width * 0.34f);
        float gap = 14f * scale;
        float y = height / 2f - 82f * scale;
        continueButton.set(width / 2f - w - gap / 2f, y, w, 50f * scale);
        pauseExitButton.set(width / 2f + gap / 2f, y, w, 50f * scale);
    }

    private void layoutResultButtons() {
        float w = Math.min(260f * scale, width * 0.34f);
        float gap = 14f * scale;
        float y = height * 0.08f;
        replayButton.set(width / 2f - w - gap / 2f, y, w, 50f * scale);
        exitButton.set(width / 2f + gap / 2f, y, w, 50f * scale);
    }

    private void drawTopButton(String label) {
        drawFilledButton(topActionButton, label, label.equals("STOP") ? danger() : panel(), Color.WHITE);
    }

    private void drawFilledButton(Button button, String label, Color fill, Color text) {
        batch.end();
        shapes.begin(ShapeRenderer.ShapeType.Filled);
        shapes.setColor(fill);
        fillRoundRect(button.x, button.y, button.w, button.h, 16f * scale);
        shapes.end();
        batch.begin();
        drawTextCentered(label, button.x + button.w / 2f, button.y + button.h / 2f - 7f * scale, 0.82f * scale, text, true);
    }

    private void drawPill(float x, float y, float w, float h, String text) {
        batch.end();
        shapes.begin(ShapeRenderer.ShapeType.Filled);
        shapes.setColor(0f, 0.02f, 0.06f, 0.74f);
        fillRoundRect(x, y, w, h, 18f * scale);
        shapes.end();
        batch.begin();
        drawTextCentered(text, x + w / 2f, y + h / 2f - 6f * scale, 0.62f * scale, textStrong(), true);
    }

    private void fillRoundRect(float x, float y, float w, float h, float radius) {
        if (w <= 0f || h <= 0f) return;
        float r = MathUtils.clamp(radius, 0f, Math.min(w, h) / 2f);
        shapes.rect(x + r, y, w - 2f * r, h);
        shapes.rect(x, y + r, r, h - 2f * r);
        shapes.rect(x + w - r, y + r, r, h - 2f * r);
        shapes.circle(x + r, y + r, r);
        shapes.circle(x + w - r, y + r, r);
        shapes.circle(x + r, y + h - r, r);
        shapes.circle(x + w - r, y + h - r, r);
    }

    private void drawCenteredTitle(String title, String subtitle, float y) {
        drawTextCentered(title, width / 2f, y, 1.42f * scale, textStrong(), true);
        drawTextCentered(subtitle, width / 2f, y - 44f * scale, 0.76f * scale, muted(), true);
    }

    private void drawText(String text, float x, float y, float fontScale, Color color, boolean bold) {
        font.getData().setScale(fontScale);
        font.setColor(color);
        font.draw(batch, text, x, y);
    }

    private void drawTextCentered(String text, float x, float y, float fontScale, Color color, boolean bold) {
        font.getData().setScale(fontScale);
        layout.setText(font, text);
        drawText(text, x - layout.width / 2f, y + layout.height / 2f, fontScale, color, bold);
    }

    private String pickTip() {
        int index = Math.abs(Math.round(elapsed / 3f)) % 4;
        if (index == 0) return "Jedno dlugie ciecie moze zlapac kilka cieni.";
        if (index == 1) return "Bomby wygladaja kuszaco, ale resetuja tempo.";
        if (index == 2) return "Zloto tnij po drodze, nie gon za nim na sile.";
        return "Rzadki fioletowy zegar dodaje czas do rundy.";
    }

    private String normalizeGraphicsQuality(String value) {
        if ("performance".equals(value) || "cinematic".equals(value)) return value;
        return "balanced";
    }

    private float smooth(float t) {
        return t * t * (3f - 2f * t);
    }

    private Color colorFor(TargetType type) {
        if (type == TargetType.GOLD) return gold();
        if (type == TargetType.BOMB) return danger();
        if (type == TargetType.HEART) return success();
        if (type == TargetType.TIME) return violet();
        if (type == TargetType.DECOY) return colorDecoy;
        return cyan();
    }

    private Color bgDark() {
        return colorBgDark;
    }

    private Color panel() {
        return colorPanel;
    }

    private Color textStrong() {
        return colorTextStrong;
    }

    private Color muted() {
        return colorMuted;
    }

    private Color accent() {
        return colorAccent;
    }

    private Color cyan() {
        return colorCyan;
    }

    private Color gold() {
        return colorGold;
    }

    private Color danger() {
        return colorDanger;
    }

    private Color success() {
        return colorSuccess;
    }

    private Color violet() {
        return colorViolet;
    }

    private Color progressTrack() {
        return colorProgressTrack;
    }

    @Override
    public void dispose() {
        if (shapes != null) shapes.dispose();
        if (batch != null) batch.dispose();
        if (font != null) font.dispose();
        if (backgroundTexture != null) backgroundTexture.dispose();
        if (shadowTexture != null) shadowTexture.dispose();
        if (decoyTexture != null) decoyTexture.dispose();
        if (heartTexture != null) heartTexture.dispose();
    }
}
