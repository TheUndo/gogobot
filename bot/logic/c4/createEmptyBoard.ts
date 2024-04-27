import { type Board, GameState, SlotState } from "./types";

export function createEmptyBoard(
  turn?: SlotState.Yellow | SlotState.Red,
): Board {
  const slots = Array.from({ length: 7 }, (_, x) =>
    Array.from({ length: 6 }, (_, y) => ({
      x,
      y,
      state: SlotState.Empty,
    })),
  );

  return {
    slots,
    gameState:
      turn === SlotState.Yellow ? GameState.YellowTurn : GameState.RedTurn,
  };
}
