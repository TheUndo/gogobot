import { Column, GameState, boardSchema } from "!/common/logic/c4/c4types";
import { renderBoard } from "!/common/logic/c4/renderBoard";
import { Colors, InteractionType } from "!/common/types";
import { prisma } from "!/prisma";
import {
  ActionRowBuilder,
  AttachmentBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  type InteractionReplyOptions,
  StringSelectMenuBuilder,
} from "discord.js";
import { sprintf } from "sprintf-js";
import { match } from "ts-pattern";
import type { z } from "zod";
import type { connect4interactionContext } from "./connect4config";

export async function connect4display(
  gameId: string,
): Promise<InteractionReplyOptions> {
  const game = await prisma.connect4Game.findUnique({
    where: {
      id: gameId,
    },
  });

  if (!game) {
    return {
      content: "Game not found. Contact developers.",
    };
  }

  const board = boardSchema.safeParse(JSON.parse(game.board));

  if (!board.success) {
    return {
      content: "Failed to parse board. Contact developers.",
    };
  }

  const embed = new EmbedBuilder();

  embed.setTitle("Connect 4");

  embed.setDescription(
    [
      sprintf("<@%s> vs <@%s>", game.challenger, game.opponent),
      match(board.data.gameState)
        .with(GameState.RedTurn, () =>
          sprintf(
            "Turn: <@%s> :red_circle: <t:%d:R>",
            game.challengerColor === "red" ? game.challenger : game.opponent,
            Math.round(game.lastMoveAt.getTime() / 1000) + game.moveTime,
          ),
        )
        .with(GameState.YellowTurn, () =>
          sprintf(
            "Turn: <@%s> :yellow_circle: <t:%d:R>",
            game.challengerColor === "yellow" ? game.challenger : game.opponent,
            Math.round(game.lastMoveAt.getTime() / 1000) + game.moveTime,
          ),
        )
        .with(GameState.RedWin, () =>
          sprintf(
            "Winner: <@%s> :red_circle:",
            game.challengerColor === "red" ? game.challenger : game.opponent,
          ),
        )
        .with(GameState.YellowWin, () =>
          sprintf(
            "Winner: <@%s> :yellow_circle:",
            game.challengerColor === "yellow" ? game.challenger : game.opponent,
          ),
        )
        .otherwise(() => "It's a draw!"),
    ].join("\n"),
  );

  embed.setColor(
    match(board.data.gameState)
      .with(GameState.RedTurn, () => 0xff0000)
      .with(GameState.YellowTurn, () => 0xffff00)
      .with(GameState.RedWin, () => 0xff0000)
      .with(GameState.YellowWin, () => 0xffff00)
      .otherwise(() => Colors.Info),
  );

  const image = await renderBoard(board.data).catch(() => null);

  if (!image) {
    return {
      content: "Failed to render board. Contact developers.",
    };
  }

  const context: z.infer<typeof connect4interactionContext> = {
    gameId,
  };

  const name = sprintf(
    "c4-%s_vs_%s-date_%s-gid_%s",
    game.challenger,
    game.opponent,
    Date.now().toString(),
    game.id,
  );

  const file = new AttachmentBuilder(image)
    .setName(sprintf("%s.jpeg", name))
    .setDescription("Connect 4 board");

  embed.setImage(sprintf("attachment://%s", file.name));

  const gameEnded = [
    GameState.Draw,
    GameState.RedWin,
    GameState.YellowWin,
  ].includes(board.data.gameState ?? GameState.RedTurn);

  if (gameEnded) {
    return {
      embeds: [embed],
      content: "",
      files: [file],
    };
  }

  const [moveInteraction, forfeitInteraction, drawInteraction] =
    await prisma.$transaction([
      prisma.interaction.create({
        data: {
          guildId: game.guildId,
          channelId: game.channelId,
          type: InteractionType.Connect4Move,
          userDiscordId: game.challenger,
          payload: JSON.stringify(context),
        },
      }),
      prisma.interaction.create({
        data: {
          guildId: game.guildId,
          channelId: game.channelId,
          type: InteractionType.Connect4Forfeit,
          userDiscordId: game.challenger,
          payload: JSON.stringify(context),
        },
      }),
      prisma.interaction.create({
        data: {
          guildId: game.guildId,
          channelId: game.channelId,
          type: InteractionType.Connect4Draw,
          userDiscordId: game.challenger,
          payload: JSON.stringify(context),
        },
      }),
    ]);

  const row1 = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
    new StringSelectMenuBuilder()
      .setPlaceholder("Make a move")
      .setCustomId(moveInteraction.id)
      .addOptions(
        Object.entries(Column).map(([label, value]) => {
          return {
            label,
            value,
          };
        }),
      ),
  );
  const row2 = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId(forfeitInteraction.id)
      .setStyle(ButtonStyle.Danger)
      .setLabel("Forfeit"),
    new ButtonBuilder()
      .setCustomId(drawInteraction.id)
      .setStyle(ButtonStyle.Secondary)
      .setLabel("Propose a draw"),
  );

  return {
    embeds: [embed],
    content: "",
    files: [file],
    components: [row1, row2],
  };
}
