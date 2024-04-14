import type { Board } from "./c4types";

export function mergeBoards(baseBoard: Board, overridingBoard: Board) {
  return {
    ...overridingBoard,
    slots: baseBoard.slots.map((row, x) => {
      const correspondingRow = overridingBoard.slots[x];

      if (!correspondingRow) {
        return row;
      }

      return row.map((slot, y) => {
        const correspondingSlot = correspondingRow[y];

        if (!correspondingSlot) {
          return slot;
        }

        return {
          x: slot.x,
          y: slot.y,
          state: correspondingSlot.state,
        };
      });
    }),
  };
}
