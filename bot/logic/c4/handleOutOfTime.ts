import { prisma } from "!/core/db/prisma";
import { outOfTime } from "./outOfTime";
import type { Board } from "./types";

type Options = {
  gameId: string;
  board: Board;
};

/**
 * Handles out of time game state.
 * Makes DB side effects.
 */
export async function handleOutOfTime({
  board,
  gameId,
}: Options): Promise<void> {
  const outOfTimeBoard = outOfTime(board);

  await prisma.connect4Game.update({
    where: {
      id: gameId,
    },
    data: {
      board: JSON.stringify(outOfTimeBoard),
      gameState: outOfTimeBoard.gameState,
      endedAt: new Date(),
    },
  });
}
