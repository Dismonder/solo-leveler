import assert from "node:assert/strict";
import test from "node:test";
import { getShadowExtractionObjectBudget } from "./miniGamePerformance";

test("shadow extraction uses the exact normal and pressured object budgets", () => {
  assert.deepEqual(
    [
      [getShadowExtractionObjectBudget("performance", false), getShadowExtractionObjectBudget("performance", true)],
      [getShadowExtractionObjectBudget("balanced", false), getShadowExtractionObjectBudget("balanced", true)],
      [getShadowExtractionObjectBudget("cinematic", false), getShadowExtractionObjectBudget("cinematic", true)],
    ],
    [
      [7, 5],
      [9, 6],
      [10, 7],
    ],
  );
});
