import { type Board, GameState, type Slot, SlotState } from "./c4types";
import { directions } from "./constants";

export function calculateWinner(board: Board): Board {
  const { slots, moveCount } = board;

  if (typeof moveCount === "number") {
    if (moveCount >= 42) {
      return {
        ...board,
        gameState: GameState.Draw,
      };
    }

    if (moveCount < 7) {
      return board;
    }
  }

  for (const direction of directions) {
    let stack: Slot[] = [];
    for (const coordinate of direction) {
      const slot = slots[coordinate.x]?.[coordinate.y];

      if (!slot) {
        continue;
      }

      if (slot.state === SlotState.Empty) {
        if (stack.length >= 4) {
          break;
        }
        stack = [];
        continue;
      }

      const last = stack.at(-1);

      if (!last) {
        stack.push(slot);
        continue;
      }

      if (last.state === slot.state) {
        stack.push(slot);
      } else {
        if (stack.length >= 4) {
          break;
        }
        stack = [slot];
      }
    }

    if (stack.length >= 4) {
      const last = stack.at(-1);
      if (!last) {
        continue;
      }

      return {
        ...board,
        gameState:
          last.state === SlotState.Red ? GameState.RedWin : GameState.YellowWin,
        winningSlots: stack,
      };
    }
  }

  return board;
}
