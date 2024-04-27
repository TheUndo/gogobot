import { checkColumn } from "./checkColumn";
import { type Board, type Column, GameState, SlotState } from "./types";

export const columnFullMessage = "This column is full.";

export function makeMove(
  board: Board,
  column: Column,
):
  | {
      error: string;
    }
  | Board {
  const availableSlot = checkColumn(board, column);

  if ("error" in availableSlot) {
    return availableSlot;
  }

  const { columnIndex, slotIndex } = availableSlot;

  const moves = [...(board.moves ?? []), column] satisfies Column[];

  return {
    ...board,
    moves,
    gameState:
      board.gameState === GameState.RedTurn
        ? GameState.YellowTurn
        : GameState.RedTurn,
    slots: board.slots.map((column, i) => {
      if (i !== columnIndex) {
        return column;
      }

      return column.map((slot, j) => {
        if (j !== slotIndex) {
          return slot;
        }

        return {
          ...slot,
          state:
            board.gameState === GameState.RedTurn
              ? SlotState.Red
              : SlotState.Yellow,
        };
      });
    }),
  };
}
