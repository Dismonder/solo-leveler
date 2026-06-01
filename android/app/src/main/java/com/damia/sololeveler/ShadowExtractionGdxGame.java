package com.damia.sololeveler;

import com.badlogic.gdx.ApplicationAdapter;
import com.badlogic.gdx.Gdx;
import com.badlogic.gdx.InputAdapter;
import com.badlogic.gdx.files.FileHandle;
import com.badlogic.gdx.graphics.Color;
import com.badlogic.gdx.graphics.GL20;
import com.badlogic.gdx.graphics.OrthographicCamera;
import com.badlogic.gdx.graphics.Texture;
import com.badlogic.gdx.graphics.g2d.BitmapFont;
import com.badlogic.gdx.graphics.g2d.GlyphLayout;
import com.badlogic.gdx.graphics.g2d.SpriteBatch;
import com.badlogic.gdx.graphics.g2d.freetype.FreeTypeFontGenerator;
import com.badlogic.gdx.graphics.glutils.ShapeRenderer;
import com.badlogic.gdx.math.MathUtils;
import com.badlogic.gdx.math.Rectangle;
import com.badlogic.gdx.math.Vector2;
import com.badlogic.gdx.utils.Array;
import com.badlogic.gdx.utils.TimeUtils;

public class ShadowExtractionGdxGame extends ApplicationAdapter {
    public interface Host {
        int getBestScore(String id);
        void setBestScore(String id, int score);
        int getGameLevel(String id);
        void setGameLevel(String id, int level);
        int getGold();
        void setGold(int gold);
        int getHp();
        void setHp(int hp);
        int getBaseHp();
        int getPlayerLevel();
        void setPlayerLevel(int level);
        int getPlayerXp();
        void setPlayerXp(int xp);
        void setNativeState(String state);
        void exitGame();
    }

    private enum Phase { READY, RUNNING, PAUSED, FINISHED }
    private enum Kind { SHADOW, DECOY, BOMB, GOLD, HEART, TIME }

    private static final float ROUND_SECONDS = 38f;
    private static final int TARGET_POOL_SIZE = 36;
    private static final int MAX_ACTIVE_TARGETS = 7;
    private static final int EFFECT_LIMIT = 32;
    private static final int MIN_SCORE_BASE = 650;
    private static final float TARGET_GRAVITY = -980f;

    private final String gameId;
    private final Host host;

    private ShapeRenderer shapes;
    private SpriteBatch batch;
    private BitmapFont titleFont;
    private BitmapFont font;
    private BitmapFont smallFont;
    private GlyphLayout glyph;
    private OrthographicCamera camera;
    private Texture backgroundTexture;
    private Texture shadowTexture;
    private Texture heartTexture;

    private final Array<Target> targets = new Array<>();
    private final Array<Effect> effects = new Array<>();
    private final Array<Vector2> trail = new Array<>();

    private final Rectangle exitRect = new Rectangle();
    private final Rectangle startRect = new Rectangle();
    private final Rectangle stopRect = new Rectangle();
    private final Rectangle continueRect = new Rectangle();
    private final Rectangle replayRect = new Rectangle();
    private final Rectangle resultExitRect = new Rectangle();

    private Phase phase = Phase.READY;
    private int gameLevel;
    private int score;
    private int combo;
    private int goldCollected;
    private int hpRestored;
    private float remaining;
    private float spawnTimer;
    private float tipTimer;
    private float roundAge;
    private boolean slicing;
    private float lastX;
    private float lastY;
    private float resultAge;
    private int spawnSerial;
    private float shakeTimer;
    private float shakePower;
    private Settlement settlement;

    public ShadowExtractionGdxGame(String gameId, Host host) {
        this.gameId = gameId;
        this.host = host;
    }

    @Override
    public void create() {
        shapes = new ShapeRenderer();
        batch = new SpriteBatch();
        titleFont = createSystemFont(50, true, 2.0f);
        font = createSystemFont(25, true, 1.0f);
        smallFont = createSystemFont(17, true, 0.8f);
        glyph = new GlyphLayout();
        camera = new OrthographicCamera();
        backgroundTexture = loadTexturePath("native-shadow-citadel.jpg");
        if (backgroundTexture == null) backgroundTexture = loadTextureByPrefix("01-shadow-citadel-purple");
        if (backgroundTexture == null) backgroundTexture = loadTextureByPrefix("solo-purple-citadel");
        if (backgroundTexture == null) backgroundTexture = loadTextureByPrefix("game-shadow-extraction");
        shadowTexture = loadTexturePath("native-shadow-target.png");
        if (shadowTexture == null) shadowTexture = loadTextureByPrefix("monster-abyss-mage-wraith");
        heartTexture = loadTexturePath("native-heart.png");
        if (heartTexture == null) heartTexture = loadTextureByPrefix("relic-monarch-heart");
        for (int i = 0; i < TARGET_POOL_SIZE; i++) {
            targets.add(new Target());
        }
        resetRound();
        Gdx.input.setInputProcessor(new GameInput());
        Gdx.graphics.setContinuousRendering(true);
        host.setNativeState("menu");
    }

    @Override
    public void resize(int width, int height) {
        camera.setToOrtho(false, width, height);
        camera.update();
        updateLayout(width, height);
    }

    @Override
    public void render() {
        float dt = Math.min(Gdx.graphics.getDeltaTime(), 1f / 24f);
        tipTimer += dt;
        if (phase == Phase.RUNNING) {
            updateRound(dt);
        }
        if (phase == Phase.FINISHED) {
            resultAge += dt;
        }

        Gdx.gl.glClearColor(0.01f, 0.025f, 0.07f, 1f);
        Gdx.gl.glClear(GL20.GL_COLOR_BUFFER_BIT);
        Gdx.gl.glEnable(GL20.GL_BLEND);
        Gdx.gl.glBlendFunc(GL20.GL_SRC_ALPHA, GL20.GL_ONE_MINUS_SRC_ALPHA);

        float shakeX = 0f;
        float shakeY = 0f;
        if (shakeTimer > 0f) {
            shakeTimer = Math.max(0f, shakeTimer - dt);
            float force = shakePower * (shakeTimer / 0.18f);
            shakeX = MathUtils.random(-force, force);
            shakeY = MathUtils.random(-force, force);
        }
        camera.position.set(Gdx.graphics.getWidth() * 0.5f + shakeX, Gdx.graphics.getHeight() * 0.5f + shakeY, 0f);
        camera.update();
        shapes.setProjectionMatrix(camera.combined);
        batch.setProjectionMatrix(camera.combined);

        drawBackground(dt);
        drawTargets();
        drawTrail();
        drawEffects(dt);
        drawHud();
        if (phase == Phase.READY) drawReady();
        if (phase == Phase.PAUSED) drawPause();
        if (phase == Phase.FINISHED) drawResult();

        if (shakeX != 0f || shakeY != 0f) {
            camera.position.set(Gdx.graphics.getWidth() * 0.5f, Gdx.graphics.getHeight() * 0.5f, 0f);
            camera.update();
        }
    }

    @Override
    public void pause() {
        if (phase == Phase.RUNNING) {
            phase = Phase.PAUSED;
            host.setNativeState("paused");
        }
    }

    @Override
    public void resume() {
        host.setNativeState(nativeStateForPhase());
    }

