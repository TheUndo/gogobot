import { checkColumn } from "!/bot/logic/c4/checkColumn";
import { determineWinnerOptimized } from "!/bot/logic/c4/determineWinner";
import { forfeit } from "!/bot/logic/c4/forfeit";
import {
  connect4TimeoutsStore,
  handleOutOfTime,
} from "!/bot/logic/c4/handleOutOfTime";
import { makeMove } from "!/bot/logic/c4/makeMove";
import {
  BinaryColorState,
  Column,
  GameState,
  SlotState,
  boardSchema,
} from "!/bot/logic/c4/types";
import { createWallet } from "!/bot/logic/economy/createWallet";
import type { AnyInteraction, InteractionContext } from "!/bot/types";
import { prisma } from "!/core/db/prisma";
import { sprintf } from "sprintf-js";
import { z } from "zod";
import { connect4interactionContext } from "./connect4config";
import { connect4display } from "./connect4display";

export async function connect4move(
  interactionContext: InteractionContext,
  interaction: AnyInteraction,
): Promise<void> {
  if (!interaction.isStringSelectMenu()) {
    return void (await interaction.reply({
      ephemeral: true,
      content: "This interaction is only available as string menu select.",
    }));
  }

  const guildId = interaction.guildId;

  if (!guildId) {
    return void (await interaction.reply({
      ephemeral: true,
      content: "This command is only available in servers.",
    }));
  }

  const context = connect4interactionContext.safeParse(
    JSON.parse(interactionContext.payload ?? "{}"),
  );

  if (!context.success) {
    return void (await interaction.reply({
      ephemeral: true,
      content: "Invalid context. Contact developers.",
    }));
  }

  const game = await prisma.connect4Game.findUnique({
    where: {
      id: context.data.gameId,
    },
  });

  if (!game) {
    return void (await interaction.reply({
      ephemeral: true,
      content: "Game not found. Contact developers.",
    }));
  }

  const board = boardSchema.safeParse(JSON.parse(game.board));

  if (!board.success) {
    return void (await interaction.reply({
      ephemeral: true,
      content: "Failed to parse board. Contact developers.",
    }));
  }

  const rawColumn = interaction.values.at(0);

  const column = z.nativeEnum(Column).safeParse(rawColumn);

  if (!column.success) {
    return void (await interaction.reply({
      ephemeral: true,
      content: "Invalid column. Contact developers.",
    }));
  }

  const isChallenger = game.challenger === interaction.user.id;

  const challengerColor = z
    .nativeEnum(BinaryColorState)
    .safeParse(game.challengerColor);

  if (!challengerColor.success) {
    return void (await interaction.reply({
      ephemeral: true,
      content: "Failed to parse challenger color. Contact developers.",
    }));
  }

  const gameEndedPreCheck = [
    GameState.Draw,
    GameState.RedWin,
    GameState.YellowWin,
  ].includes(z.nativeEnum(GameState).parse(game.gameState));

  if (gameEndedPreCheck) {
    return void (await interaction.reply({
      ephemeral: true,
      content: "This game has ended.",
    }));
  }

  const challengerColorTurn =
    challengerColor.data === BinaryColorState.Red
      ? GameState.RedTurn
      : GameState.YellowTurn;

  const isUserTurn =
    game.gameState === challengerColorTurn ? isChallenger : !isChallenger;
  if (
    !isUserTurn ||
    ![game.challenger, game.opponent].includes(interaction.user.id)
  ) {
    const checkedColumn = checkColumn(board.data, column.data);

    if ("error" in checkedColumn) {
      return void (await interaction.reply({
        ephemeral: true,
        content: checkedColumn.error,
      }));
    }

    return void (await interaction.reply({
      content: sprintf(
        "<@%s> suggests **%s**",
        interaction.user.id,
        column.data,
      ),
    }));
  }

  const moveMade = makeMove(board.data, column.data);

  if ("error" in moveMade) {
    return void (await interaction.reply({
      ephemeral: true,
      content: moveMade.error,
    }));
  }

  const checkWinner = determineWinnerOptimized(moveMade);

  const gameEnded = [
    GameState.Draw,
    GameState.RedWin,
    GameState.YellowWin,
  ].includes(
    z.nativeEnum(GameState).parse(checkWinner.gameState ?? moveMade.gameState),
  );

  await prisma.connect4Game.update({
    where: {
      id: game.id,
    },
    data: {
      board: JSON.stringify(checkWinner),
      gameState: checkWinner.gameState,
      lastMoveAt: new Date(),
      endedAt: gameEnded ? new Date() : undefined,
    },
    select: {
      id: true,
    },
  });

  clearTimeout(connect4TimeoutsStore.get(game.id));

  if (gameEnded) {
    connect4TimeoutsStore.delete(game.id);
  } else {
    connect4TimeoutsStore.set(
      game.id,
      setTimeout(() => {
        void handleOutOfTime({
          board: moveMade,
          gameId: game.id,
        });
      }, game.moveTime * 1e3),
    );
  }

  if (gameEnded && game.wagerAmount) {
    const draw = checkWinner.gameState === GameState.Draw;

    if (draw) {
      await prisma.wallet.updateMany({
        where: {
          id: {
            in: [game.challenger, game.opponent],
          },
        },
        data: {
          balance: {
            increment: game.wagerAmount,
          },
        },
      });
    } else {
      const winnerId =
        z.nativeEnum(BinaryColorState).parse(game.challengerColor) ===
          BinaryColorState.Red && checkWinner.gameState === GameState.RedWin
          ? game.challenger
          : game.opponent;
      await prisma.wallet.update({
        where: {
          userDiscordId_guildId: {
            guildId,
            userDiscordId: winnerId,
          },
        },
        data: {
          balance: {
            increment: game.wagerAmount * 2n,
          },
        },
      });
    }
  }

  return void (await Promise.all([
    interaction.message.edit({
      content: "",
      components: [],
    }),
    interaction
      .reply(await connect4display(game.id))
      .then((reply) => reply.fetch())
      .then(async (message) => {
        return await prisma.connect4Game.update({
          where: {
            id: game.id,
          },
          data: {
            lastMessageId: message.id,
          },
        });
      })
      .catch(console.error),
  ]));
}

