import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";
import {
  DEFAULT_MUSIC_BY_CONTEXT,
  DEFAULT_MINI_GAME_MUSIC,
  LOCAL_MUSIC_TRACKS,
  getLocalMusicTrack,
} from "../assets/music/solo-leveling-local/manifest";
import { getBundledThemeMusicCount, getThemeMusicUrl } from "./systemThemeAssets";

test("local music manifest points to bundled mp3 files", () => {
  assert.equal(LOCAL_MUSIC_TRACKS.length, 10);
  for (const track of LOCAL_MUSIC_TRACKS) {
    assert.ok(existsSync(join(process.cwd(), "src", "assets", "music", "solo-leveling-local", track.fileName)), track.fileName);
  }
});

test("auto music mapping covers app, workout and mini-game contexts", () => {
  assert.equal(getLocalMusicTrack(DEFAULT_MUSIC_BY_CONTEXT.status).id, "symphonic-suite-lv1");
  assert.equal(getLocalMusicTrack(DEFAULT_MUSIC_BY_CONTEXT["workout-session"]).id, "reaweker");
  assert.equal(getLocalMusicTrack(DEFAULT_MINI_GAME_MUSIC["gate-dodge"]).id, "hunter-of-hunters");
  assert.equal(getLocalMusicTrack(DEFAULT_MINI_GAME_MUSIC["shadow-extraction"]).id, "shadowborn");
});

test("theme music resolver exposes local tracks to the UI", () => {
  assert.equal(getBundledThemeMusicCount(), 10);
  assert.match(getThemeMusicUrl("status") || "", /symphonic-suite-lv1\.mp3/);
  assert.match(getThemeMusicUrl("shadow-extraction") || "", /shadowborn\.mp3/);
});