    @Override
    public void dispose() {
        host.setNativeState("app");
        if (shapes != null) shapes.dispose();
        if (batch != null) batch.dispose();
        if (titleFont != null) titleFont.dispose();
        if (font != null) font.dispose();
        if (smallFont != null) smallFont.dispose();
        if (backgroundTexture != null) backgroundTexture.dispose();
        if (shadowTexture != null) shadowTexture.dispose();
        if (heartTexture != null) heartTexture.dispose();
    }

    private void updateLayout(int width, int height) {
        exitRect.set(width - 76, height - 58, 52, 40);
        stopRect.set(width - 118, height - 60, 92, 42);
        startRect.set(width * 0.5f - 160, height * 0.12f, 320, 60);
        continueRect.set(width * 0.5f - 170, height * 0.28f, 340, 56);
        replayRect.set(width * 0.5f - 170, 78, 340, 52);
        resultExitRect.set(width * 0.5f - 170, 22, 340, 46);
    }

    private void resetRound() {
        gameLevel = host.getGameLevel(gameId);
        score = 0;
        combo = 0;
        goldCollected = 0;
        hpRestored = 0;
        remaining = ROUND_SECONDS;
        spawnTimer = 0f;
        roundAge = 0f;
        settlement = null;
        resultAge = 0f;
        spawnSerial = MathUtils.random(0, 6);
        shakeTimer = 0f;
        shakePower = 0f;
        slicing = false;
        tipTimer = 0f;
        phase = Phase.READY;
        for (Target target : targets) target.active = false;
        effects.clear();
        trail.clear();
    }

    private void startRound() {
        if (host.getHp() <= 0) {
            addEffect(Gdx.graphics.getWidth() * 0.5f, Gdx.graphics.getHeight() * 0.5f, Color.SCARLET, 1.2f, "BRAK HP");
            return;
        }
        resetRound();
        phase = Phase.RUNNING;
        host.setNativeState("gameplay");
        for (int i = 0; i < 3; i++) spawnTarget(true);
    }

    private void updateRound(float dt) {
        roundAge += dt;
        remaining -= dt;
        spawnTimer -= dt;
        if (spawnTimer <= 0f) {
            int active = activeTargetCount();
            int burst = active <= 1 ? 2 : 1;
            if (MathUtils.randomBoolean(0.12f + Math.min(0.14f, gameLevel * 0.004f))) burst += 1;
            if (MathUtils.randomBoolean(0.018f + Math.min(0.035f, gameLevel * 0.0015f))) burst += 1;
            burst = Math.min(burst, Math.max(0, MAX_ACTIVE_TARGETS - activeTargetCount()));
            for (int i = 0; i < burst; i++) spawnTarget(false);
            spawnTimer = Math.max(0.58f, 1.02f - gameLevel * 0.008f) + MathUtils.random(0f, 0.14f);
        }
        for (int i = targets.size - 1; i >= 0; i--) {
            Target target = targets.get(i);
            if (!target.active) continue;
            if (target.delay > 0f) {
                target.delay -= dt;
                continue;
            }
            target.age += dt;
            target.ttl -= dt;
            target.vy += TARGET_GRAVITY * dt;
            target.x += target.vx * dt;
            target.y += target.vy * dt;
            target.rotation += target.angularVelocity * dt;
            if ((target.x < target.radius && target.vx < 0f) || (target.x > Gdx.graphics.getWidth() - target.radius && target.vx > 0f)) {
                target.vx *= -0.42f;
            }
            boolean leftScene = target.y < -target.radius * 2.8f && target.vy < 0f;
            if (target.ttl <= 0f || leftScene) {
                target.active = false;
                if (target.kind == Kind.SHADOW) combo = 0;
            }
        }
        while (trail.size > 24) trail.removeIndex(0);
        if (!slicing && trail.size > 0) trail.removeIndex(0);
        if (remaining <= 0f) finishRound();
    }

    private void spawnTarget(boolean opening) {
        Target target = inactiveTarget();
        if (target == null) return;

        float w = Gdx.graphics.getWidth();
        float h = Gdx.graphics.getHeight();
        float radius = MathUtils.random(40f, 58f);
        float margin = radius + 40f;
        int activeBefore = activeTargetCount();
        boolean sideLaunch = !opening && MathUtils.randomBoolean(0.20f);
        float lane = (spawnSerial * 0.618034f + MathUtils.random(-0.07f, 0.07f)) % 1f;
        if (lane < 0f) lane += 1f;
        spawnSerial += 1;
        float launchX = MathUtils.lerp(margin, w - margin, lane);
        for (int attempts = 0; attempts < 5; attempts++) {
            boolean tooClose = false;
            for (Target active : targets) {
                if (!active.active) continue;
                if (Math.abs(active.x - launchX) < radius * 3.2f && active.y < h * 0.45f) {
                    tooClose = true;
                    break;
                }
            }
            if (!tooClose) break;
            lane = (lane + 0.37f) % 1f;
            launchX = MathUtils.lerp(margin, w - margin, lane);
        }
        float centerPull = (w * 0.5f - launchX) * MathUtils.random(0.12f, 0.24f);

        target.active = true;
        target.radius = radius;
        target.age = 0f;
        target.delay = opening ? activeBefore * 0.16f : MathUtils.random(0f, 0.18f);
        target.maxTtl = sideLaunch ? MathUtils.random(4.6f, 5.7f) : MathUtils.random(4.8f, 6.2f);
        target.ttl = target.maxTtl;
        if (sideLaunch) {
            boolean fromLeft = launchX < w * 0.5f;
            target.x = fromLeft ? -radius * 1.2f : w + radius * 1.2f;
            target.y = MathUtils.random(h * 0.10f, h * 0.30f);
            target.vx = (fromLeft ? 1f : -1f) * MathUtils.random(w * 0.34f, w * 0.52f);
            target.vy = MathUtils.random(h * 0.62f, h * 0.86f) + Math.min(96f, gameLevel * 2.6f);
        } else {
            target.x = MathUtils.clamp(launchX, margin, w - margin);
            target.y = -radius * 1.7f - MathUtils.random(0f, h * 0.08f);
            boolean highArc = MathUtils.randomBoolean(opening ? 0.42f : 0.34f);
            float arcBoost = highArc ? h * 0.13f : h * 0.03f;
            target.vx = centerPull + MathUtils.random(-180f, 180f);
            target.vy = MathUtils.random(h * 1.05f, h * 1.22f) + arcBoost + Math.min(118f, gameLevel * 3.2f);
        }
        target.rotation = MathUtils.random(0f, 360f);
        target.angularVelocity = MathUtils.random(-120f, 120f);
        target.kind = chooseKind(opening);
    }

    private Kind chooseKind(boolean opening) {
        if (opening) return Kind.SHADOW;
        float roll = MathUtils.random();
        if (roll < 0.004f) return Kind.TIME;
        if (roll < 0.010f) return Kind.HEART;
        if (roll < 0.13f) return Kind.GOLD;
        if (roll < 0.29f) return Kind.BOMB;
        if (roll < 0.42f) return Kind.DECOY;
        return Kind.SHADOW;
    }

    private Target inactiveTarget() {
        for (Target target : targets) {
            if (!target.active) return target;
        }
        return null;
    }

    private int activeTargetCount() {
        int count = 0;
        for (Target target : targets) {
            if (target.active) count++;
        }
        return count;
    }

