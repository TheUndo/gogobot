import type { Board } from "./c4types";

export function mergeBoards(baseBoard: Board, overridingBoard: Board) {
  return {
    ...baseBoard,
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
