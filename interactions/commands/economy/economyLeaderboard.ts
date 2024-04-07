import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  type Interaction,
  SlashCommandBuilder,
} from "discord.js";
import { sprintf } from "sprintf-js";
import { z } from "zod";
import { notYourInteraction } from "~/common/logic/responses/notYourInteraction";
import { wrongInteractionType } from "~/common/logic/responses/wrongInteractionType";
import {
  type AnyInteraction,
  ButtonAction,
  type ButtonActionFormat,
  Colors,
  type Command,
  type InteractionContext,
  InteractionType,
} from "~/common/types";
import { addCurrency } from "~/common/utils/addCurrency";
import { formatNumber } from "~/common/utils/formatNumber";
import { wrapTag } from "~/common/utils/wrapTag";
import { prisma } from "~/prisma";

export enum LeaderBoardType {
  Bank = "BANK",
  Wallet = "WALLET",
}

const leaderBoardChangeTypeContext = z.object({
  type: z.nativeEnum(LeaderBoardType),
});

export const leaderBoard = {
  data: new SlashCommandBuilder()
    .setName("lb")
    .setDescription("See leader board of the server")
    .addSubcommand((subcommand) =>
      subcommand.setName("users").setDescription("See user leader board"),
    )
    .addSubcommand((subcommand) =>
      subcommand.setName("clans").setDescription("See clan leader board"),
    )
    .addSubcommand((subcommand) =>
      subcommand.setName("wallet").setDescription("See wallet leader board"),
    ),
  async execute(interaction: Interaction) {
    if (!interaction.isRepliable()) {
      return;
    }

    const guildId = interaction.guild?.id;

    if (!guildId) {
      return await interaction.reply(
        "This command can only be used in a server.",
      );
    }

    if (!interaction.isCommand() || !interaction.isChatInputCommand()) {
      return await interaction.reply(
        "This interaction can only be used as a command.",
      );
    }

    const subcommand = interaction.options.getSubcommand();

    switch (subcommand) {
      case "clans": {
        return await interaction.reply(
          await createClanLeaderBoard({
            userId: interaction.user.id,
            guildId,
            page: 1,
            type: LeaderBoardType.Bank,
          }),
        );
      }
      case "wallet": {
        return await interaction.reply(
          await createLeaderBoard({
            userId: interaction.user.id,
            guildId,
            page: 1,
            type: LeaderBoardType.Wallet,
          }),
        );
      }
      default: {
        return await interaction.reply(
          await createLeaderBoard({
            userId: interaction.user.id,
            guildId,
            page: 1,
            type: LeaderBoardType.Bank,
          }),
        );
      }
    }
  },
} satisfies Command;

type Options = {
  userId: string;
  guildId: string;
  page: number;
  type: LeaderBoardType;
};

const pageSize = 15;

