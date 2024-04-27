import { describe, expect, it } from "bun:test";
import { createEmptyBoard } from "../createEmptyBoard";
import { makeMove } from "../makeMove";
import { columnFullMessage } from "../makeMove";
import { type Board, Column, SlotState } from "../types";

describe("connect 4 make move", () => {
  it("should make a move", () => {
    const board = createEmptyBoard();

    const result = makeMove(board, Column.A);

    // @ts-expect-error
    expect(result.error).toBeUndefined();

    // @ts-expect-error
    expect(result.slots.at(0).at(-1).state).toBe(SlotState.Red);
  });

  it("gravity should work", () => {
    const board = createEmptyBoard();

    const move1board = makeMove(board, Column.A);
    // @ts-expect-error
    expect(move1board.error).toBeUndefined();

    // @ts-expect-error
    const move2board = makeMove(move1board, Column.A);
    // @ts-expect-error
    expect(move2board.error).toBeUndefined();

    // @ts-expect-error
    expect(move2board.slots.at(0).at(-1)?.state).toBe(SlotState.Red);
    // @ts-expect-error
    expect(move2board.slots.at(0).at(-2)?.state).toBe(SlotState.Yellow);
  });

  it("should not allow moves on full columns", () => {
    const board = createEmptyBoard();

    const boardAfterMoves = Array.from({ length: 6 }).reduce<Board>((b) => {
      const res = makeMove(b, Column.A);
      if ("error" in res) {
        throw new Error("Unexpected error");
      }
      return res;
    }, board);

    // @ts-expect-error
    expect(boardAfterMoves.error).toBeUndefined();

    const result = makeMove(boardAfterMoves, Column.A);

    // @ts-expect-error
    expect(result.error).toBe(columnFullMessage);
  });
});
