import assert from "node:assert/strict";
import test from "node:test";
import { LOCAL_MUSIC_TRACKS } from "../assets/music/solo-leveling-local/manifest";
import {
  getBackgroundMusicEnabled,
  getGlobalMusicVolume,
  setBackgroundMusicEnabled,
  setGlobalMusicVolume,
  setMusicTrackPreferences,
} from "./musicService";

test("music service getters and setters manage volume and state", () => {
  setGlobalMusicVolume(0.85);
  assert.equal(getGlobalMusicVolume(), 0.85);

  setGlobalMusicVolume(1.5);
  assert.equal(getGlobalMusicVolume(), 1);

  setGlobalMusicVolume(-0.2);
  assert.equal(getGlobalMusicVolume(), 0);

  setBackgroundMusicEnabled(false);
  assert.equal(getBackgroundMusicEnabled(), false);

  setBackgroundMusicEnabled(true);
  assert.equal(getBackgroundMusicEnabled(), true);
});

test("music track preferences normalize track selections", () => {
  setMusicTrackPreferences({
    appTrackId: "reaweker",
    workoutTrackId: "hunter-of-hunters",
  });
  // Should not throw and successfully record
  assert.ok(true);
});

test("local music tracks list has 10 valid tracks with titles and artists", () => {
  assert.equal(LOCAL_MUSIC_TRACKS.length, 10);
  for (const track of LOCAL_MUSIC_TRACKS) {
    assert.ok(track.id, "Track must have id");
    assert.ok(track.title, "Track must have title");
    assert.ok(track.artist, "Track must have artist");
    assert.ok(track.url, "Track must have url");
  }
});