    private void handleSlice(float x1, float y1, float x2, float y2) {
        trail.add(new Vector2(x2, y2));
        float angle = MathUtils.atan2(y2 - y1, x2 - x1);
        int hits = 0;
        float hitX = 0f;
        float hitY = 0f;
        for (Target target : targets) {
            if (!target.active) continue;
            if (target.delay > 0f) continue;
            if (distanceToSegment(target.x, target.y, x1, y1, x2, y2) <= target.radius + 28f) {
                hitX += target.x;
                hitY += target.y;
                hits += 1;
                hitTarget(target, angle);
            }
        }
        if (hits >= 2) {
            int bonus = 35 * hits + gameLevel * 2;
            score += bonus;
            addEffect(hitX / hits, hitY / hits + 22f, Color.SKY, 0.72f, "MULTI +" + bonus);
        }
    }

    private void hitTarget(Target target, float sliceAngle) {
        target.active = false;
        Color hitColor = colorFor(target.kind);
        addSliceFlash(target.x, target.y, hitColor, sliceAngle, target.radius);
        addParticleBurst(target.x, target.y, hitColor, target.kind == Kind.BOMB ? 24 : 13);
        switch (target.kind) {
            case SHADOW:
                combo += 1;
                score += 90 + combo * 14 + gameLevel * 3;
                addEffect(target.x, target.y, Color.CYAN, 0.62f, "+" + (90 + combo * 14));
                break;
            case DECOY:
                combo = 0;
                score = Math.max(0, score - 45);
                addEffect(target.x, target.y, Color.PURPLE, 0.7f, "FALSZ");
                break;
            case BOMB:
                combo = 0;
                remaining = Math.max(0f, remaining - 2.2f);
                shakeTimer = 0.18f;
                shakePower = 13f;
                addEffect(target.x, target.y, Color.SCARLET, 1.05f, "BOMBA");
                break;
            case GOLD:
                int gold = 5 + Math.max(1, gameLevel / 2);
                goldCollected += gold;
                score += 24;
                addEffect(target.x, target.y, Color.GOLD, 0.7f, "+" + gold + "G");
                break;
            case HEART:
                int heal = Math.max(1, Math.round(host.getBaseHp() * 0.05f));
                hpRestored += heal;
                addEffect(target.x, target.y, Color.PINK, 0.9f, "+" + heal + "HP");
                break;
            case TIME:
                remaining += 4.8f;
                addEffect(target.x, target.y, Color.SKY, 1.0f, "+CZAS");
                break;
        }
    }

    private void finishRound() {
        phase = Phase.FINISHED;
        for (Target target : targets) target.active = false;
        trail.clear();

        int previousBest = host.getBestScore(gameId);
        boolean newBest = score > previousBest;
        if (newBest) host.setBestScore(gameId, score);

        int previousGameLevel = host.getGameLevel(gameId);
        int minScore = MIN_SCORE_BASE + previousGameLevel * 95;
        boolean won = score >= minScore;
        int nextGameLevel = won ? previousGameLevel + 1 : previousGameLevel;
        host.setGameLevel(gameId, nextGameLevel);

        int goldBefore = host.getGold();
        int rewardGold = won ? 20 + previousGameLevel * 4 + score / 80 : Math.max(0, goldCollected);
        int goldAfter = goldBefore + rewardGold + goldCollected;
        host.setGold(goldAfter);

        int hpBefore = host.getHp();
        int hpLoss = won ? 0 : Math.min(120, 18 + previousGameLevel * 3);
        int hpAfter = Math.max(0, Math.min(host.getBaseHp(), hpBefore - hpLoss + hpRestored));
        host.setHp(hpAfter);

        int playerLevelBefore = host.getPlayerLevel();
        int xpBefore = host.getPlayerXp();
        int xpReward = won ? 70 + previousGameLevel * 16 + score / 38 : 15 + score / 120;
        int[] xpSettlement = applyXp(playerLevelBefore, xpBefore, xpReward);
        host.setPlayerLevel(xpSettlement[0]);
        host.setPlayerXp(xpSettlement[1]);

        settlement = new Settlement(previousBest, newBest, previousGameLevel, nextGameLevel, minScore,
            goldBefore, goldAfter, rewardGold + goldCollected, hpBefore, hpAfter, hpLoss, hpRestored,
            playerLevelBefore, xpSettlement[0], xpBefore, xpSettlement[1], xpReward, won);
        resultAge = 0f;
        host.setNativeState("paused");
    }

    private int[] applyXp(int level, int xp, int reward) {
        int currentLevel = Math.max(1, level);
        int currentXp = Math.max(0, xp) + Math.max(0, reward);
        while (currentXp >= xpCap(currentLevel)) {
            currentXp -= xpCap(currentLevel);
            currentLevel += 1;
        }
        return new int[]{ currentLevel, currentXp };
    }

    private int xpCap(int level) {
        return 900 + level * 120;
    }

    private void drawBackground(float dt) {
        float w = Gdx.graphics.getWidth();
        float h = Gdx.graphics.getHeight();
        if (backgroundTexture != null) {
            batch.begin();
            batch.setColor(1f, 1f, 1f, phase == Phase.READY ? 0.92f : 0.76f);
            drawCover(backgroundTexture, 0, 0, w, h);
            batch.setColor(Color.WHITE);
            batch.end();
        }
        shapes.begin(ShapeRenderer.ShapeType.Filled);
        if (backgroundTexture == null) {
            shapes.setColor(0.005f, 0.012f, 0.035f, 1f);
            shapes.rect(0, 0, w, h);
        }
        if (backgroundTexture == null) {
            shapes.setColor(0.002f, 0.008f, 0.026f, 0.70f);
            shapes.rect(0, 0, w, h);
        }
        if (backgroundTexture == null) {
            shapes.setColor(0.0f, 0.34f, 0.52f, 0.10f);
            shapes.rect(0, 0, w, h * 0.55f);
            shapes.setColor(0.32f, 0.08f, 0.72f, 0.10f);
            float pulse = 0.5f + 0.5f * MathUtils.sin(TimeUtils.millis() / 620f);
            shapes.circle(w * 0.52f, h * 0.52f, Math.min(w, h) * (0.28f + pulse * 0.03f));
        }
        int rainLines = 0;
        for (int i = 0; i < rainLines; i++) {
            float x = (i * 97 + TimeUtils.millis() * 0.018f) % (w + 80) - 40;
            float y = h * (0.16f + (i % 7) * 0.11f);
            shapes.setColor(0.25f, 0.95f, 1f, 0.08f);
            shapes.rectLine(x, y, x + 42, y + 120, 1.2f);
        }
        shapes.end();
    }

    private void drawHud() {
        float w = Gdx.graphics.getWidth();
        float h = Gdx.graphics.getHeight();
        if (phase == Phase.RUNNING) {
            drawRoundPanel(26, h - 60, 210, 38, 16f,
                new Color(0.004f, 0.012f, 0.032f, 0.70f),
                new Color(0.12f, 0.88f, 1f, 0.28f));
            drawRoundPanel(w * 0.5f - 104, h - 60, 208, 38, 16f,
                new Color(0.004f, 0.012f, 0.032f, 0.70f),
                new Color(0.12f, 0.88f, 1f, 0.28f));
            drawRoundPanel(w - 320, h - 60, 156, 38, 16f,
                new Color(0.004f, 0.012f, 0.032f, 0.70f),
                new Color(0.12f, 0.88f, 1f, 0.20f));
        }
        batch.begin();
        if (phase == Phase.RUNNING) {
            drawCentered(smallFont, Math.max(0, Math.round(remaining)) + "S", 131, h - 34, Color.WHITE);
            drawCentered(font, "SCORE " + score, w * 0.5f, h - 34, Color.CYAN);
            drawText(smallFont, "COMBO " + combo, w - 286, h - 34, Color.WHITE);
        }
        batch.end();
        if (phase == Phase.RUNNING) {
            drawButton(stopRect, "STOP", new Color(0.42f, 0.08f, 0.14f, 0.82f), Color.WHITE);
            drawTimeBar();
        } else if (phase == Phase.READY) {
            drawButton(exitRect, "X", new Color(0.04f, 0.08f, 0.13f, 0.9f), Color.WHITE);
        }
    }

