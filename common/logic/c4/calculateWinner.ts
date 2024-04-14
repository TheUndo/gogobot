import { type Board, type Slot, SlotState } from "./c4types";

export function calculateWinner(board: Board): SlotState {
  const { slots } = board;
  /** all horizontal columns of the connect 4 board */
  const columns: Slot[][] = slots;

  /** all vertical columns of the connect 4 board */
  const rows: Slot[][] = Array.from({ length: 6 }, (_, i) =>
    slots.map((row) => {
      const slot = row[i];
      if (!slot) {
        throw new Error("Invalid slot");
      }
      return slot;
    }),
  );

  /** all diagonals of the connect 4 board */
  const diagonals: Slot[][] = (() => {
    const result: Slot[][] = [];

    for (let i = -3; i < 4; i++) {
      const diagonal: Slot[] = [];
      for (let j = 0; j < 6; j++) {
        const x = i + j;
        if (x < 0 || x >= 7) {
          continue;
        }
        const slot = slots[j]?.[x];
        if (!slot) {
          continue;
        }
        diagonal.push(slot);
      }
      result.push(diagonal);
    }

    return result;
  })();

  const allLines = [...columns, ...rows, ...diagonals];

  for (const line of allLines) {
    for (let i = 0; i < line.length - 3; i++) {
      const [first, second, third, fourth] = line.slice(i, i + 4);
      if (
        first &&
        first.state !== SlotState.Empty &&
        first?.state === second?.state &&
        first?.state === third?.state &&
        first?.state === fourth?.state
      ) {
        return first.state;
      }
    }
  }
  return SlotState.Empty;
}
