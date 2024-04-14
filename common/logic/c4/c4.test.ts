import { expect, describe, it } from "bun:test";
import { SlotState, type Board } from "./c4types";
import { calculateWinner } from "./calculateWinner";
import { mergeBoards } from "./mergeBoards";
import { createEmptyBoard } from "./createEmptyBoard";

describe("connect 4 calculate winner", () => {
  it("should calculate horizontal winner", () => {
    const board: Board = mergeBoards(createEmptyBoard(), {
      slots: [
        [
          { x: 0, y: 0, state: SlotState.Red },
          { x: 1, y: 0, state: SlotState.Red },
          { x: 2, y: 0, state: SlotState.Red },
          { x: 3, y: 0, state: SlotState.Red },
        ],
      ],
    });

    expect(calculateWinner(board)).toBe(SlotState.Red);
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

    expect(calculateWinner(board)).toBe(SlotState.Red);
  });

  it("should calculate diagonal winner", () => {
    const board: Board = mergeBoards(createEmptyBoard(), {
      slots: [
        [
          { x: 0, y: 0, state: SlotState.Red },
          { x: 1, y: 1, state: SlotState.Red },
          { x: 2, y: 2, state: SlotState.Red },
          { x: 3, y: 3, state: SlotState.Red },
        ],
      ],
    });

    expect(calculateWinner(board)).toBe(SlotState.Red);
  });

  it("should calculate no winner", () => {
    const board: Board = createEmptyBoard();

    expect(calculateWinner(board)).toBe(SlotState.Empty);
  });
});