    private void drawTimeBar() {
        float w = Gdx.graphics.getWidth();
        float h = Gdx.graphics.getHeight();
        float pct = MathUtils.clamp(remaining / ROUND_SECONDS, 0f, 1f);
        shapes.begin(ShapeRenderer.ShapeType.Filled);
        shapes.setColor(0f, 0f, 0f, 0.38f);
        shapes.rect(28, h - 48, 180, 5);
        shapes.setColor(0.2f, 0.95f, 1f, 0.9f);
        shapes.rect(28, h - 48, 180 * pct, 5);
        shapes.end();
    }

    private void drawReady() {
        float w = Gdx.graphics.getWidth();
        float h = Gdx.graphics.getHeight();
        float centerX = w * 0.5f;
        float bandW = Math.min(920f, w * 0.48f);
        float bandH = Math.min(238f, h * 0.29f);
        float bandX = centerX - bandW * 0.5f;
        float bandY = h * 0.24f;
        drawRoundPanel(72f, h - 104f, w - 144f, 58f, 26f,
            new Color(0.002f, 0.012f, 0.038f, 0.22f),
            new Color(0.12f, 0.88f, 1f, 0.13f));
        drawRoundPanel(bandX, bandY, bandW, bandH, 30f,
            new Color(0.002f, 0.010f, 0.030f, 0.78f),
            new Color(0.12f, 0.88f, 1f, 0.16f));
        batch.begin();
        drawText(smallFont, "SYSTEM GATE", 112f, h - 70f, Color.CYAN);
        drawText(font, "EKSTRAKCJA CIENIA", 250f, h - 68f, Color.WHITE);
        drawCenteredShadow(titleFont, "EKSTRAKCJA CIENIA", centerX, bandY + bandH - 58f, Color.WHITE);
        drawCenteredShadow(font, "Przetnij cienie jednym dlugim ruchem.", centerX, bandY + bandH - 112f, new Color(0.86f, 0.93f, 1f, 1f));
        drawCenteredShadow(smallFont, readyTip(), centerX, bandY + 88f, new Color(0.50f, 0.96f, 1f, 1f));
        drawCenteredShadow(smallFont, "LV." + gameLevel + "  HP " + host.getHp() + "/" + host.getBaseHp() + "  GOLD " + host.getGold(), centerX, bandY + 48f, Color.CYAN);
        batch.end();
        drawButton(startRect, "START", new Color(0.0f, 0.42f, 0.52f, 0.92f), Color.WHITE);
        drawButton(exitRect, "X", new Color(0.04f, 0.08f, 0.13f, 0.9f), Color.WHITE);
    }

    private void drawPause() {
        float w = Gdx.graphics.getWidth();
        float h = Gdx.graphics.getHeight();
        float panelW = Math.min(560f, w * 0.46f);
        float panelH = Math.min(300f, h * 0.42f);
        float panelX = w * 0.5f - panelW * 0.5f;
        float panelY = h * 0.5f - panelH * 0.5f;
        drawRoundPanel(panelX, panelY, panelW, panelH, 28f,
            new Color(0.012f, 0.026f, 0.060f, 0.88f),
            new Color(0.12f, 0.88f, 1f, 0.28f));
        continueRect.set(panelX + 24f, panelY + 72f, panelW - 48f, 54f);
        resultExitRect.set(panelX + 24f, panelY + 18f, panelW - 48f, 42f);
        batch.begin();
        drawCentered(font, "PAUZA", w * 0.5f, panelY + panelH - 44f, Color.WHITE);
        drawCentered(smallFont, pauseTip(), w * 0.5f, panelY + panelH - 96f, new Color(0.76f, 0.9f, 1f, 1f));
        drawCentered(smallFont, "Efekt cięcia: System Blue", w * 0.5f, panelY + panelH - 132f, Color.CYAN);
        batch.end();
        drawButton(continueRect, "KONTYNUUJ", new Color(0.0f, 0.36f, 0.48f, 0.92f), Color.WHITE);
        drawButton(resultExitRect, "WYJDZ", new Color(0.16f, 0.18f, 0.28f, 0.92f), Color.WHITE);
    }

