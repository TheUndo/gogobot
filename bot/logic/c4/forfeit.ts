import { BinaryColorState, type Board, GameState } from "./types";

export function forfeit(board: Board, forfeitState: BinaryColorState): Board {
  return {
    ...board,
    forfeitState,
    gameState:
      forfeitState === BinaryColorState.Red
        ? GameState.YellowWin
        : GameState.RedWin,
  };
}
