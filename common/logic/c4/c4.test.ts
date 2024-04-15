import { describe, expect, it } from "bun:test";
import { type Board, GameState, SlotState } from "./c4types";
import { calculateWinner } from "./calculateWinner";
import { createEmptyBoard } from "./createEmptyBoard";
import { mergeBoards } from "./mergeBoards";
import { renderBoard } from "./renderBoard";

describe("connect 4 calculate winner", () => {
  it("should calculate horizontal winner", () => {
    const board: Board = mergeBoards(createEmptyBoard(), {
      slots: [
        [
          { x: 0, y: 0, state: SlotState.Red },
          { x: 1, y: 0, state: SlotState.Red },
          { x: 2, y: 0, state: SlotState.Red },
          { x: 3, y: 0, state: SlotState.Red },
          { x: 4, y: 0, state: SlotState.Red },
          { x: 5, y: 0, state: SlotState.Red },
        ],
      ],
    });

    const result = calculateWinner(board);
    expect(result.gameState).toBe(GameState.RedWin);
    expect(result.winningSlots).toEqual([
      { x: 0, y: 0, state: SlotState.Red },
      { x: 1, y: 0, state: SlotState.Red },
      { x: 2, y: 0, state: SlotState.Red },
      { x: 3, y: 0, state: SlotState.Red },
      { x: 4, y: 0, state: SlotState.Red },
      { x: 5, y: 0, state: SlotState.Red },
    ]);
  });

  it("should calculate vertical winner", () => {
    const board: Board = mergeBoards(createEmptyBoard(), {
      slots: [
        [
          { x: 0, y: 0, state: SlotState.Red },
          { x: 0, y: 1, state: SlotState.Red },
          { x: 0, y: 2, state: SlotState.Red },
          { x: 0, y: 3, state: SlotState.Red },
        ],
      ],
    });

    expect(calculateWinner(board).gameState).toBe(GameState.RedWin);
  });

  it("should calculate diagonal winner", async () => {
    const board: Board = mergeBoards(createEmptyBoard(), {
      slots: [
        [
          { x: 0, y: 0, state: SlotState.Red },
          { x: 1, y: 1, state: SlotState.Red },
          { x: 2, y: 2, state: SlotState.Red },
          { x: 3, y: 3, state: SlotState.Red },
          { x: 4, y: 4, state: SlotState.Red },
        ],
      ],
    });

    const result = calculateWinner(board);

    expect(result.gameState).toBe(GameState.RedWin);
    expect(result.winningSlots).toEqual([
      { x: 0, y: 0, state: SlotState.Red },
      { x: 1, y: 1, state: SlotState.Red },
      { x: 2, y: 2, state: SlotState.Red },
      { x: 3, y: 3, state: SlotState.Red },
      { x: 4, y: 4, state: SlotState.Red },
    ]);
  });

  it("should calculate left diagonal winner", async () => {
    const board: Board = mergeBoards(createEmptyBoard(), {
      slots: [
        [
          { x: 3, y: 0, state: SlotState.Red },
          { x: 2, y: 1, state: SlotState.Red },
          { x: 1, y: 2, state: SlotState.Red },
          { x: 0, y: 3, state: SlotState.Red },
        ],
      ],
    });

    await renderBoard(
      calculateWinner(
        mergeBoards(createEmptyBoard(), {
          slots: [
            [
              { x: 0, y: 0, state: SlotState.Red },
              { x: 0, y: 1, state: SlotState.Red },
              { x: 0, y: 2, state: SlotState.Red },
              { x: 0, y: 3, state: SlotState.Red },
              { x: 0, y: 4, state: SlotState.Red },
              { x: 0, y: 5, state: SlotState.Red },
            ],
          ],
        }),
      ),
    );

    expect(calculateWinner(board).gameState).toBe(GameState.RedWin);
  });

  it("should calculate no winner", () => {
    const board: Board = createEmptyBoard();

    expect(calculateWinner(board).gameState).toBe(GameState.RedTurn);
  });
});