export async function connect4forfeit(
  interactionContext: InteractionContext,
  interaction: AnyInteraction,
): Promise<void> {
  if (!interaction.isButton()) {
    return void (await interaction.reply({
      ephemeral: true,
      content: "This interaction is only available as button.",
    }));
  }

  const guildId = interaction.guildId;

  if (!guildId) {
    return void (await interaction.reply({
      ephemeral: true,
      content: "This command is only available in servers.",
    }));
  }

  const context = connect4interactionContext.safeParse(
    JSON.parse(interactionContext.payload ?? "{}"),
  );

  if (!context.success) {
    return void (await interaction.reply({
      ephemeral: true,
      content: "Invalid context. Contact developers.",
    }));
  }

  const game = await prisma.connect4Game.findUnique({
    where: {
      id: context.data.gameId,
    },
  });

  if (!game) {
    return void (await interaction.reply({
      ephemeral: true,
      content: "Game not found. Contact developers.",
    }));
  }

  if (![game.opponent, game.challenger].includes(interaction.user.id)) {
    return void (await interaction.reply({
      ephemeral: true,
      content: "You are not a player in this game.",
    }));
  }

  clearTimeout(connect4TimeoutsStore.get(game.id));
  connect4TimeoutsStore.delete(game.id);

  const gameEnded = [
    GameState.Draw,
    GameState.RedWin,
    GameState.YellowWin,
  ].includes(z.nativeEnum(GameState).parse(game.gameState));

  if (gameEnded) {
    return void (await interaction.reply({
      ephemeral: true,
      content: "This game has ended.",
    }));
  }

  const board = boardSchema.safeParse(JSON.parse(game.board));

  if (!board.success) {
    return void (await interaction.reply({
      ephemeral: true,
      content: "Failed to parse board. Contact developers.",
    }));
  }

  const challengerForfeitState =
    game.challengerColor === SlotState.Red
      ? BinaryColorState.Red
      : BinaryColorState.Yellow;
  const opponentForfeitState =
    challengerForfeitState === BinaryColorState.Red
      ? BinaryColorState.Yellow
      : BinaryColorState.Red;

  const forfeitedBoard = forfeit(
    board.data,
    game.challenger === interaction.user.id
      ? challengerForfeitState
      : opponentForfeitState,
  );

  await prisma.connect4Game.update({
    where: {
      id: game.id,
    },
    data: {
      board: JSON.stringify(forfeitedBoard),
      gameState:
        game.challenger === interaction.user.id
          ? GameState.YellowWin
          : GameState.RedWin,
      endedAt: new Date(),
    },
  });

  if (game.wagerAmount) {
    const wallet = await createWallet(
      interaction.user.id === game.challenger ? game.opponent : game.challenger,
      guildId,
    );
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

  return void (await interaction
    .reply(await connect4display(game.id))
    .catch(console.error));
}
