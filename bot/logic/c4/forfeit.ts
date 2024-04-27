import type { BinaryWinnerState, Board } from "./types";

export function forfeit(board: Board, forfeitState: BinaryWinnerState): Board {
  return {
    ...board,
    forfeitState,
  };
}