export async function createLeaderBoard({
  userId,
  guildId,
  page = 1,
  type,
}: Options) {
  const embed = new EmbedBuilder().setColor(Colors.Info);

  const where = {
    guildId,
  };
  const orderBy = {
    balance: "desc",
  } as const;
  const skip = (page - 1) * pageSize;

  const [banks, size] = await prisma.$transaction([
    type === LeaderBoardType.Bank
      ? prisma.bank.findMany({
          where,
          orderBy,
          skip,
          take: pageSize,
        })
      : prisma.wallet.findMany({
          where,
          orderBy,
          skip,
          take: pageSize,
        }),
    prisma.bank.count({
      where: {
        guildId,
      },
    }),
  ]);

  const clans = await prisma.clan.findMany({
    where: {
      discordGuildId: guildId,
      members: {
        some: {
          discordUserId: {
            in: [...new Set(banks.map((bank) => bank.userDiscordId))],
          },
        },
      },
      settingsAbbreviation: {
        not: null,
      },
    },
    select: {
      members: {
        select: {
          discordUserId: true,
        },
      },
      settingsAbbreviation: true,
    },
  });

  const pages = Math.ceil(size / pageSize);

  if (page === 1) {
    embed.setTitle(
      type === LeaderBoardType.Bank ? "Leader board" : "Wallet Leader board",
    );
  } else {
    embed.setTitle(
      sprintf(
        type === LeaderBoardType.Bank
          ? "Leader board (Page %d/%d)"
          : "Wallet leader board (Page %d/%d)",
        page,
        pages,
      ),
    );
  }

  if (!banks.length) {
    return {
      embeds: [embed.setTitle("Leader board is empty")],
    };
  }

  const makeDollars = addCurrency();

  const listItems = banks.map((bank, i) => {
    const position = (page - 1) * pageSize + i + 1;
    const clan = clans.find((clan) =>
      clan.members.some((m) => m.discordUserId === bank.userDiscordId),
    );

    const format =
      bank.userDiscordId === userId ? "%d. %s **%s** (you)" : "%d. %s %s";

    return sprintf(
      format,
      position,
      clan?.settingsAbbreviation
        ? `<@${bank.userDiscordId}> ${wrapTag(clan.settingsAbbreviation)}`
        : `<@${bank.userDiscordId}>`,
      makeDollars(formatNumber(bank.balance)),
    );
  });

  embed.setDescription(listItems.join("\n"));

  const [leaderBoardChangeTypeInteraction, showClanLBInteraction] =
    await prisma.$transaction([
      prisma.interaction.create({
        data: {
          type: InteractionType.LeaderBoardChangeType,
          guildId,
          userDiscordId: userId,
          payload: JSON.stringify({
            type:
              type === LeaderBoardType.Bank
                ? LeaderBoardType.Wallet
                : LeaderBoardType.Bank,
          } satisfies z.infer<typeof leaderBoardChangeTypeContext>),
        },
      }),
      prisma.interaction.create({
        data: {
          type: InteractionType.LeaderBoardShowClans,
          guildId,
          userDiscordId: userId,
        },
      }),
    ]);

  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId(
        `${ButtonAction.LeaderBoardChangePage}+${
          page - 1
        }` satisfies ButtonActionFormat,
      )
      .setEmoji("⬅️")
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(page === 1),
    new ButtonBuilder()
      .setCustomId(
        `${ButtonAction.LeaderBoardChangePage}+${
          page + 1
        }` satisfies ButtonActionFormat,
      )
      .setEmoji("➡️")
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(page === pages),
    new ButtonBuilder()
      .setCustomId(leaderBoardChangeTypeInteraction.id)
      .setLabel(type === LeaderBoardType.Bank ? "Wallet" : "Bank")
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId(showClanLBInteraction.id)
      .setLabel("Clans")
      .setStyle(ButtonStyle.Secondary),
  );

  return {
    embeds: [embed],
    components: [row],
  };
}

export async function leaderBoardChangeTypeButton(
  interactionContext: InteractionContext,
  interaction: AnyInteraction,
) {
  if (!interaction.isButton()) {
    return await interaction.reply(
      wrongInteractionType(interactionContext, interaction),
    );
  }

  if (interaction.user.id !== interactionContext.userDiscordId) {
    return await interaction.reply(
      notYourInteraction(interactionContext, interaction),
    );
  }

  const context = leaderBoardChangeTypeContext.safeParse(
    JSON.parse(interactionContext.payload ?? "{}"),
  );

  if (!context.success) {
    return await interaction.reply({
      content: "An error occurred. Please try again later.",
    });
  }

  const guildId = interaction.guildId;

  if (!guildId) {
    return await interaction.reply(
      "This command can only be used in a server.",
    );
  }

  return await interaction.update(
    await createLeaderBoard({
      userId: interaction.user.id,
      guildId,
      page: 1,
      type: context.data.type,
    }),
  );
}
export async function leaderBoardUsersButton(
  interactionContext: InteractionContext,
  interaction: AnyInteraction,
) {
  if (!interaction.isButton()) {
    return interaction.reply(
      wrongInteractionType(interactionContext, interaction),
    );
  }

  if (interaction.user.id !== interactionContext.userDiscordId) {
    return await interaction.reply(
      notYourInteraction(interactionContext, interaction),
    );
  }

  const guildId = interaction.guildId;

  if (!guildId) {
    return interaction.reply("This command can only be used in a server.");
  }

  return interaction.update(
    await createLeaderBoard({
      userId: interaction.user.id,
      guildId,
      page: 1,
      type: LeaderBoardType.Bank,
    }),
  );
}

