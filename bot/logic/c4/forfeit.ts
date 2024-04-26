import type { Board, ForfeitState } from "./c4types";

export function forfeit(board: Board, forfeitState: ForfeitState): Board {
  return {
    ...board,
    forfeitState,
  };
}
