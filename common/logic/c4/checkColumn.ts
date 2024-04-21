import { type Board, Column, SlotState } from "./c4types";
import { columnFullMessage } from "./makeMove";

export function checkColumn(
  board: Board,
  column: Column,
):
  | {
      error: string;
    }
  | {
      slotIndex: number;
      columnIndex: number;
    } {
  const columnIndex = Object.values(Column).indexOf(column);
  if (columnIndex === -1) {
    return {
      error: "Invalid column.",
    };
  }
  const boardColumn = board.slots.at(columnIndex);

  if (!boardColumn) {
    return {
      error: "Invalid column.",
    };
  }

  const slotIndex = (() => {
    for (let i = boardColumn.length - 1; i >= 0; i--) {
      if (boardColumn.at(i)?.state === SlotState.Empty) {
        return i;
      }
    }
    return null;
  })();

  if (slotIndex == null) {
    return {
      error: columnFullMessage,
    };
  }

  return {
    slotIndex,
    columnIndex,
  };
}
