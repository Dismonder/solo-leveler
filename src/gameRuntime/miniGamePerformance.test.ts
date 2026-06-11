import assert from "node:assert/strict";
import test from "node:test";
import {
  getShadowExtractionImpactBudget,
  getShadowExtractionImpactLifetimeMs,
  getShadowExtractionObjectBudget,
} from "./miniGamePerformance";

test("shadow extraction keeps richer budgets in cinematic mode", () => {
  assert.ok(getShadowExtractionObjectBudget("cinematic", false) > getShadowExtractionObjectBudget("balanced", false));
  assert.ok(getShadowExtractionImpactBudget("cinematic", false) > getShadowExtractionImpactBudget("balanced", false));
  assert.ok(getShadowExtractionImpactLifetimeMs("cinematic", false) > getShadowExtractionImpactLifetimeMs("balanced", false));
});

test("shadow extraction pressure budgets reduce work without disabling feedback", () => {
  assert.ok(getShadowExtractionObjectBudget("balanced", true) < getShadowExtractionObjectBudget("balanced", false));
  assert.ok(getShadowExtractionImpactBudget("balanced", true) >= 1);
  assert.ok(getShadowExtractionImpactLifetimeMs("balanced", true) >= 340);
});