    private void drawResult() {
        if (settlement == null) return;
        float w = Gdx.graphics.getWidth();
        float h = Gdx.graphics.getHeight();
        float anim = smooth(MathUtils.clamp(resultAge / 9.5f, 0f, 1f));
        int shownGold = settlement.goldBefore + Math.round((settlement.goldAfter - settlement.goldBefore) * anim);
        boolean levelUp = settlement.playerLevelAfter > settlement.playerLevelBefore;
        int beforeCap = xpCap(settlement.playerLevelBefore);
        int afterCap = xpCap(settlement.playerLevelAfter);
        float beforePct = MathUtils.clamp(settlement.xpBefore / (float) beforeCap, 0f, 1f);
        float afterPct = MathUtils.clamp(settlement.xpAfter / (float) afterCap, 0f, 1f);
        int shownLevel;
        float xpPct;
        if (levelUp) {
            float levelPhase = MathUtils.clamp(resultAge / 9.5f, 0f, 1f);
            if (levelPhase < 0.70f) {
                shownLevel = settlement.playerLevelBefore;
                xpPct = MathUtils.lerp(beforePct, 1f, smooth(levelPhase / 0.70f));
            } else {
                shownLevel = settlement.playerLevelAfter;
                xpPct = MathUtils.lerp(0f, afterPct, smooth((levelPhase - 0.70f) / 0.30f));
            }
        } else {
            shownLevel = settlement.playerLevelAfter;
            xpPct = MathUtils.lerp(beforePct, afterPct, anim);
        }
        float panelW = Math.min(1190f, w * 0.74f);
        float panelH = Math.min(700f, h * 0.78f);
        float panelX = w * 0.5f - panelW * 0.5f;
        float panelY = h * 0.12f;
        drawRoundPanel(panelX, panelY, panelW, panelH, 30f,
            new Color(0.018f, 0.032f, 0.072f, 0.88f),
            new Color(0.1f, 0.86f, 1f, 0.34f));

        float left = panelX + 42f;
        float right = panelX + panelW - 42f;
        float top = panelY + panelH - 42f;
        float colW = (panelW - 108f) / 3f;
        float rowY = top - 206f;
        float xpY = rowY - 130f;
        float lowerY = xpY - 110f;
        float buttonY = panelY + 34f;
        float buttonGap = 14f;
        float replayW = (panelW - 84f - buttonGap) * 0.62f;
        float exitW = panelW - 84f - buttonGap - replayW;
        replayRect.set(left, buttonY, replayW, 58f);
        resultExitRect.set(left + replayW + buttonGap, buttonY, exitW, 58f);

        drawRoundPanel(left, rowY, colW, 118f, 24f, new Color(0.004f, 0.012f, 0.034f, 0.74f), new Color(0.13f, 0.9f, 1f, 0.22f));
        drawRoundPanel(left + colW + 12f, rowY, colW, 118f, 24f, new Color(0.004f, 0.012f, 0.034f, 0.74f), new Color(0.13f, 0.9f, 1f, 0.22f));
        drawRoundPanel(left + (colW + 12f) * 2f, rowY, colW, 118f, 24f, new Color(0.004f, 0.012f, 0.034f, 0.74f), new Color(0.13f, 0.9f, 1f, 0.22f));

        drawRoundPanel(left, xpY, panelW - 84f, 110f, 24f, new Color(0.004f, 0.012f, 0.034f, 0.72f), new Color(0.78f, 0.95f, 1f, 0.18f));
        drawRoundPanel(left, lowerY, colW, 88f, 22f, new Color(0.035f, 0.026f, 0.008f, 0.74f), new Color(1f, 0.76f, 0.18f, 0.30f));
        drawRoundPanel(left + colW + 12f, lowerY, colW, 88f, 22f, new Color(0.045f, 0.012f, 0.030f, 0.74f), new Color(1f, 0.34f, 0.54f, 0.28f));
        drawRoundPanel(left + (colW + 12f) * 2f, lowerY, colW, 88f, 22f, new Color(0.020f, 0.018f, 0.052f, 0.74f), new Color(0.52f, 0.88f, 1f, 0.24f));

        batch.begin();
        drawText(smallFont, "RAPORT RUNDY", left, top, Color.CYAN);
        drawText(titleFont, "EKSTRAKCJA CIENIA", left, top - 48f, Color.WHITE);
        String statusLabel = settlement.won ? "PROBA ZALICZONA" : "PROBA NIEZALICZONA";
        String statusMeta = settlement.won
            ? (settlement.newBest ? "NOWY REKORD" : "REKORD NIEPOBITY")
            : "MINIMUM " + MIN_SCORE_BASE + " PKT";
        drawText(font, statusLabel, right - 292f, top - 12f, settlement.won ? Color.CYAN : Color.SCARLET);
        drawText(smallFont, statusMeta, right - 292f, top - 48f, settlement.won && settlement.newBest ? Color.GOLD : new Color(0.7f, 0.78f, 0.9f, 1f));

        drawText(smallFont, "POPRZEDNI", left + 24f, rowY + 84f, new Color(0.58f, 0.66f, 0.8f, 1f));
        drawText(font, "" + settlement.previousBest, left + 24f, rowY + 44f, Color.WHITE);
        drawText(smallFont, "WYNIK", left + colW + 36f, rowY + 84f, new Color(0.58f, 0.66f, 0.8f, 1f));
        drawText(font, "" + score, left + colW + 36f, rowY + 44f, settlement.won ? Color.CYAN : Color.WHITE);
        drawText(smallFont, "GRA LV.", left + (colW + 12f) * 2f + 24f, rowY + 84f, new Color(0.58f, 0.66f, 0.8f, 1f));
        drawText(font, settlement.previousGameLevel + " -> " + settlement.nextGameLevel, left + (colW + 12f) * 2f + 24f, rowY + 44f, Color.WHITE);

        drawText(smallFont, "LOWCA", left + 24f, xpY + 76f, new Color(0.58f, 0.66f, 0.8f, 1f));
        drawText(font, "LV." + shownLevel + "   +" + settlement.xpReward + " XP", left + 24f, xpY + 43f, levelUp ? Color.GOLD : Color.WHITE);
        drawText(smallFont, levelUp ? "AWANS: LV." + settlement.playerLevelBefore + " -> LV." + settlement.playerLevelAfter : settlement.xpAfter + " / " + afterCap, right - 260f, xpY + 43f, levelUp ? Color.GOLD : new Color(0.7f, 0.9f, 1f, 1f));

        drawText(smallFont, "GOLD", left + 24f, lowerY + 56f, new Color(0.9f, 0.74f, 0.34f, 1f));
        drawText(font, settlement.goldBefore + " -> " + shownGold, left + 24f, lowerY + 28f, Color.GOLD);
        drawText(smallFont, "+" + settlement.goldReward, left + 24f, lowerY - 9f, Color.GOLD);

        String hpText = settlement.hpBefore + " -> " + settlement.hpAfter;
        String hpDelta = settlement.hpLoss > 0 ? "-" + settlement.hpLoss : "+" + settlement.hpRestored;
        drawText(smallFont, "HP", left + colW + 36f, lowerY + 56f, new Color(1f, 0.52f, 0.66f, 1f));
        drawText(font, hpText, left + colW + 36f, lowerY + 28f, settlement.hpLoss > 0 ? Color.SCARLET : Color.PINK);
        drawText(smallFont, hpDelta, left + colW + 36f, lowerY - 9f, settlement.hpLoss > 0 ? Color.SCARLET : Color.PINK);

        drawText(smallFont, "LOOT", left + (colW + 12f) * 2f + 24f, lowerY + 56f, new Color(0.58f, 0.9f, 1f, 1f));
        drawText(font, lootName(), left + (colW + 12f) * 2f + 24f, lowerY + 28f, Color.WHITE);
        drawText(smallFont, lootRarity() + "  +SENSE", left + (colW + 12f) * 2f + 24f, lowerY - 9f, Color.CYAN);
        batch.end();
        drawProgress(left + 24f, xpY + 16f, panelW - 132f, 10f, xpPct);
        drawButton(replayRect, "ZAGRAJ PONOWNIE", new Color(0.0f, 0.42f, 0.52f, 0.92f), Color.WHITE);
        drawButton(resultExitRect, "WYJDZ", new Color(0.16f, 0.18f, 0.28f, 0.92f), Color.WHITE);
    }

    private String nativeStateForPhase() {
        switch (phase) {
            case RUNNING:
                return "gameplay";
            case PAUSED:
            case FINISHED:
                return "paused";
            default:
                return "menu";
        }
    }

    private String lootName() {
        if (settlement == null || !settlement.won) return "BRAK LUPU";
        int level = settlement.nextGameLevel;
        if (level >= 30) return "RELIKT CIENIA S";
        if (level >= 20) return "OSTRZE CIENIA A";
        if (level >= 10) return "RDZEN BRAMY B";
        return "ODLAMEK CIENIA C";
    }

    private String lootRarity() {
        if (settlement == null || !settlement.won) return "FAILED";
        int level = settlement.nextGameLevel;
        if (level >= 35) return "LEGENDARY";
        if (level >= 24) return "EPIC";
        if (level >= 12) return "RARE";
        return "COMMON";
    }

