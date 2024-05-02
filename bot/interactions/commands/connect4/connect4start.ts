import { createEmptyBoard } from "!/bot/logic/c4/createEmptyBoard";
import {
  connect4TimeoutsStore,
  handleOutOfTime,
} from "!/bot/logic/c4/handleOutOfTime";
import { BinaryColorState, GameState, SlotState } from "!/bot/logic/c4/types";
import { createWallet } from "!/bot/logic/economy/createWallet";
import { notYourInteraction } from "!/bot/logic/responses/notYourInteraction";
import {
  type AnyInteraction,
  Colors,
  type InteractionContext,
  InteractionType,
} from "!/bot/types";
import { addCurrency } from "!/bot/utils/addCurrency";
import { formatNumber } from "!/bot/utils/formatNumber";
import { safeParseNumber } from "!/bot/utils/parseNumber";
import { prisma } from "!/core/db/prisma";
import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  type InteractionReplyOptions,
} from "discord.js";
import { sprintf } from "sprintf-js";
import { z } from "zod";
import { connect4clockTimes } from "./connect4config";
import { connect4display } from "./connect4display";

type Options = {
  mentionedIsBot: boolean;
  guildId: string;
  channelId: string;
  authorId: string;
  mentionedId?: string;
  clockTime: string;
  challengerColor: string;
  wager?: string;
};

const playerColor = z.enum(["red", "yellow"]);

const connect4invitationContext = z.object({
  invitationId: z.string(),
});

export async function connect4start({
  mentionedIsBot,
  guildId,
  channelId,
  authorId,
  mentionedId,
  wager,
  challengerColor,
  clockTime,
}: Options): Promise<InteractionReplyOptions> {
  if (mentionedIsBot) {
    return {
      ephemeral: true,
      content: "You can't challenge bots.",
    };
  }

  if (authorId === mentionedId) {
    return {
      ephemeral: true,
      content: "You can't challenge yourself.",
    };
  }

  const authorCurrentGame = await prisma.connect4Game.findFirst({
    where: {
      guildId,
      challenger: authorId,
      endedAt: null,
    },
  });

  if (authorCurrentGame) {
    return {
      ephemeral: true,
      content: sprintf(
        "You're already in a game with <@%s> in <#%s>. You can forfeit with `/connect4 end`",
        authorCurrentGame.opponent,
        authorCurrentGame.channelId,
      ),
    };
  }

  const mentionedCurrentGame = await prisma.connect4Game.findFirst({
    where: {
      guildId,
      challenger: mentionedId,
      endedAt: null,
    },
  });

  if (mentionedCurrentGame) {
    return {
      ephemeral: true,
      content: sprintf(
        "<@%s> is already in a game with someone else in <#%s>",
        mentionedId,
        mentionedCurrentGame.channelId,
      ),
    };
  }

  const authorCurrentInvitation = await prisma.connect4GameInvitation.findFirst(
    {
      where: {
        expiresAt: {
          gte: new Date(),
        },
        voided: false,
      },
    },
  );

  if (authorCurrentInvitation) {
    return {
      ephemeral: true,
      content: "You already have a pending invitation.",
    };
  }

  const wallet = await createWallet(authorId, guildId);

  const parsedWager =
    wager != null
      ? z
          .preprocess(
            safeParseNumber,
            z
              .number()
              .int()
              .transform((v) => (v === 0 ? wallet.balance : v)),
          )
          .safeParse(wager)
      : null;

  if (parsedWager && !parsedWager.success) {
    return {
      ephemeral: true,
      content: "Invalid wager.",
    };
  }

  if (parsedWager && parsedWager.data > wallet.balance) {
    return {
      ephemeral: true,
      content: sprintf(
        "You don't have enough money in your wallet. Your balance is %s.",
        addCurrency()(formatNumber(wallet.balance)),
      ),
    };
  }

  if (parsedWager && parsedWager.data < 1_000) {
    return {
      ephemeral: true,
      content: "Minimum wager is 1k.",
    };
  }

  const parsedChallengerColor = playerColor.safeParse(challengerColor);

  if (!parsedChallengerColor.success) {
    return {
      ephemeral: true,
      content: "Invalid color.",
    };
  }

  const parsedClockTime = z.coerce
    .number()
    .safeParse(
      connect4clockTimes.find((time) => time.value === clockTime)?.value,
    );

  if (!parsedClockTime.success) {
    return {
      ephemeral: true,
      content: "Invalid clock time.",
    };
  }

  const [_, invitation] = await prisma.$transaction([
    prisma.connect4GameInvitation.updateMany({
      where: {
        guildId,
        challenger: authorId,
      },
      data: {
        voided: true,
      },
    }),
    prisma.connect4GameInvitation.create({
      data: {
        guildId,
        channelId,
        challenger: authorId,
        opponent: mentionedId,
        challengerColor:
          parsedChallengerColor.data === "red"
            ? BinaryColorState.Red
            : BinaryColorState.Yellow,
        wagerAmount: parsedWager?.data,
        moveTime: parsedClockTime.data,
        expiresAt: new Date(Date.now() + 1000 * 60 * 5),
      },
      select: {
        id: true,
        expiresAt: true,
      },
    }),
    prisma.wallet.update({
      where: {
        userDiscordId_guildId: {
          userDiscordId: authorId,
          guildId,
        },
      },
      data: {
        balance: {
          decrement: parsedWager?.data ?? 0,
        },
      },
    }),
  ]);

  const invitationContext: z.infer<typeof connect4invitationContext> = {
    invitationId: invitation.id,
  };

  const [acceptInteraction, declineInteraction] = await prisma.$transaction([
    prisma.interaction.create({
      data: {
        guildId,
        channelId,
        type: InteractionType.Connect4AcceptInvitation,
        userDiscordId: authorId,
        payload: JSON.stringify(invitationContext),
      },
    }),
    prisma.interaction.create({
      data: {
        guildId,
        channelId,
        type: InteractionType.Connect4DeclineInvitation,
        userDiscordId: authorId,
        payload: JSON.stringify(invitationContext),
      },
    }),
  ]);

  const embed = new EmbedBuilder()
    .setColor(Colors.Info)
    .setTitle("Connect 4")
    .setDescription(
      mentionedId
        ? [
            sprintf(
              "<@%s> has challenged <@%s> to a game of Connect 4.",
              authorId,
              mentionedId,
            ),
            sprintf(
              "- :red_circle: <@%s> (moves first)",
              parsedChallengerColor.data === "red" ? authorId : mentionedId,
            ),
            sprintf(
              "- :yellow_circle: <@%s>",
              parsedChallengerColor.data === "yellow" ? authorId : mentionedId,
            ),
          ].join("\n")
        : [
            sprintf(
              "<@%s> is challenging anyone to a game of connect 4!",
              authorId,
              mentionedId,
            ),
            sprintf(
              "- :red_circle: %s (moves first)",
              parsedChallengerColor.data === "red"
                ? `<@${authorId}>`
                : "*opponent*",
            ),
            sprintf(
              "- :yellow_circle: %s",
              parsedChallengerColor.data === "yellow"
                ? `<@${authorId}>`
                : "*opponent*",
            ),
          ].join("\n"),
    );

  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId(acceptInteraction.id)
      .setLabel("Accept")
      .setStyle(ButtonStyle.Success),
    new ButtonBuilder()
      .setCustomId(declineInteraction.id)
      .setLabel(mentionedId ? "Decline" : "Cancel")
      .setStyle(mentionedId ? ButtonStyle.Danger : ButtonStyle.Secondary),
  );

  embed.addFields(
    {
      name: "Move time",
      value: z
        .string()
        .parse(
          connect4clockTimes.find((time) => time.value === clockTime)?.name,
        ),
      inline: true,
    },
    {
      name: "Expires",
      value: sprintf(
        "<t:%d:R>",
        Math.floor(invitation.expiresAt.getTime() / 1000),
      ),
      inline: true,
    },
  );

  if (parsedWager?.data) {
    embed.addFields({
      name: "Wager",
      value: addCurrency()(formatNumber(parsedWager.data)),
      inline: true,
    });
  }

  return {
    content: mentionedId ? sprintf("<@%s>", mentionedId) : undefined,
    embeds: [embed],
    components: [row],
  };
}

