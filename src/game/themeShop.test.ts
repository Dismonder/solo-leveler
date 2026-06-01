import assert from "node:assert/strict";
import test from "node:test";
import {
  REQUIRED_THEME_VARS,
  THEME_EFFECT_DEFINITIONS,
  THEME_WALLPAPER_DEFINITIONS,
  applyThemeToDocument,
  canBuyThemeEffect,
  canBuyThemeWallpaper,
  getCompleteThemeVars,
  getThemeEffectDefinition,
  getThemeDefinition,
  getThemeWallpaperDefinition,
  normalizeOwnedThemeEffects,
  normalizeOwnedThemeWallpapers,
  normalizeOwnedThemes,
  THEME_DEFINITIONS,
} from "./themeShop";
import { INITIAL_PLAYER, type PlayerState } from "../types";

test("theme shop keeps only known themes and always owns system dark", () => {
  assert.deepEqual(normalizeOwnedThemes(["system-blue", "unknown"]), ["system-dark", "system-blue"]);
  assert.deepEqual(normalizeOwnedThemes(undefined), ["system-dark"]);
});

test("theme effect shop keeps a free none option and exposes buyable ambient effects", () => {
  assert.deepEqual(normalizeOwnedThemeEffects(["monarch-code", "bad"]), ["none", "monarch-code"]);
  assert.deepEqual(normalizeOwnedThemeEffects(undefined), ["none"]);
  assert.ok(THEME_EFFECT_DEFINITIONS.some((effect) => effect.id === "monarch-code" && effect.cost > 0));
  assert.equal(getThemeEffectDefinition("unknown").id, "none");

  const player: PlayerState = {
    ...INITIAL_PLAYER,
    gold: 900,
    settings: {
      ...INITIAL_PLAYER.settings,
      ownedThemeEffectIds: ["none"],
      activeThemeEffectId: "none",
    },
  };
  assert.equal(canBuyThemeEffect(player, "monarch-code"), true);
  assert.equal(canBuyThemeEffect(player, "none"), false);
});

test("theme wallpaper shop normalizes imported background ownership", () => {
  assert.deepEqual(normalizeOwnedThemeWallpapers(["shadow-citadel-purple", "bad"]), [
    "none",
    "solo-purple-citadel",
    "shadow-citadel-purple",
  ]);
  assert.equal(getThemeWallpaperDefinition("unknown").id, "none");
  assert.ok(THEME_WALLPAPER_DEFINITIONS.some((wallpaper) => wallpaper.id === "solo-purple-citadel" && wallpaper.asset));

  const player: PlayerState = {
    ...INITIAL_PLAYER,
    gold: 500,
    settings: {
      ...INITIAL_PLAYER.settings,
      ownedThemeWallpaperIds: ["none", "solo-purple-citadel"],
      activeWallpaperId: "none",
    },
  };

  assert.equal(canBuyThemeWallpaper(player, "shadow-citadel-purple"), true);
  assert.equal(canBuyThemeWallpaper(player, "solo-purple-citadel"), false);
});

test("theme definitions expose css variables for visible UI changes", () => {
  for (const theme of THEME_DEFINITIONS) {
    const completeVars = getCompleteThemeVars(theme);
    for (const variable of REQUIRED_THEME_VARS) {
      assert.ok(completeVars[variable], `${theme.id} ${variable}`);
    }
    assert.ok(theme.previewGradient.includes("gradient"), theme.id);
  }
});

test("system light theme uses bright surfaces and dark readable text", () => {
  const completeVars = getCompleteThemeVars(getThemeDefinition("system-light"));

  assert.equal(completeVars["--theme-text"], "#0f172a");
  assert.equal(completeVars["--theme-text-strong"], "#020617");
  assert.match(completeVars["--theme-panel-gradient"], /white/);
  assert.match(completeVars["--theme-card-gradient"], /white/);
  assert.doesNotMatch(completeVars["--theme-panel-gradient"], /black/);
  assert.notEqual(completeVars["--theme-button-primary-text"], "#f8fafc");
  assert.ok(completeVars["--theme-disabled"]);
  assert.ok(completeVars["--theme-progress-track"]);
});

test("applyThemeToDocument writes root dataset and css variables", () => {
  const previousDocument = globalThis.document;
  const style = new Map<string, string>();
  const styleDeclaration = {
    get length() {
      return style.size;
    },
    item: (index: number) => Array.from(style.keys())[index] || "",
    setProperty: (key: string, value: string) => {
      style.set(key, value);
    },
    removeProperty: (key: string) => {
      style.delete(key);
      return "";
    },
  };
  Object.defineProperty(globalThis, "document", {
    configurable: true,
    value: {
      documentElement: {
        dataset: {},
        style: styleDeclaration,
      },
    } as unknown as Document,
  });

  style.set("--theme-old-custom", "bad");
  applyThemeToDocument("system-red");

  const theme = getThemeDefinition("system-red");
  assert.equal(globalThis.document.documentElement.dataset.theme, theme.id);
  assert.equal(style.get("--theme-accent"), theme.cssVars["--theme-accent"]);
  assert.equal(style.has("--theme-old-custom"), false);

  Object.defineProperty(globalThis, "document", {
    configurable: true,
    value: previousDocument,
  });
});