    private void drawTargets() {
        shapes.begin(ShapeRenderer.ShapeType.Filled);
        for (Target target : targets) {
            if (!target.active) continue;
            if (target.delay > 0f) continue;
            Color color = colorFor(target.kind);
            shapes.setColor(color.r, color.g, color.b, 0.88f);
            if (target.kind == Kind.GOLD) {
                shapes.setColor(1f, 0.64f, 0.08f, 0.36f);
                shapes.circle(target.x, target.y, target.radius * 0.92f);
                shapes.setColor(1f, 0.72f, 0.10f, 0.94f);
                shapes.rect(target.x - target.radius * 0.78f, target.y - target.radius * 0.36f, target.radius * 1.56f, target.radius * 0.72f);
                shapes.setColor(1f, 0.95f, 0.45f, 0.9f);
                shapes.rect(target.x - target.radius * 0.58f, target.y - target.radius * 0.12f, target.radius * 1.16f, target.radius * 0.13f);
            } else if (target.kind == Kind.BOMB) {
                shapes.setColor(1f, 0.0f, 0.05f, 0.22f);
                shapes.circle(target.x, target.y, target.radius * 1.13f);
                shapes.setColor(0.06f, 0.0f, 0.0f, 0.95f);
                shapes.circle(target.x, target.y, target.radius * 0.74f);
                shapes.setColor(1f, 0.12f, 0.16f, 0.88f);
                shapes.rectLine(target.x - target.radius * 0.52f, target.y - target.radius * 0.52f,
                    target.x + target.radius * 0.52f, target.y + target.radius * 0.52f, 5f);
                shapes.rectLine(target.x + target.radius * 0.52f, target.y - target.radius * 0.52f,
                    target.x - target.radius * 0.52f, target.y + target.radius * 0.52f, 5f);
            } else if (target.kind == Kind.TIME) {
                shapes.setColor(0.1f, 0.75f, 1f, 0.78f);
                shapes.rectLine(target.x - target.radius * 0.70f, target.y, target.x, target.y + target.radius * 0.70f, 5f);
                shapes.rectLine(target.x, target.y + target.radius * 0.70f, target.x + target.radius * 0.70f, target.y, 5f);
                shapes.rectLine(target.x + target.radius * 0.70f, target.y, target.x, target.y - target.radius * 0.70f, 5f);
                shapes.rectLine(target.x, target.y - target.radius * 0.70f, target.x - target.radius * 0.70f, target.y, 5f);
                shapes.setColor(0.78f, 0.98f, 1f, 0.92f);
                shapes.rectLine(target.x, target.y - target.radius * 0.45f, target.x, target.y + target.radius * 0.38f, 4f);
                shapes.rectLine(target.x, target.y, target.x + target.radius * 0.34f, target.y + target.radius * 0.18f, 4f);
            }
        }
        shapes.end();
        if (shadowTexture != null || heartTexture != null) {
            batch.begin();
            for (Target target : targets) {
                if (!target.active) continue;
                if (target.delay > 0f) continue;
                Texture texture = null;
                if (target.kind == Kind.SHADOW || target.kind == Kind.DECOY) texture = shadowTexture;
                if (target.kind == Kind.HEART) texture = heartTexture;
                if (texture == null) continue;
                float size = target.radius * (target.kind == Kind.HEART ? 1.95f : 2.82f);
                batch.setColor(1f, 1f, 1f, target.kind == Kind.DECOY ? 0.48f : 1.0f);
                batch.draw(texture, target.x - size * 0.5f, target.y - size * 0.5f,
                    size * 0.5f, size * 0.5f, size, size, 1f, 1f, target.rotation,
                    0, 0, texture.getWidth(), texture.getHeight(), false, false);
            }
            batch.setColor(Color.WHITE);
            batch.end();
        }
    }

    private void drawTrail() {
        if (trail.size < 2) return;
        shapes.begin(ShapeRenderer.ShapeType.Filled);
        for (int i = 1; i < trail.size; i++) {
            Vector2 a = trail.get(i - 1);
            Vector2 b = trail.get(i);
            float alpha = MathUtils.clamp(i / (float) trail.size, 0.1f, 1f);
            shapes.setColor(0.12f, 0.85f, 1f, alpha * 0.34f);
            shapes.rectLine(a.x, a.y, b.x, b.y, 18f);
            shapes.setColor(0.34f, 0.95f, 1f, alpha * 0.70f);
            shapes.rectLine(a.x, a.y, b.x, b.y, 7.5f);
            shapes.setColor(0.92f, 1f, 1f, alpha * 0.96f);
            shapes.rectLine(a.x, a.y, b.x, b.y, 2.4f);
        }
        shapes.end();
    }

    private void drawEffects(float dt) {
        shapes.begin(ShapeRenderer.ShapeType.Filled);
        for (int i = effects.size - 1; i >= 0; i--) {
            Effect effect = effects.get(i);
            effect.age += dt;
            effect.x += effect.vx * dt;
            effect.y += effect.vy * dt;
            float pct = effect.age / effect.life;
            if (pct >= 1f) {
                effects.removeIndex(i);
                continue;
            }
            if (effect.slash) {
                float alpha = 1f - pct;
                float half = effect.length * (0.62f + pct * 0.22f);
                float dx = MathUtils.cos(effect.angle) * half;
                float dy = MathUtils.sin(effect.angle) * half;
                shapes.setColor(effect.color.r, effect.color.g, effect.color.b, alpha * 0.56f);
                shapes.rectLine(effect.x - dx, effect.y - dy, effect.x + dx, effect.y + dy, Math.max(3.0f, effect.thickness * alpha));
                shapes.setColor(0.28f, 0.95f, 1f, alpha * 0.42f);
                shapes.rectLine(effect.x - dx * 0.88f, effect.y - dy * 0.88f, effect.x + dx * 0.88f, effect.y + dy * 0.88f, Math.max(2.0f, effect.thickness * 0.55f * alpha));
                shapes.setColor(0.92f, 1f, 1f, alpha * 0.82f);
                shapes.rectLine(effect.x - dx * 0.72f, effect.y - dy * 0.72f, effect.x + dx * 0.72f, effect.y + dy * 0.72f, Math.max(1.2f, effect.thickness * 0.28f * alpha));
                continue;
            }
            float alpha = 1f - pct;
            boolean particle = effect.text == null || effect.text.isEmpty();
            if (particle) {
                shapes.setColor(effect.color.r, effect.color.g, effect.color.b, alpha * 0.76f);
                shapes.circle(effect.x, effect.y, Math.max(1.4f, effect.radius * alpha));
                shapes.setColor(0.96f, 1f, 1f, alpha * 0.22f);
                shapes.circle(effect.x, effect.y, Math.max(0.8f, effect.radius * 0.42f * alpha));
            } else {
                shapes.setColor(effect.color.r, effect.color.g, effect.color.b, alpha * 0.28f);
                shapes.circle(effect.x, effect.y, effect.radius + pct * 22f);
            }
        }
        shapes.end();
        batch.begin();
        for (Effect effect : effects) {
            if (effect.text == null || effect.text.isEmpty()) continue;
            float pct = effect.age / effect.life;
            drawCentered(smallFont, effect.text, effect.x, effect.y + 34 + pct * 22, new Color(effect.color.r, effect.color.g, effect.color.b, 1f - pct));
        }
        batch.end();
    }

    private void addEffect(float x, float y, Color color, float life, String text) {
        if (effects.size >= EFFECT_LIMIT) effects.removeIndex(0);
        Effect effect = new Effect();
        effect.x = x;
        effect.y = y;
        effect.color = new Color(color);
        effect.life = life;
        effect.radius = 18f;
        effect.text = text;
        effect.vx = 0f;
        effect.vy = 0f;
        effect.slash = false;
        effects.add(effect);
    }

    private void addSliceFlash(float x, float y, Color color, float angle, float radius) {
        if (effects.size >= EFFECT_LIMIT) effects.removeIndex(0);
        Effect effect = new Effect();
        effect.x = x;
        effect.y = y;
        effect.color = new Color(color);
        effect.life = 0.32f;
        effect.radius = 0f;
        effect.text = "";
        effect.vx = 0f;
        effect.vy = 0f;
        effect.slash = true;
        effect.angle = angle;
        effect.length = Math.max(118f, radius * 2.8f);
        effect.thickness = 16f;
        effects.add(effect);
    }

