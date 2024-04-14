import { type Board, SlotState } from "./c4types";

export function createEmptyBoard(): Board {
  const slots = Array.from({ length: 7 }, (_, x) =>
    Array.from({ length: 6 }, (_, y) => ({
      x,
      y,
      state: SlotState.Empty,
    })),
  );

  return { slots };
}