export async function leaderBoardClanButton(
  interactionContext: InteractionContext,
  interaction: AnyInteraction,
) {
  if (!interaction.isButton()) {
    return interaction.reply(
      wrongInteractionType(interactionContext, interaction),
    );
  }

  if (interaction.user.id !== interactionContext.userDiscordId) {
    return await interaction.reply(
      notYourInteraction(interactionContext, interaction),
    );
  }

  const guildId = interaction.guildId;

  if (!guildId) {
    return interaction.reply("This command can only be used in a server.");
  }

  return interaction.update(
    await createClanLeaderBoard({
      userId: interaction.user.id,
      guildId,
      page: 1,
      type: LeaderBoardType.Bank,
    }),
  );
}

async function createClanLeaderBoard({ userId, guildId, page = 1 }: Options) {
  const embed = new EmbedBuilder()
    .setColor(Colors.Info)
    .setTitle("Leaderboard");

  const [clans, size] = await prisma.$transaction([
    prisma.clanStatistics.findMany({
      where: {
        guildId,
      },
      orderBy: {
        wealth: "desc",
      },
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: {
        id: true,
        wealth: true,
        clan: {
          select: {
            name: true,
            settingsAbbreviation: true,
          },
        },
      },
    }),
    prisma.clanStatistics.count({
      where: {
        guildId,
      },
    }),
  ]);

  const pages = Math.ceil(size / pageSize);

  if (page === 1) {
    embed.setTitle("Clan leader board");
  } else {
    embed.setTitle(sprintf("Clan leader board (Page %d/%d)", page, pages));
  }

  const showNormalLBInteraction = await prisma.interaction.create({
    data: {
      type: InteractionType.LeaderBoardShowUsers,
      guildId,
      userDiscordId: userId,
    },
  });

  const changeLBTypeButton = new ButtonBuilder()
    .setCustomId(showNormalLBInteraction.id)
    .setLabel("Users")
    .setStyle(ButtonStyle.Secondary);

  if (!clans.length) {
    return {
      embeds: [embed.setTitle("Clan Leader board is empty")],
      components: [
        new ActionRowBuilder<ButtonBuilder>().addComponents(changeLBTypeButton),
      ],
    };
  }

  const makeDollars = addCurrency();

  embed.setDescription(
    clans
      .map((clan, i) => {
        return sprintf(
          "%d. %s %s",
          (page - 1) * pageSize + i + 1,
          clan.clan.settingsAbbreviation
            ? `**${clan.clan.name}** ${wrapTag(clan.clan.settingsAbbreviation)}`
            : `**${clan.clan.name}**`,
          makeDollars(formatNumber(clan.wealth)),
        );
      })
      .join("\n"),
  );

  const [previousPageInteraction, nextPageInteraction] =
    await prisma.$transaction([
      prisma.interaction.create({
        data: {
          type: InteractionType.LeaderBoardClanChangeChangePage,
          guildId,
          userDiscordId: userId,
          payload: (page - 1).toString(),
        },
      }),
      prisma.interaction.create({
        data: {
          type: InteractionType.LeaderBoardClanChangeChangePage,
          guildId,
          userDiscordId: userId,
          payload: (page + 1).toString(),
        },
      }),
    ]);

  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId(previousPageInteraction.id)
      .setEmoji("⬅️")
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(page === 1),
    new ButtonBuilder()
      .setCustomId(nextPageInteraction.id)
      .setEmoji("➡️")
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(page === pages),
    changeLBTypeButton,
  );

  return {
    embeds: [embed],
    components: [row],
  };
}

export async function leaderBoardClanChangePage(
  interactionContext: InteractionContext,
  interaction: AnyInteraction,
) {
  if (!interaction.isButton()) {
    return interaction.reply(
      wrongInteractionType(interactionContext, interaction),
    );
  }

  if (interaction.user.id !== interactionContext.userDiscordId) {
    return await interaction.reply(
      notYourInteraction(interactionContext, interaction),
    );
  }

  const guildId = interaction.guildId;

  if (!guildId) {
    return interaction.reply("This command can only be used in a server.");
  }

  const page = z.coerce
    .number()
    .int()
    .min(1)
    .safeParse(interactionContext.payload);

  if (!page.success) {
    return interaction.reply(
      "Invalid page number, please try again with a valid page number.",
    );
  }

  return interaction.update(
    await createClanLeaderBoard({
      userId: interaction.user.id,
      guildId,
      page: page.data,
      type: LeaderBoardType.Bank,
    }),
  );
}
