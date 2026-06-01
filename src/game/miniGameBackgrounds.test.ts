import assert from "node:assert/strict";
import test from "node:test";
import { INITIAL_PLAYER } from "../types";
import {
  canBuyMiniGameBackground,
  createGalleryMiniGameBackground,
  getAvailableBackgroundsForGame,
  getSelectedBackgroundForGame,
  MINI_GAME_BACKGROUNDS,
  normalizeMiniGameBackgrounds,
} from "./miniGameBackgrounds";

test("mini-game backgrounds normalize ownership and default selection", () => {
  const state = normalizeMiniGameBackgrounds(undefined);
  const selected = getSelectedBackgroundForGame("shadow-extraction", state);

  assert.ok(state.ownedIds.includes("system-grid"));
  assert.equal(selected.id, "system-grid");
});

test("mini-game backgrounds expose gallery items to every game", () => {
  const gallery = createGalleryMiniGameBackground("arena.png", "data:image/png;base64,test");
  const state = normalizeMiniGameBackgrounds({
    ownedIds: [gallery.id],
    selectedByGame: { "gate-dodge": gallery.id },
    galleryBackgrounds: [gallery],
  });

  assert.equal(getSelectedBackgroundForGame("gate-dodge", state).id, gallery.id);
  assert.ok(getAvailableBackgroundsForGame("shadow-extraction", state).some((item) => item.id === gallery.id));
});

test("mini-game background purchase checks gold and ownership", () => {
  const poorPlayer = { ...INITIAL_PLAYER, gold: 0 };
  const richPlayer = { ...INITIAL_PLAYER, gold: 9999 };

  assert.equal(canBuyMiniGameBackground(poorPlayer, "dungeon-gate"), false);
  assert.equal(canBuyMiniGameBackground(richPlayer, "dungeon-gate"), true);
});

test("imported mini-game backgrounds are available as built-in shop items", () => {
  const imported = MINI_GAME_BACKGROUNDS.filter((background) => background.id.startsWith("solo-gate") || background.id.includes("city") || background.id.includes("tower"));

  assert.ok(imported.length >= 4);
  assert.ok(getAvailableBackgroundsForGame("shadow-extraction").some((background) => background.id === "solo-gate-purple"));
  assert.ok(getAvailableBackgroundsForGame("rune-lock").some((background) => background.id === "blue-moon-tower"));
});
