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
        float getXpMultiplier();
        float getScoreBonus();
        float getTargetLifetimeBonusMs();
        float getHitWindowBonus();
        float getTimePenaltyResist();
        String getSelectedEffectId();
        String getSelectedEffectName();
        boolean shouldShowGrid();
        boolean shouldAutoStart();
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
        final Color color = new Color();
        boolean bomb;

        void reset(float x, float y, Color color, boolean bomb) {
            this.x = x;
            this.y = y;
            this.age = 0f;
            this.color.set(color);
            this.bomb = bomb;
            this.life = bomb ? 0.52f : 0.34f;
        }
    }

    private static class TrailPoint {
        float x;
        float y;
        float age;

        void reset(float x, float y) {
            this.x = x;
            this.y = y;
            this.age = 0f;
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
    private final List<Target> targetPool = new ArrayList<>();
    private final List<Burst> bursts = new ArrayList<>();
    private final List<Burst> burstPool = new ArrayList<>();
    private final List<TrailPoint> trail = new ArrayList<>();
    private final List<TrailPoint> trailPool = new ArrayList<>();
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
    private String selectedEffectId = "system-aura";
    private String selectedEffectName = "Aura Systemu";
    private float xpMultiplier = 1f;
    private float scoreBonus = 0f;
    private float targetLifetimeBonusMs = 0f;
    private float hitWindowBonus = 0f;
    private float timePenaltyResist = 0f;
    private boolean showGrid = false;
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
        xpMultiplier = MathUtils.clamp(host.getXpMultiplier(), 1f, 1.45f);
        scoreBonus = MathUtils.clamp(host.getScoreBonus(), 0f, 0.15f);
        targetLifetimeBonusMs = MathUtils.clamp(host.getTargetLifetimeBonusMs(), 0f, 520f);
        hitWindowBonus = MathUtils.clamp(host.getHitWindowBonus(), 0f, 0.12f);
        timePenaltyResist = MathUtils.clamp(host.getTimePenaltyResist(), 0f, 0.18f);
        selectedEffectId = host.getSelectedEffectId();
        if (selectedEffectId == null || selectedEffectId.isEmpty()) selectedEffectId = "system-aura";
        selectedEffectName = host.getSelectedEffectName();
        if (selectedEffectName == null || selectedEffectName.isEmpty()) selectedEffectName = "Aura Systemu";
        applySelectedEffectPalette();
        showGrid = host.shouldShowGrid();
        backgroundTexture = loadTexture("native-game/shadow-extraction-bg.jpg");
        shadowTexture = loadTexture("native-game/shadow-wraith.png");
        decoyTexture = loadTexture("native-game/shadow-decoy.png");
        heartTexture = loadTexture("native-game/heart-relic.png");
        prewarmPools();
        Gdx.input.setCatchKey(Input.Keys.BACK, true);
        resize(Gdx.graphics.getWidth(), Gdx.graphics.getHeight());
        host.setNativeState("miniGame");
        if (host.shouldAutoStart()) {
            startRound();
        }
    }

    @Override
    public void resize(int w, int h) {
        width = Math.max(1, w);
        height = Math.max(1, h);
        scale = MathUtils.clamp(Math.min(width / 900f, height / 430f), 0.72f, 1.35f);
        camera.setToOrtho(false, width, height);
        shapes.setProjectionMatrix(camera.combined);
        batch.setProjectionMatrix(camera.combined);
        float hs = hudScale();
        float pad = 16f * hs;
        topActionButton.set(width - pad - 68f * hs, height - pad - 42f * hs, 68f * hs, 42f * hs);
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
                    startRound();
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
            target.vy -= 255f * delta * scale;
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
        recycleActiveTargets();
        recycleActiveBursts();
        recycleActiveTrail();
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
        xpReward = Math.max(8, Math.round((90 + score / 12f + survived * 1.5f) * multiplier * xpMultiplier));
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

        if (newBest) host.setBestScore(score);
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
            result.put("boosterApplied", xpMultiplier > 1.001f);
            result.put("xpMultiplier", Math.round(xpMultiplier * 100f) / 100f);
            result.put("scoreBonus", Math.round(scoreBonus * 1000f) / 1000f);
            result.put("targetLifetimeBonusMs", Math.round(targetLifetimeBonusMs));
            result.put("hitWindowBonus", Math.round(hitWindowBonus * 1000f) / 1000f);
            result.put("timePenaltyResist", Math.round(timePenaltyResist * 1000f) / 1000f);
            result.put("selectedEffectId", selectedEffectId);
            result.put("selectedEffectName", selectedEffectName);
            result.put("fpsLast", Math.round(fpsCurrent * 10f) / 10f);
            result.put("fpsAverage", Math.round(fpsAverage * 10f) / 10f);
            result.put("fpsMin", Math.round((fpsMin == 999f ? fpsCurrent : fpsMin) * 10f) / 10f);
            result.put("frameMs", Math.round(fpsFrameMs * 10f) / 10f);
            result.put("graphicsQuality", graphicsQuality);
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
        if (targets.size() >= targetLimit) return;

        TargetType type = TargetType.SHADOW;
        float roll = MathUtils.random();
        if (roll > 0.935f) type = TargetType.BOMB;
        else if (roll > 0.865f) type = TargetType.GOLD;
        else if (roll > 0.842f) type = TargetType.DECOY;
        else if (roll > 0.8395f) type = TargetType.HEART;
        else if (roll > 0.838f) type = TargetType.TIME;

        float radius = (type == TargetType.TIME ? 25f : type == TargetType.HEART ? 24f : 30f) * scale;
        float x;
        float y;
        float vx;
        float vy;
        boolean bottomLaunch = MathUtils.random() < 0.82f;
        if (bottomLaunch) {
            boolean highArc = MathUtils.random() < 0.54f;
            x = MathUtils.random(width * 0.13f, width * 0.87f);
            y = (highArc ? height * 0.05f : height * 0.12f) - radius;
            vx = MathUtils.random(highArc ? -150f : -112f, highArc ? 150f : 112f) * scale;
            vy = MathUtils.random(highArc ? 385f : 275f, highArc ? 535f : 425f) * scale;
        } else {
            float side = MathUtils.randomBoolean() ? -1f : 1f;
            x = side < 0 ? radius + 8f : width - radius - 8f;
            y = MathUtils.random(height * 0.44f, height * 0.88f);
            vx = -side * MathUtils.random(90f, 220f) * scale;
            vy = MathUtils.random(35f, 155f) * scale;
        }
        float life = bottomLaunch
            ? MathUtils.clamp(3.15f - gameLevelBefore * 0.01f, 2.25f, 3.15f)
            : MathUtils.clamp(2.25f - gameLevelBefore * 0.01f, 1.45f, 2.25f);
        life += targetLifetimeBonusMs / 1000f;
        if (type == TargetType.TIME) life += 0.55f;
        if (type == TargetType.HEART) life += 0.28f;

        Target target = obtainTarget();
        target.reset(type, x, y, vx, vy, radius, life);
    }

    private Target obtainTarget() {
        Target target = targetPool.isEmpty() ? new Target() : targetPool.remove(targetPool.size() - 1);
        targets.add(target);
        return target;
    }

    private void compactTargets() {
        for (int i = targets.size() - 1; i >= 0; i--) {
            Target target = targets.get(i);
            if (!target.alive) {
                targets.remove(i);
                if (targetPool.size() < 36) targetPool.add(target);
            }
        }
    }

    private void checkSlice(float ax, float ay, float bx, float by) {
        for (Target target : targets) {
            if (!target.alive) continue;
            float distance = distanceToSegment(target.x, target.y, ax, ay, bx, by);
            if (distance <= target.radius * (0.95f + hitWindowBonus)) {
                hitTarget(target);
            }
        }
    }

    private void hitTarget(Target target) {
        target.alive = false;
        if (target.type == TargetType.SHADOW) {
            combo += 1;
            score += applyScoreBonus(110 + gameLevelBefore * 7 + combo * 18);
            addBurst(target.x, target.y, cyan(), false);
        } else if (target.type == TargetType.GOLD) {
            score += applyScoreBonus(70 + combo * 5);
            goldReward += 2;
            addBurst(target.x, target.y, gold(), false);
        } else if (target.type == TargetType.BOMB) {
            combo = 0;
            score = Math.max(0, score - 170);
            roundTime = Math.max(0f, roundTime - 1.25f * (1f - timePenaltyResist));
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

    private int applyScoreBonus(int baseScore) {
        return Math.max(1, Math.round(baseScore * (1f + scoreBonus)));
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
        TrailPoint point = trailPool.isEmpty() ? new TrailPoint() : trailPool.remove(trailPool.size() - 1);
        point.reset(x, y);
        trail.add(point);
        int trailLimit = "performance".equals(graphicsQuality) ? 12 : "cinematic".equals(graphicsQuality) ? 24 : 18;
        while (trail.size() > trailLimit) recycleTrailAt(0);
    }

    private void updateTrail(float delta) {
        for (int i = trail.size() - 1; i >= 0; i--) {
            TrailPoint point = trail.get(i);
            point.age += delta;
            if (point.age > 0.28f) recycleTrailAt(i);
        }
    }

    private void addBurst(float x, float y, Color color, boolean bomb) {
        Burst burst = burstPool.isEmpty() ? new Burst() : burstPool.remove(burstPool.size() - 1);
        burst.reset(x, y, color, bomb);
        bursts.add(burst);
        int burstLimit = "performance".equals(graphicsQuality) ? 7 : "cinematic".equals(graphicsQuality) ? 14 : 10;
        while (bursts.size() > burstLimit) recycleBurstAt(0);
    }

    private void updateBursts(float delta) {
        for (int i = bursts.size() - 1; i >= 0; i--) {
            Burst burst = bursts.get(i);
            burst.age += delta;
            if (burst.age > burst.life) recycleBurstAt(i);
        }
    }

    private void recycleActiveTargets() {
        for (int i = targets.size() - 1; i >= 0; i--) {
            Target target = targets.remove(i);
            target.alive = false;
            if (targetPool.size() < 36) targetPool.add(target);
        }
    }

    private void recycleActiveBursts() {
        for (int i = bursts.size() - 1; i >= 0; i--) {
            recycleBurstAt(i);
        }
    }

    private void recycleActiveTrail() {
        for (int i = trail.size() - 1; i >= 0; i--) {
            recycleTrailAt(i);
        }
    }

    private void recycleBurstAt(int index) {
        Burst burst = bursts.remove(index);
        if (burstPool.size() < 28) burstPool.add(burst);
    }

    private void recycleTrailAt(int index) {
        TrailPoint point = trail.remove(index);
        if (trailPool.size() < 48) trailPool.add(point);
    }

    private void prewarmPools() {
        while (targetPool.size() < 24) targetPool.add(new Target());
        while (burstPool.size() < 18) burstPool.add(new Burst());
        while (trailPool.size() < 36) trailPool.add(new TrailPoint());
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
        drawEffectAmbient();
        if (showGrid) drawOptionalGrid();
    }

    private void drawEffectAmbient() {
        if ("monarch-runes".equals(selectedEffectId)) {
            shapes.setColor(accent().r, accent().g, accent().b, 0.12f);
            for (int i = 0; i < 9; i++) {
                float x = width * (0.08f + i * 0.105f);
                float y = (height + (elapsed * 46f + i * 91f) % (height + 160f)) - 150f;
                shapes.rect(x, y, 2f * scale, 70f * scale);
                shapes.rect(x - 9f * scale, y + 16f * scale, 20f * scale, 2f * scale);
                shapes.rect(x - 6f * scale, y + 42f * scale, 14f * scale, 2f * scale);
            }
        } else if ("void-pulse".equals(selectedEffectId)) {
            shapes.setColor(accent().r, accent().g, accent().b, 0.10f + MathUtils.sin(elapsed * 1.4f) * 0.04f);
            shapes.circle(width * 0.5f, height * 0.48f, (210f + MathUtils.sin(elapsed * 1.8f) * 34f) * scale);
        } else if ("gold-trace".equals(selectedEffectId)) {
            shapes.setColor(1f, 0.72f, 0.12f, 0.10f);
            for (int i = 0; i < 6; i++) {
                float y = height * (0.18f + i * 0.12f);
                float x = (elapsed * 76f + i * 145f) % (width + 180f) - 90f;
                shapes.rectLine(x, y, x + 78f * scale, y + 18f * scale, 2.4f * scale);
            }
        } else if ("blood-sparks".equals(selectedEffectId)) {
            shapes.setColor(0.96f, 0.20f, 0.32f, 0.08f);
            for (int i = 0; i < 7; i++) {
                float x = width * (0.12f + i * 0.13f);
                float y = height * (0.22f + 0.58f * MathUtils.sin((elapsed * 0.6f + i) % 1f));
                shapes.circle(x, y, (12f + i * 2f) * scale);
            }
        }
    }

    private void drawOptionalGrid() {
        float step = 76f * scale;
        shapes.setColor(0.1f, 0.78f, 0.9f, 0.06f);
        for (float x = 0; x <= width; x += step) {
            shapes.rect(x, 0, 1f, height);
        }
        for (float y = 0; y <= height; y += step) {
            shapes.rect(0, y, width, 1f);
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
            boolean special = target.type == TargetType.BOMB || target.type == TargetType.GOLD || target.type == TargetType.HEART || target.type == TargetType.TIME;
            float pulse = special ? 1f + MathUtils.sin((elapsed + target.age) * 8f) * 0.03f : 1f;
            shapes.setColor(color.r, color.g, color.b, special ? 0.16f : 0.10f);
            shapes.circle(target.x, target.y, target.radius * (special ? 1.28f : 0.92f) * pulse);
            shapes.setColor(color.r, color.g, color.b, special ? 0.26f : 0.16f);
            shapes.circle(target.x, target.y, target.radius * (special ? 0.92f : 0.54f));

            if (target.type == TargetType.BOMB) {
                shapes.setColor(0.16f, 0.0f, 0.02f, 0.96f);
                shapes.circle(target.x, target.y, target.radius * 0.66f);
                shapes.setColor(1f, 0.12f, 0.12f, 0.9f);
                shapes.circle(target.x, target.y, target.radius * 0.42f);
                shapes.rect(target.x - target.radius * 0.13f, target.y + target.radius * 0.38f, target.radius * 0.26f, target.radius * 0.18f);
                shapes.setColor(1f, 0.74f, 0.24f, 0.95f);
                shapes.rectLine(target.x + target.radius * 0.05f, target.y + target.radius * 0.54f, target.x + target.radius * 0.34f, target.y + target.radius * 0.78f, 2.5f * scale);
            } else if (target.type == TargetType.GOLD) {
                shapes.setColor(0.38f, 0.24f, 0.02f, 0.92f);
                fillRoundRect(target.x - target.radius * 0.58f, target.y - target.radius * 0.26f, target.radius * 1.16f, target.radius * 0.52f, target.radius * 0.12f);
                shapes.setColor(1f, 0.82f, 0.22f, 0.98f);
                fillRoundRect(target.x - target.radius * 0.48f, target.y - target.radius * 0.18f, target.radius * 0.96f, target.radius * 0.36f, target.radius * 0.08f);
                shapes.setColor(1f, 0.96f, 0.55f, 1f);
                fillRoundRect(target.x - target.radius * 0.28f, target.y - target.radius * 0.07f, target.radius * 0.56f, target.radius * 0.14f, target.radius * 0.04f);
            } else if (target.type == TargetType.HEART) {
                shapes.setColor(1f, 0.25f, 0.45f, 1f);
                shapes.circle(target.x - target.radius * 0.18f, target.y + target.radius * 0.08f, target.radius * 0.26f);
                shapes.circle(target.x + target.radius * 0.18f, target.y + target.radius * 0.08f, target.radius * 0.26f);
                shapes.triangle(target.x - target.radius * 0.42f, target.y, target.x + target.radius * 0.42f, target.y, target.x, target.y - target.radius * 0.48f);
            } else if (target.type == TargetType.TIME) {
                shapes.setColor(0.62f, 0.24f, 1f, 0.96f);
                shapes.circle(target.x, target.y, target.radius * 0.50f);
                shapes.setColor(0.20f, 0.96f, 1f, 0.88f);
                shapes.triangle(target.x, target.y + target.radius * 0.68f, target.x - target.radius * 0.58f, target.y, target.x, target.y - target.radius * 0.68f);
                shapes.triangle(target.x, target.y + target.radius * 0.68f, target.x + target.radius * 0.58f, target.y, target.x, target.y - target.radius * 0.68f);
                shapes.setColor(1f, 1f, 1f, 0.98f);
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
        float rs = menuScale();
        float cardW = Math.min(width - 46f * rs, 720f * rs);
        float cardH = Math.min(height - 98f * rs, 332f * rs);
        float cardX = width / 2f - cardW / 2f;
        float cardY = height / 2f - cardH / 2f - 4f * rs;
        float centerX = cardX + cardW / 2f;

        batch.end();
        shapes.begin(ShapeRenderer.ShapeType.Filled);
        shapes.setColor(0f, 0.01f, 0.04f, 0.26f);
        shapes.rect(0f, 0f, width, height);
        shapes.setColor(panel());
        fillRoundRect(cardX, cardY, cardW, cardH, 28f * rs);
        shapes.setColor(0f, 0.85f, 1f, 0.12f);
        fillRoundRect(cardX + 18f * rs, cardY + cardH - 6f * rs, cardW - 36f * rs, 4f * rs, 3f * rs);
        shapes.setColor(0f, 0.85f, 1f, 0.10f);
        shapes.circle(centerX, cardY + cardH - 92f * rs, 48f * rs);
        shapes.setColor(0f, 0.85f, 1f, 0.18f);
        shapes.circle(centerX, cardY + cardH - 92f * rs, 32f * rs);
        shapes.end();
        batch.begin();

        drawTopButton("X");
        drawTextCentered("GATE", centerX, cardY + cardH - 88f * rs, 0.52f * rs, accent(), true);
        drawTextCentered("EKSTRAKCJA CIENIA", centerX, cardY + cardH - 148f * rs, 1.16f * rs, textStrong(), true);
        drawTextCentered("Dlugie ciecie lapie kilka cieni. Bomby resetuja combo.", centerX, cardY + cardH - 184f * rs, 0.62f * rs, muted(), true);
        drawTextCentered("PROTIP: " + pickTip(), centerX, cardY + cardH - 224f * rs, 0.56f * rs, accent(), true);
        drawTextCentered("EFEKT: " + selectedEffectName.toUpperCase() + activeBonusLabel(), centerX, cardY + cardH - 248f * rs, 0.46f * rs, muted(), true);
        drawResultTile(cardX + 20f * rs, cardY + cardH - 70f * rs, 116f * rs, 44f * rs, "BEST", String.valueOf(host.getBestScore()), rs);
        drawResultTile(cardX + cardW - 136f * rs, cardY + cardH - 70f * rs, 116f * rs, 44f * rs, "GRA LV.", String.valueOf(Math.max(1, host.getGameLevel())), rs);
        layoutReadyButtons();
        drawFilledButton(startButton, "START", accent(), textStrong());
    }

    private void drawHud(boolean includeStop) {
        if (includeStop) drawTopButton("STOP");
        float hs = hudScale();
        float pad = 16f * hs;
        float chipH = 34f * hs;
        float chipY = height - pad - chipH - 4f * hs;
        drawPill(18f * hs, chipY, 108f * hs, chipH, "TIME " + Math.max(0, Math.round(roundTime)) + "S", hs);
        drawPill(width / 2f - 66f * hs, chipY, 132f * hs, chipH, "SCORE " + score, hs);
        drawPill(topActionButton.x - 132f * hs - 12f * hs, chipY, 132f * hs, chipH, "COMBO " + combo, hs);

        float barW = Math.min(width * 0.58f, 520f * scale);
        float barX = width / 2f - barW / 2f;
        float barY = chipY - 14f * hs;
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
        float hs = hudScale();
        float pad = 16f * hs;
        float chipH = 34f * hs;
        float chipY = height - pad - chipH - 4f * hs;
        shapes.setColor(0.0f, 0.85f, 1f, 0.18f);
        shapes.rect(18f * hs, chipY, 108f * hs, chipH);
        shapes.rect(width / 2f - 66f * hs, chipY, 132f * hs, chipH);
        shapes.rect(topActionButton.x - 132f * hs - 12f * hs, chipY, 132f * hs, chipH);
    }

    private void drawPause() {
        float ps = pauseScale();
        float modalW = Math.min(width - 64f * ps, 620f * ps);
        float modalH = Math.min(height - 58f * ps, 244f * ps);
        float x = width / 2f - modalW / 2f;
        float y = height / 2f - modalH / 2f;
        batch.end();
        shapes.begin(ShapeRenderer.ShapeType.Filled);
        shapes.setColor(0.0f, 0.01f, 0.04f, 0.60f);
        shapes.rect(0, 0, width, height);
        shapes.setColor(panel());
        fillRoundRect(x, y, modalW, modalH, 24f * ps);
        shapes.setColor(0f, 0.85f, 1f, 0.13f);
        fillRoundRect(x + 18f * ps, y + modalH - 6f * ps, modalW - 36f * ps, 4f * ps, 3f * ps);
        shapes.end();
        batch.begin();

        drawText("PAUZA", x + 22f * ps, y + modalH - 36f * ps, 1.0f * ps, textStrong(), true);
        drawText("RUNDA WSTRZYMANA", x + 22f * ps, y + modalH - 66f * ps, 0.48f * ps, accent(), true);
        drawResultTile(x + modalW - 176f * ps, y + modalH - 70f * ps, 154f * ps, 48f * ps, "SCORE", String.valueOf(score), ps);
        float tipY = y + modalH - 114f * ps;
        drawText("PROTIP", x + 22f * ps, tipY, 0.46f * ps, accent(), true);
        drawText(pickTip(), x + 22f * ps, tipY - 25f * ps, 0.58f * ps, muted(), true);
        drawText("EFEKT: " + selectedEffectName.toUpperCase() + activeBonusLabel(), x + 22f * ps, tipY - 48f * ps, 0.44f * ps, muted(), true);
        float statY = y + 76f * ps;
        float statW = (modalW - 56f * ps) / 3f;
        drawResultTile(x + 22f * ps, statY, statW, 44f * ps, "CZAS", Math.max(0, Math.round(roundTime)) + "S", ps);
        drawResultTile(x + 28f * ps + statW, statY, statW, 44f * ps, "COMBO", String.valueOf(combo), ps);
        drawResultTile(x + 34f * ps + statW * 2f, statY, statW, 44f * ps, "BEST", String.valueOf(previousBest), ps);
        layoutPauseButtons();
        drawFilledButton(continueButton, "KONTYNUUJ", accent(), textStrong());
        drawFilledButton(pauseExitButton, "WYJDZ", danger(), Color.WHITE);
    }

    private void drawResult() {
        float rs = resultScale();
        float rewardProgress = MathUtils.clamp(resultTimer / 3.8f, 0f, 1f);
        float xpProgress = MathUtils.clamp(resultTimer / 8.8f, 0f, 1f);
        int shownGold = goldBefore + Math.round((goldAfter - goldBefore) * smooth(rewardProgress));
        boolean levelUp = playerLevelAfter > playerLevelBefore;
        int shownLevel = playerLevelBefore;
        int shownXp;
        int xpLimit;
        if (levelUp) {
            float fillPhase = MathUtils.clamp(xpProgress / 0.72f, 0f, 1f);
            float resetPhase = MathUtils.clamp((xpProgress - 0.72f) / 0.28f, 0f, 1f);
            int beforeLimit = xpToNext(playerLevelBefore);
            if (xpProgress < 0.72f) {
                xpLimit = beforeLimit;
                shownXp = playerXpBefore + Math.round((beforeLimit - playerXpBefore) * smooth(fillPhase));
            } else {
                shownLevel = playerLevelAfter;
                xpLimit = xpToNext(playerLevelAfter);
                shownXp = Math.round(playerXpAfter * smooth(resetPhase));
            }
        } else {
            shownXp = playerXpBefore + Math.round((playerXpAfter - playerXpBefore) * smooth(xpProgress));
            xpLimit = xpToNext(playerLevelAfter);
        }

        float cardW = Math.min(width - 42f * rs, 790f * rs);
        float cardX = width / 2f - cardW / 2f;
        float cardH = Math.min(height - 44f * rs, 420f * rs);
        float cardY = height / 2f - cardH / 2f;
        float pad = 20f * rs;

        batch.end();
        shapes.begin(ShapeRenderer.ShapeType.Filled);
        shapes.setColor(0f, 0.01f, 0.04f, 0.36f);
        shapes.rect(0f, 0f, width, height);
        shapes.setColor(panel());
        fillRoundRect(cardX, cardY, cardW, cardH, 24f * rs);
        shapes.setColor(0f, 0.85f, 1f, 0.12f);
        fillRoundRect(cardX + pad, cardY + cardH - 6f * rs, cardW - pad * 2f, 4f * rs, 3f * rs);
        shapes.end();
        batch.begin();

        float left = cardX + pad;
        float right = cardX + cardW - pad;
        float top = cardY + cardH - 30f * rs;
        drawText("RAPORT RUNDY", left, top, 0.62f * rs, accent(), true);
        drawText("EKSTRAKCJA CIENIA", left, top - 28f * rs, 1.02f * rs, textStrong(), true);

        String recordLabel = newBest ? "NOWY REKORD" : "REKORD";
        drawText(recordLabel, right - 150f * rs, top - 2f * rs, 0.48f * rs, newBest ? gold() : muted(), true);
        drawText(String.valueOf(newBest ? score : previousBest), right - 150f * rs, top - 29f * rs, 0.82f * rs, textStrong(), true);

        float tileY = top - 92f * rs;
        float tileW = (cardW - pad * 2f - 16f * rs) / 3f;
        drawResultTile(left, tileY, tileW, 54f * rs, "POPRZEDNI", String.valueOf(previousBest), rs);
        drawResultTile(left + tileW + 8f * rs, tileY, tileW, 54f * rs, "WYNIK", String.valueOf(score), rs);
        drawResultTile(left + (tileW + 8f * rs) * 2f, tileY, tileW, 54f * rs, "GRA LV.", gameLevelBefore + " -> " + gameLevelAfter, rs);

        float xpY = tileY - 56f * rs;
        drawText("LOWCA LV. " + shownLevel + (playerLevelAfter > playerLevelBefore ? "  AWANS" : ""), left, xpY + 18f * rs, 0.68f * rs, textStrong(), true);
        float barW = cardW - pad * 2f;
        batch.end();
        shapes.begin(ShapeRenderer.ShapeType.Filled);
        shapes.setColor(progressTrack());
        fillRoundRect(left, xpY, barW, 8f * rs, 4f * rs);
        shapes.setColor(accent());
        fillRoundRect(left, xpY, barW * MathUtils.clamp((float) shownXp / xpLimit, 0f, 1f), 8f * rs, 4f * rs);
        shapes.end();
        batch.begin();
        drawText("+" + xpReward + " XP   " + shownXp + " / " + xpLimit, left, xpY - 12f * rs, 0.52f * rs, muted(), true);

        float rewardY = xpY - 72f * rs;
        drawResultTile(left, rewardY, (barW - 10f * rs) / 2f, 58f * rs, "GOLD", shownGold + "  +" + goldReward, rs, gold());
        drawResultTile(left + (barW + 10f * rs) / 2f, rewardY, (barW - 10f * rs) / 2f, 58f * rs, "HP", hpBefore + " -> " + hpAfter, rs, hpDelta < 0 ? danger() : success());

        float noteY = rewardY - 42f * rs;
        if (!lootName.isEmpty()) {
            drawText("LOOT: " + lootName, left, noteY, 0.58f * rs, violet(), true);
            noteY -= 22f * rs;
        }
        drawText(resultNote, left, noteY, 0.54f * rs, muted(), true);
        drawText("STADIUM " + gameLevelAfter + "  |  MNOZNIK x" + Math.round((won ? (1f + (gameLevelAfter - 1) * 0.12f) : 0.34f) * 100f) / 100f, left, cardY + 82f * rs, 0.52f * rs, muted(), true);

        layoutResultButtons();
        drawFilledButton(replayButton, "ZAGRAJ PONOWNIE", accent(), textStrong());
        drawFilledButton(exitButton, "WYJDZ", danger(), Color.WHITE);
    }

    private void drawResultTile(float x, float y, float w, float h, String label, String value, float rs) {
        drawResultTile(x, y, w, h, label, value, rs, textStrong());
    }

    private void drawResultTile(float x, float y, float w, float h, String label, String value, float rs, Color valueColor) {
        batch.end();
        shapes.begin(ShapeRenderer.ShapeType.Filled);
        shapes.setColor(0f, 0.025f, 0.065f, 0.66f);
        fillRoundRect(x, y, w, h, 16f * rs);
        shapes.setColor(0f, 0.85f, 1f, 0.12f);
        fillRoundRect(x, y + h - 2f * rs, w, 2f * rs, 1f * rs);
        shapes.end();
        batch.begin();
        drawText(label, x + 12f * rs, y + h - 17f * rs, 0.42f * rs, muted(), true);
        drawText(value, x + 12f * rs, y + 20f * rs, 0.62f * rs, valueColor, true);
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
        float rs = menuScale();
        float cardH = Math.min(height - 98f * rs, 332f * rs);
        float cardY = height / 2f - cardH / 2f - 4f * rs;
        float w = Math.min(260f * rs, width * 0.42f);
        startButton.set(width / 2f - w / 2f, cardY + 28f * rs, w, 52f * rs);
    }

    private void layoutPauseButtons() {
        float ps = pauseScale();
        float modalW = Math.min(width - 64f * ps, 620f * ps);
        float modalH = Math.min(height - 58f * ps, 244f * ps);
        float x = width / 2f - modalW / 2f;
        float y = height / 2f - modalH / 2f;
        float gap = 10f * ps;
        float exitW = Math.min(160f * ps, modalW * 0.32f);
        float continueW = modalW - 44f * ps - exitW - gap;
        float buttonY = y + 18f * ps;
        continueButton.set(x + 22f * ps, buttonY, continueW, 44f * ps);
        pauseExitButton.set(x + 22f * ps + continueW + gap, buttonY, exitW, 44f * ps);
    }

    private void layoutResultButtons() {
        float rs = resultScale();
        float cardW = Math.min(width - 42f * rs, 790f * rs);
        float cardH = Math.min(height - 44f * rs, 420f * rs);
        float cardX = width / 2f - cardW / 2f;
        float cardY = height / 2f - cardH / 2f;
        float gap = 12f * rs;
        float y = cardY + 18f * rs;
        float exitW = Math.min(180f * rs, cardW * 0.32f);
        float replayW = cardW - 40f * rs - exitW - gap;
        replayButton.set(cardX + 20f * rs, y, replayW, 48f * rs);
        exitButton.set(cardX + 20f * rs + replayW + gap, y, exitW, 48f * rs);
    }

    private float resultScale() {
        return MathUtils.clamp(Math.min(width / 930f, height / 520f), 0.68f, 1.08f);
    }

    private float menuScale() {
        return MathUtils.clamp(Math.min(width / 920f, height / 500f), 0.68f, 1.1f);
    }

    private float pauseScale() {
        return MathUtils.clamp(Math.min(width / 920f, height / 500f), 0.64f, 1.02f);
    }

    private float hudScale() {
        return MathUtils.clamp(Math.min(width / 1180f, height / 650f), 0.72f, 1.0f);
    }

    private void drawTopButton(String label) {
        drawFilledButton(topActionButton, label, label.equals("STOP") ? danger() : panel(), Color.WHITE, hudScale());
    }

    private void drawFilledButton(Button button, String label, Color fill, Color text) {
        drawFilledButton(button, label, fill, text, scale);
    }

    private void drawFilledButton(Button button, String label, Color fill, Color text, float uiScale) {
        batch.end();
        shapes.begin(ShapeRenderer.ShapeType.Filled);
        shapes.setColor(fill);
        fillRoundRect(button.x, button.y, button.w, button.h, 14f * uiScale);
        shapes.end();
        batch.begin();
        drawTextCentered(label, button.x + button.w / 2f, button.y + button.h / 2f - 6f * uiScale, 0.76f * uiScale, text, true);
    }

    private void drawPill(float x, float y, float w, float h, String text) {
        drawPill(x, y, w, h, text, scale);
    }

    private void drawPill(float x, float y, float w, float h, String text, float uiScale) {
        batch.end();
        shapes.begin(ShapeRenderer.ShapeType.Filled);
        shapes.setColor(0f, 0.02f, 0.06f, 0.74f);
        fillRoundRect(x, y, w, h, 16f * uiScale);
        shapes.end();
        batch.begin();
        drawTextCentered(text, x + w / 2f, y + h / 2f - 5f * uiScale, 0.56f * uiScale, textStrong(), true);
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

    private String activeBonusLabel() {
        boolean hasBonus = xpMultiplier > 1.001f
            || scoreBonus > 0.001f
            || targetLifetimeBonusMs > 1f
            || hitWindowBonus > 0.001f
            || timePenaltyResist > 0.001f;
        if (!hasBonus) return "";
        return "  |  BOOST AKTYWNY";
    }

    private String normalizeGraphicsQuality(String value) {
        if ("performance".equals(value) || "cinematic".equals(value)) return value;
        return "balanced";
    }

    private void applySelectedEffectPalette() {
        if ("monarch-runes".equals(selectedEffectId)) {
            colorAccent.set(0.64f, 0.42f, 1f, 1f);
            colorCyan.set(0.64f, 0.42f, 1f, 1f);
        } else if ("blood-sparks".equals(selectedEffectId)) {
            colorAccent.set(0.96f, 0.20f, 0.32f, 1f);
            colorCyan.set(0.96f, 0.20f, 0.32f, 1f);
        } else if ("gold-trace".equals(selectedEffectId)) {
            colorAccent.set(1f, 0.72f, 0.12f, 1f);
            colorCyan.set(1f, 0.72f, 0.12f, 1f);
        } else if ("void-pulse".equals(selectedEffectId)) {
            colorAccent.set(0.18f, 0.68f, 1f, 1f);
            colorCyan.set(0.18f, 0.68f, 1f, 1f);
        } else {
            colorAccent.set(0.09f, 0.78f, 0.88f, 1f);
            colorCyan.set(0.20f, 0.92f, 1f, 1f);
        }
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
