import assert from "node:assert/strict";
import test from "node:test";
import { selectActiveRefreshRate } from "./refreshRateStatus";

test("active refresh rate wins over a higher supported mode", () => {
  assert.equal(selectActiveRefreshRate({ currentRefreshRate: 60, refreshRate: 120 }), 60);
  assert.equal(selectActiveRefreshRate({ currentRefreshRate: 120, refreshRate: 60 }), 120);
  assert.equal(selectActiveRefreshRate({ currentRefreshRate: 0, refreshRate: 90 }), 90);
  assert.equal(selectActiveRefreshRate({ currentRefreshRate: Number.NaN, refreshRate: -1 }), 0);
});
