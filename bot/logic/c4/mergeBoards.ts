import { type Board, Column } from "./types";

export function mergeBoards(baseBoard: Board, overridingBoard: Board): Board {
  return {
    ...baseBoard,
    moves: Array.from({
      length: overridingBoard.slots.flat(1).length,
    }).map(() => Column.A),
    slots: baseBoard.slots.map((row, x) => {
      return row.map((slot, y) => {
        const correspondingSlot = overridingBoard.slots
          .flat(1)
          .find((s) => s.x === x && s.y === y);

        if (!correspondingSlot) {
          return slot;
        }

        return {
          x,
          y,
          state: correspondingSlot.state,
        };
      });
    }),
  };
}