export async function connect4accept(
  interactionContext: InteractionContext,
  interaction: AnyInteraction,
): Promise<void> {
  if (!interaction.isButton()) {
    return;
  }

  const guildId = interaction.guildId;

  if (!guildId) {
    return void (await interaction.reply({
      ephemeral: true,
      content: "This command is only available in servers.",
    }));
  }

  const context = connect4invitationContext.safeParse(
    JSON.parse(interactionContext.payload ?? "{}"),
  );

  if (!context.success) {
    return void (await interaction.reply({
      ephemeral: true,
      content: "Invalid context.",
    }));
  }

  const invitation = await prisma.connect4GameInvitation.findFirst({
    where: {
      id: context.data.invitationId,
      guildId,
    },
  });

  if (!invitation) {
    return void (await interaction.reply({
      ephemeral: true,
      content: "Invitation not found.",
    }));
  }

  if (invitation.challenger === interaction.user.id) {
    return void (await interaction.reply({
      ephemeral: true,
      content: sprintf(
        "You can't accept your own invitation. If you want to remove the invitation click the *%s* button.",
        invitation.opponent ? "decline" : "cancel",
      ),
    }));
  }

  if (invitation.opponent && invitation.opponent !== interaction.user.id) {
    return void (await interaction.reply(
      notYourInteraction(interactionContext, interaction),
    ));
  }

  if (invitation.wagerAmount) {
    const opponentWallet = await createWallet(interaction.user.id, guildId);

    if (opponentWallet.balance < invitation.wagerAmount) {
      return void (await interaction.reply({
        ephemeral: true,
        content: sprintf(
          "You don't have enough money in your wallet to accept this challenge. Your balance is %s and the wager is %s.",
          addCurrency()(formatNumber(opponentWallet.balance)),
          addCurrency()(formatNumber(invitation.wagerAmount)),
        ),
      }));
    }

    await prisma.wallet.update({
      where: {
        userDiscordId_guildId: {
          userDiscordId: interaction.user.id,
          guildId,
        },
      },
      data: {
        balance: {
          decrement: invitation.wagerAmount,
        },
      },
    });
  }

  const board = createEmptyBoard(SlotState.Red);

  const [_, game] = await prisma.$transaction([
    prisma.connect4GameInvitation.update({
      where: {
        id: context.data.invitationId,
      },
      data: {
        voided: true,
      },
    }),
    prisma.connect4Game.create({
      data: {
        guildId,
        channelId: invitation.channelId,
        challenger: invitation.challenger,
        opponent: interaction.user.id,
        challengerColor: invitation.challengerColor,
        wagerAmount: invitation.wagerAmount,
        moveTime: invitation.moveTime,
        board: JSON.stringify(board),
        gameState: z.nativeEnum(GameState).parse(board.gameState),
        lastMoveAt: new Date(),
        lastMessageId: interaction.message.id,
      },
    }),
  ]);

  await Promise.all([
    interaction
      .reply(await connect4display(game.id))
      .then((reply) => reply.fetch())
      .then(async (message) => {
        await prisma.connect4Game.update({
          where: {
            id: game.id,
          },
          data: {
            lastMessageId: message.id,
          },
        });
        connect4TimeoutsStore.set(
          game.id,
          setTimeout(() => {
            void handleOutOfTime({
              board: board,
              gameId: game.id,
            });
          }, game.moveTime * 1000),
        );
      })
      .catch(console.error),
    interaction.message
      .edit({
        components: [],
        content: "",
        embeds: [
          new EmbedBuilder()
            .setTitle("Challenge accepted")
            .setColor(Colors.Success)
            .setDescription(
              sprintf(
                "<@%s> accepted the challenge by <@%s>",
                interaction.user.id,
                invitation.challenger,
              ),
            ),
        ],
      })
      .catch((e) => {
        console.error("Failed to edit message", e);
      }),
  ]);

  return undefined;
}