    private void addParticleBurst(float x, float y, Color color, int count) {
        for (int i = 0; i < count; i++) {
            if (effects.size >= EFFECT_LIMIT) effects.removeIndex(0);
            Effect effect = new Effect();
            float angle = MathUtils.random(0f, MathUtils.PI2);
            float speed = MathUtils.random(75f, 250f);
            effect.x = x + MathUtils.random(-10f, 10f);
            effect.y = y + MathUtils.random(-10f, 10f);
            effect.vx = MathUtils.cos(angle) * speed;
            effect.vy = MathUtils.sin(angle) * speed;
            effect.color = new Color(color);
            effect.life = MathUtils.random(0.26f, 0.52f);
            effect.radius = MathUtils.random(5f, 13f);
            effect.text = "";
            effect.slash = false;
            effects.add(effect);
        }
    }

    private void drawPanel(float x, float y, float width, float height, float r, float g, float b, float a) {
        drawRoundPanel(x, y, width, height, 24f, new Color(r, g, b, a), new Color(0.1f, 0.76f, 0.95f, 0.22f));
    }

    private void drawButton(Rectangle rect, String text, Color fill, Color textColor) {
        drawRoundPanel(rect.x, rect.y, rect.width, rect.height, Math.min(18f, rect.height * 0.34f), fill, new Color(0.1f, 0.86f, 1f, 0.36f));
        batch.begin();
        BitmapFont buttonFont = rect.height <= 46f ? smallFont : font;
        drawCentered(buttonFont, text, rect.x + rect.width * 0.5f, rect.y + rect.height * 0.60f, textColor);
        batch.end();
    }

    private void drawRoundPanel(float x, float y, float width, float height, float radius, Color fillColor, Color borderColor) {
        shapes.begin(ShapeRenderer.ShapeType.Filled);
        if (borderColor.a > 0f) {
            shapes.setColor(borderColor);
            drawRoundedRect(x, y, width, height, radius);
            shapes.setColor(fillColor);
            drawRoundedRect(x + 2f, y + 2f, width - 4f, height - 4f, Math.max(0f, radius - 2f));
        } else {
            shapes.setColor(fillColor);
            drawRoundedRect(x, y, width, height, radius);
        }
        shapes.end();
    }

    private void drawProgress(float x, float y, float width, float height, float pct) {
        shapes.begin(ShapeRenderer.ShapeType.Filled);
        shapes.setColor(0f, 0f, 0f, 0.48f);
        drawRoundedRect(x, y, width, height, height * 0.5f);
        shapes.setColor(0.12f, 0.95f, 1f, 0.92f);
        drawRoundedRect(x, y, width * MathUtils.clamp(pct, 0f, 1f), height, height * 0.5f);
        shapes.end();
    }

    private void drawRoundedRect(float x, float y, float width, float height, float radius) {
        float r = Math.min(radius, Math.min(width, height) * 0.5f);
        shapes.rect(x + r, y, width - 2f * r, height);
        shapes.rect(x, y + r, width, height - 2f * r);
        shapes.circle(x + r, y + r, r);
        shapes.circle(x + width - r, y + r, r);
        shapes.circle(x + r, y + height - r, r);
        shapes.circle(x + width - r, y + height - r, r);
    }

    private void drawText(BitmapFont bitmapFont, String text, float x, float y, Color color) {
        bitmapFont.setColor(color);
        bitmapFont.draw(batch, text, x, y);
    }

    private void drawCentered(BitmapFont bitmapFont, String text, float centerX, float baselineY, Color color) {
        glyph.setText(bitmapFont, text);
        bitmapFont.setColor(color);
        bitmapFont.draw(batch, text, centerX - glyph.width / 2f, baselineY);
    }

    private void drawCenteredShadow(BitmapFont bitmapFont, String text, float centerX, float baselineY, Color color) {
        glyph.setText(bitmapFont, text);
        bitmapFont.setColor(0f, 0f, 0f, 0.64f);
        bitmapFont.draw(batch, text, centerX - glyph.width / 2f + 2f, baselineY - 2f);
        bitmapFont.setColor(color);
        bitmapFont.draw(batch, text, centerX - glyph.width / 2f, baselineY);
    }

    private Texture loadTexturePath(String path) {
        try {
            Texture texture = new Texture(Gdx.files.internal(path));
            texture.setFilter(Texture.TextureFilter.Linear, Texture.TextureFilter.Linear);
            Gdx.app.log("ShadowExtraction", "Loaded texture " + path);
            return texture;
        } catch (Exception error) {
            Gdx.app.log("ShadowExtraction", "Texture load failed " + path + " :: " + error.getMessage());
            return null;
        }
    }

    private Texture loadTextureByPrefix(String prefix) {
        try {
            FileHandle dir = Gdx.files.internal("public/assets");
            for (FileHandle file : dir.list()) {
                if (!file.name().startsWith(prefix)) continue;
                Texture texture = new Texture(file);
                texture.setFilter(Texture.TextureFilter.Linear, Texture.TextureFilter.Linear);
                return texture;
            }
        } catch (Exception ignored) {
            // Android AssetManager can fail directory listing for compressed assets.
        }
        String[] knownAssets = {
            "public/assets/game-shadow-extraction-6b88iFKQ.jpg",
            "public/assets/solo-purple-citadel-lM3Ei9YB.jpg",
            "public/assets/monster-abyss-mage-wraith-CUBlAJUR.png",
            "public/assets/relic-monarch-heart-BzxGMe-W.png",
            "assets/public/assets/game-shadow-extraction-6b88iFKQ.jpg",
            "assets/public/assets/solo-purple-citadel-lM3Ei9YB.jpg",
            "assets/public/assets/monster-abyss-mage-wraith-CUBlAJUR.png",
            "assets/public/assets/relic-monarch-heart-BzxGMe-W.png"
        };
        for (String path : knownAssets) {
            String name = path.substring(path.lastIndexOf('/') + 1);
            if (!name.startsWith(prefix)) continue;
            try {
                FileHandle file = Gdx.files.internal(path);
                Texture texture = new Texture(file);
                texture.setFilter(Texture.TextureFilter.Linear, Texture.TextureFilter.Linear);
                Gdx.app.log("ShadowExtraction", "Loaded texture " + path);
                return texture;
            } catch (Exception error) {
                Gdx.app.log("ShadowExtraction", "Texture load failed " + path + " :: " + error.getMessage());
            }
        }
        return null;
    }

    private void drawCover(Texture texture, float x, float y, float width, float height) {
        float sourceW = texture.getWidth();
        float sourceH = texture.getHeight();
        float sourceAspect = sourceW / sourceH;
        float targetAspect = width / height;
        float drawW = width;
        float drawH = height;
        float drawX = x;
        float drawY = y;
        if (sourceAspect > targetAspect) {
            drawW = height * sourceAspect;
            drawX = x - (drawW - width) * 0.5f;
        } else {
            drawH = width / sourceAspect;
            drawY = y - (drawH - height) * 0.5f;
        }
        batch.draw(texture, drawX, drawY, drawW, drawH);
    }

