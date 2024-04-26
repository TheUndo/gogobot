import {
  Column,
  GameState,
  SlotState,
  boardSchema,
} from "!/common/logic/c4/c4types";
import { calculateWinner } from "!/common/logic/c4/calculateWinner";
import { checkColumn } from "!/common/logic/c4/checkColumn";
import { makeMove } from "!/common/logic/c4/makeMove";
import type { AnyInteraction, InteractionContext } from "!/common/types";
import { prisma } from "!/prisma";
import { sprintf } from "sprintf-js";
import { z } from "zod";
import { connect4interactionContext } from "./connect4config";
import { connect4display } from "./connect4display";

export async function connect4move(
  interactionContext: InteractionContext,
  interaction: AnyInteraction,
) {
  if (!interaction.isStringSelectMenu()) {
    return await interaction.reply({
      ephemeral: true,
      content: "This interaction is only available as string menu select.",
    });
  }

  const guildId = interaction.guildId;

  if (!guildId) {
    return await interaction.reply({
      ephemeral: true,
      content: "This command is only available in servers.",
    });
  }

  const context = connect4interactionContext.safeParse(
    JSON.parse(interactionContext.payload ?? "{}"),
  );

  if (!context.success) {
    return await interaction.reply({
      ephemeral: true,
      content: "Invalid context. Contact developers.",
    });
  }

  const game = await prisma.connect4Game.findUnique({
    where: {
      id: context.data.gameId,
    },
  });

  if (!game) {
    return await interaction.reply({
      ephemeral: true,
      content: "Game not found. Contact developers.",
    });
  }

  const board = boardSchema.safeParse(JSON.parse(game.board));

  if (!board.success) {
    return await interaction.reply({
      ephemeral: true,
      content: "Failed to parse board. Contact developers.",
    });
  }

  const rawColumn = interaction.values.at(0);

  const column = z.nativeEnum(Column).safeParse(rawColumn);

  if (!column.success) {
    return await interaction.reply({
      ephemeral: true,
      content: "Invalid column. Contact developers.",
    });
  }

  const isChallenger = game.challenger === interaction.user.id;

  const challengerColor = z
    .nativeEnum(SlotState)
    .safeParse(game.challengerColor);

  if (!challengerColor.success) {
    return await interaction.reply({
      ephemeral: true,
      content: "Failed to parse challenger color. Contact developers.",
    });
  }

  const challengerColorTurn =
    challengerColor.data === SlotState.Red
      ? GameState.RedTurn
      : GameState.YellowTurn;

  const isUserTurn =
    game.gameState === challengerColorTurn ? isChallenger : !isChallenger;
  if (!isUserTurn) {
    const checkedColumn = checkColumn(board.data, column.data);

    if ("error" in checkedColumn) {
      return await interaction.reply({
        ephemeral: true,
        content: checkedColumn.error,
      });
    }

    return await interaction.reply({
      content: sprintf(
        "<@%s> suggests **%s**",
        interaction.user.id,
        column.data,
      ),
    });
  }

  const moveMade = makeMove(board.data, column.data);

  if ("error" in moveMade) {
    return await interaction.reply({
      ephemeral: true,
      content: moveMade.error,
    });
  }

  const checkWinner = calculateWinner(moveMade);

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

  return await interaction.reply(await connect4display(game.id));
}