export async function connect4decline(
  interactionContext: InteractionContext,
  interaction: AnyInteraction,
): Promise<void> {
  if (!interaction.isButton()) {
    return;
  }

  const guildId = interaction.guildId;

  if (!guildId) {
    return void (await interaction.reply({
      ephemeral: true,
      content: "This command is only available in servers.",
    }));
  }

  const context = connect4invitationContext.safeParse(
    JSON.parse(interactionContext.payload ?? "{}"),
  );

  if (!context.success) {
    return void (await interaction.reply({
      ephemeral: true,
      content: "Invalid context. Contact developers.",
    }));
  }

  const invitation = await prisma.connect4GameInvitation.findUnique({
    where: {
      id: context.data.invitationId,
    },
  });

  if (!invitation) {
    return void (await interaction.reply({
      ephemeral: true,
      content: "Invitation not found.",
    }));
  }

  if (
    ![invitation.challenger, invitation.opponent].includes(interaction.user.id)
  ) {
    return void (await interaction.reply(
      notYourInteraction(interactionContext, interaction),
    ));
  }

  const wager = invitation.wagerAmount
    ? z.number().parse(invitation.wagerAmount)
    : 0;

  await prisma.$transaction([
    prisma.connect4GameInvitation.update({
      where: {
        id: context.data.invitationId,
      },
      data: {
        voided: true,
      },
    }),
    prisma.wallet.update({
      where: {
        userDiscordId_guildId: {
          userDiscordId: invitation.challenger,
          guildId,
        },
      },
      data: {
        balance: {
          increment: wager,
        },
      },
    }),
  ]);

  if (interaction.user.id === invitation.challenger) {
    return void (await interaction.update({
      components: [],
      content: "",
      embeds: [
        new EmbedBuilder()
          .setTitle("Connect 4 game aborted")
          .setColor(Colors.Error)
          .setDescription(
            invitation.opponent
              ? sprintf(
                  "<@%s> aborted the challenge against <@%s>",
                  interaction.user.id,
                  invitation.opponent,
                )
              : sprintf("<@%s> aborted the challenge", interaction.user.id),
          ),
      ],
    }));
  }

  await interaction.update({
    components: [],
    content: "",
    embeds: [
      new EmbedBuilder()
        .setTitle("Challenge declined")
        .setColor(Colors.Error)
        .setDescription(
          sprintf(
            "<@%s> declined the challenge by <@%s>",
            interaction.user.id,
            invitation.challenger,
          ),
        ),
    ],
  });
}
