import type { MiniGameCompletionInput } from "../game/miniGameProgress";

export type GameResult = MiniGameCompletionInput & {
  xpReward?: number;
  goldReward?: number;
};
