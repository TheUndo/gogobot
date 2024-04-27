import { BinaryWinnerState, type Board, GameState } from "./types";

export function outOfTime(board: Board): Board {
  if (
    board.gameState &&
    ![GameState.RedTurn, GameState.YellowTurn].includes(board.gameState)
  ) {
    return board;
  }
  return {
    ...board,
    gameState:
      board.gameState === GameState.RedTurn
        ? GameState.YellowWin
        : GameState.RedWin,
    outOfTime:
      board.gameState === GameState.RedTurn
        ? BinaryWinnerState.Red
        : BinaryWinnerState.Yellow,
  };
}
