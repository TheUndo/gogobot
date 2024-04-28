import { handleOutOfTime } from "!/bot/logic/c4/handleOutOfTime";
import { boardSchema } from "!/bot/logic/c4/types";
import { prisma } from "!/core/db/prisma";

/**
 * Used to clear up any out of time games if for some reason the
 * setTimeout doesn't work. This is a last resort.
 * */
export async function connect4timer() {
  const games = await prisma.connect4Game.findMany({
    where: {
      endedAt: null,
    },
  });

  if (games.length > 300) {
    console.warn(
      "More than 300 games are running. This is probably a problem.",
    );
  }

  if (!games.length) {
    return;
  }

  for (const game of games) {
    const board = boardSchema.safeParse(JSON.parse(game.board));

    if (!board.success) {
      console.error("Failed to parse board", board.error);
      continue;
    }

    const now = new Date();
    const timeSinceLastMove = now.getTime() - game.lastMoveAt.getTime();

    if (timeSinceLastMove < game.moveTime * 1000) {
      continue;
    }

    console.log("Game out of time", game.id);
    await handleOutOfTime({
      board: board.data,
      gameId: game.id,
    });
  }
}
