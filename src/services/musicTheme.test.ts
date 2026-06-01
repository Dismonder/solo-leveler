import assert from "node:assert/strict";
import test from "node:test";
import { normalizeMusicContext, pickMusicUrl } from "./musicTheme";

test("normalizeMusicContext maps bonus to the default mini-game loop", () => {
  assert.equal(normalizeMusicContext("bonus"), "gate-dodge");
  assert.equal(normalizeMusicContext("shadow-extraction"), "shadow-extraction");
});

test("pickMusicUrl chooses the first matching track without shuffle", () => {
  const url = pickMusicUrl(
    [
      ["../assets/music/royalty-free/status-dark-ambient.mp3", "/music/status.mp3"],
      ["../assets/music/royalty-free/gate-dodge-heavy-battle-2.ogg", "/music/battle.ogg"],
    ],
    "status",
    false
  );

  assert.equal(url, "/music/status.mp3");
});

test("pickMusicUrl returns null when no context track exists", () => {
  const url = pickMusicUrl([["../assets/music/royalty-free/gate-dodge-heavy-battle-2.ogg", "/music/battle.ogg"]], "mana-memory", false);
  assert.equal(url, null);
});

test("pickMusicUrl supports deterministic shuffle", () => {
  const url = pickMusicUrl(
    [
      ["../assets/music/royalty-free/gate-dodge-heavy-battle-2.ogg", "/music/gate-a.ogg"],
      ["../assets/music/royalty-free/gate-dodge-heavy-battle-3.ogg", "/music/gate-b.ogg"],
    ],
    "gate-dodge",
    true,
    () => 0.99
  );

  assert.equal(url, "/music/gate-b.ogg");
});

test("pickMusicUrl prefers context-specific names over generic battle tracks", () => {
  const url = pickMusicUrl(
    [
      ["../assets/music/royalty-free/gate-dodge-heavy-battle-2.ogg", "/music/gate.ogg"],
      ["../assets/music/royalty-free/shadow-extraction-heavy-battle-2.mp3", "/music/shadow.mp3"],
    ],
    "shadow-extraction",
    false
  );

  assert.equal(url, "/music/shadow.mp3");
});