    private BitmapFont createSystemFont(int size, boolean condensed, float fallbackScale) {
        String[] paths = condensed
            ? new String[]{
                "/system/fonts/RobotoCondensed-Bold.ttf",
                "/system/fonts/Roboto-Bold.ttf",
                "/system/fonts/NotoSans-Bold.ttf",
                "/system/fonts/DroidSans-Bold.ttf"
            }
            : new String[]{
                "/system/fonts/Roboto-Bold.ttf",
                "/system/fonts/NotoSans-Bold.ttf",
                "/system/fonts/DroidSans-Bold.ttf"
            };
        for (String path : paths) {
            try {
                FileHandle file = Gdx.files.absolute(path);
                if (!file.exists()) continue;
                FreeTypeFontGenerator generator = new FreeTypeFontGenerator(file);
                FreeTypeFontGenerator.FreeTypeFontParameter parameter = new FreeTypeFontGenerator.FreeTypeFontParameter();
                parameter.size = size;
                parameter.color = Color.WHITE;
                parameter.borderColor = new Color(0f, 0f, 0f, 0.56f);
                parameter.borderWidth = size >= 32 ? 1.6f : 1.0f;
                parameter.shadowOffsetX = 1;
                parameter.shadowOffsetY = 1;
                parameter.shadowColor = new Color(0f, 0f, 0f, 0.52f);
                parameter.minFilter = Texture.TextureFilter.Linear;
                parameter.magFilter = Texture.TextureFilter.Linear;
                BitmapFont generated = generator.generateFont(parameter);
                generator.dispose();
                return generated;
            } catch (Exception error) {
                Gdx.app.log("ShadowExtraction", "Font load failed " + path + " :: " + error.getMessage());
            }
        }
        BitmapFont fallback = new BitmapFont();
        fallback.getData().setScale(fallbackScale);
        return fallback;
    }

    private float smooth(float value) {
        float t = MathUtils.clamp(value, 0f, 1f);
        return t * t * (3f - 2f * t);
    }

    private Color colorFor(Kind kind) {
        switch (kind) {
            case DECOY: return new Color(0.55f, 0.3f, 0.95f, 1f);
            case BOMB: return new Color(1f, 0.12f, 0.16f, 1f);
            case GOLD: return new Color(1f, 0.75f, 0.12f, 1f);
            case HEART: return new Color(1f, 0.25f, 0.56f, 1f);
            case TIME: return new Color(0.35f, 0.9f, 1f, 1f);
            default: return new Color(0.28f, 0.95f, 1f, 1f);
        }
    }

    private String readyTip() {
        String[] tips = {
            "Tnij dlugim ruchem przez srodek cienia.",
            "Bomby skracaja czas. Zloto ma hitbox sztabki.",
            "Banka czasu jest bardzo rzadka i daje dodatkowe sekundy."
        };
        return tips[((int) (tipTimer / 2.4f)) % tips.length];
    }

    private String pauseTip() {
        String[] tips = {
            "Krotkie chaotyczne ruchy slabiej lapia cele.",
            "Trzymaj combo, ale nie tnij czerwonej bomby.",
            "Cele wyzej daja wiecej miejsca na pokazowy ruch."
        };
        return tips[((int) (tipTimer / 2.2f)) % tips.length];
    }

    private float distanceToSegment(float px, float py, float x1, float y1, float x2, float y2) {
        float dx = x2 - x1;
        float dy = y2 - y1;
        if (dx == 0f && dy == 0f) return Vector2.dst(px, py, x1, y1);
        float t = ((px - x1) * dx + (py - y1) * dy) / (dx * dx + dy * dy);
        t = MathUtils.clamp(t, 0f, 1f);
        return Vector2.dst(px, py, x1 + t * dx, y1 + t * dy);
    }

    private class GameInput extends InputAdapter {
        @Override
        public boolean touchDown(int screenX, int screenY, int pointer, int button) {
            float x = screenX;
            float y = Gdx.graphics.getHeight() - screenY;
            if (phase == Phase.READY) {
                if (exitRect.contains(x, y)) host.exitGame();
                if (startRect.contains(x, y)) startRound();
                return true;
            }
            if (phase == Phase.RUNNING) {
                if (stopRect.contains(x, y)) {
                    phase = Phase.PAUSED;
                    host.setNativeState("paused");
                    return true;
                }
                slicing = true;
                lastX = x;
                lastY = y;
                trail.clear();
                trail.add(new Vector2(x, y));
                handleSlice(x - 1f, y - 1f, x + 1f, y + 1f);
                return true;
            }
            if (phase == Phase.PAUSED) {
                if (continueRect.contains(x, y)) {
                    phase = Phase.RUNNING;
                    host.setNativeState("gameplay");
                } else if (resultExitRect.contains(x, y)) {
                    host.exitGame();
                }
                return true;
            }
            if (phase == Phase.FINISHED) {
                if (replayRect.contains(x, y)) startRound();
                if (resultExitRect.contains(x, y)) host.exitGame();
                return true;
            }
            return true;
        }

        @Override
        public boolean touchDragged(int screenX, int screenY, int pointer) {
            if (!slicing || phase != Phase.RUNNING) return true;
            float x = screenX;
            float y = Gdx.graphics.getHeight() - screenY;
            handleSlice(lastX, lastY, x, y);
            lastX = x;
            lastY = y;
            return true;
        }

        @Override
        public boolean touchUp(int screenX, int screenY, int pointer, int button) {
            slicing = false;
            return true;
        }
    }

    private static class Target {
        boolean active;
        Kind kind;
        float x;
        float y;
        float vx;
        float vy;
        float radius;
        float ttl;
        float maxTtl;
        float age;
        float delay;
        float rotation;
        float angularVelocity;
    }

    private static class Effect {
        float x;
        float y;
        float radius;
        float age;
        float life;
        float vx;
        float vy;
        float angle;
        float length;
        float thickness;
        boolean slash;
        String text;
        Color color;
    }

    private static class Settlement {
        final int previousBest;
        final boolean newBest;
        final int previousGameLevel;
        final int nextGameLevel;
        final int minScore;
        final int goldBefore;
        final int goldAfter;
        final int goldReward;
        final int hpBefore;
        final int hpAfter;
        final int hpLoss;
        final int hpRestored;
        final int playerLevelBefore;
        final int playerLevelAfter;
        final int xpBefore;
        final int xpAfter;
        final int xpReward;
        final boolean won;

        Settlement(int previousBest, boolean newBest, int previousGameLevel, int nextGameLevel, int minScore,
                   int goldBefore, int goldAfter, int goldReward, int hpBefore, int hpAfter, int hpLoss,
                   int hpRestored, int playerLevelBefore, int playerLevelAfter, int xpBefore, int xpAfter,
                   int xpReward, boolean won) {
            this.previousBest = previousBest;
            this.newBest = newBest;
            this.previousGameLevel = previousGameLevel;
            this.nextGameLevel = nextGameLevel;
            this.minScore = minScore;
            this.goldBefore = goldBefore;
            this.goldAfter = goldAfter;
            this.goldReward = goldReward;
            this.hpBefore = hpBefore;
            this.hpAfter = hpAfter;
            this.hpLoss = hpLoss;
            this.hpRestored = hpRestored;
            this.playerLevelBefore = playerLevelBefore;
            this.playerLevelAfter = playerLevelAfter;
            this.xpBefore = xpBefore;
            this.xpAfter = xpAfter;
            this.xpReward = xpReward;
            this.won = won;
        }
    }
}
