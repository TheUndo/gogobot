import { client } from "!/bot/client";
import { connect4display } from "!/bot/interactions/commands/connect4/connect4display";
import { prisma } from "!/core/db/prisma";
import { z } from "zod";
import { createWallet } from "../economy/createWallet";
import { outOfTime } from "./outOfTime";
import { BinaryColorState, type Board, GameState } from "./types";

type Options = {
  gameId: string;
  board: Board;
};

/** game ID to timeout */
export const connect4TimeoutsStore = new Map<string, Timer>();

/**
 * Handles out of time game state.
 * Makes DB side effects.
 */
export async function handleOutOfTime({
  board,
  gameId,
}: Options): Promise<void> {
  const outOfTimeBoard = outOfTime(board);

  const game = await prisma.connect4Game.update({
    where: {
      id: gameId,
    },
    data: {
      board: JSON.stringify(outOfTimeBoard),
      gameState: outOfTimeBoard.gameState,
      endedAt: new Date(),
    },
  });

  clearTimeout(connect4TimeoutsStore.get(gameId));
  connect4TimeoutsStore.delete(gameId);

  if (game.wagerAmount) {
    const winnerId =
      z.nativeEnum(BinaryColorState).parse(game.challengerColor) ===
        BinaryColorState.Red && outOfTimeBoard.gameState === GameState.RedWin
        ? game.challenger
        : game.opponent;

    const wallet = await createWallet(winnerId, game.guildId);

    await prisma.wallet.update({
      where: {
        id: wallet.id,
      },
      data: {
        balance: {
          increment: game.wagerAmount * 2n,
        },
      },
    });
  }

  await client.channels
    .fetch(game.channelId)
    .then((channel) => {
      if (channel?.isTextBased()) {
        return channel.messages.fetch(game.lastMessageId);
      }
    })
    .then(async (message) => {
      if (!message) {
        return;
      }

      return message.edit(await connect4display(gameId));
    })
    .catch(console.error);
}
