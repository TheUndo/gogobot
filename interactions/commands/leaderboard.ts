import {
  SlashCommandBuilder,
  type Interaction,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} from "discord.js";
import {
  ButtonAction,
  Colors,
  type ButtonActionFormat,
  type Command,
} from "../../common/types";
import { prisma } from "../../prisma";
import { sprintf } from "sprintf-js";
import { addCurrency } from "../../common/utils/addCurrency";
import { formatNumber } from "../../common/utils/formatNumber";

export const leaderBoard = {
  data: new SlashCommandBuilder()
    .setName("lb")
    .setDescription("See leader board of the server"),
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

    if (!interaction.isCommand()) {
      return await interaction.reply(
        "This interaction can only be used as a command.",
      );
    }

    return await interaction.reply(
      await createLeaderBoard({
        userId: interaction.user.id,
        guildId,
        page: 1,
      }),
    );
  },
} satisfies Command;

type Options = {
  userId: string;
  guildId: string;
  page: number;
};

const pageSize = 20;

export async function createLeaderBoard({
  userId,
  guildId,
  page = 1,
}: Options) {
  const embed = new EmbedBuilder()
    .setColor(Colors.Info)
    .setTitle("Leaderboard");

  const [banks, size] = await prisma.$transaction([
    prisma.bank.findMany({
      where: {
        guildId,
      },
      orderBy: {
        balance: "desc",
      },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.bank.count({
      where: {
        guildId,
      },
    }),
  ]);

  const pages = Math.ceil(size / pageSize);

  if (page === 1) {
    embed.setTitle("Leader board");
  } else {
    embed.setTitle(sprintf("Leader board (Page %d/%d)", page, pages));
  }

  if (!banks.length) {
    return {
      embeds: [embed.setTitle("Leader board is empty")],
    };
  }

  const makeDollars = addCurrency();

  const listItems = banks.map((bank, i) => {
    const position = (page - 1) * pageSize + i + 1;

    const format =
      bank.userDiscordId === userId ? "%d. <@%s> **%s** (you)" : "%d. <@%s> %s";

    return sprintf(
      format,
      position,
      bank.userDiscordId,
      makeDollars(formatNumber(bank.balance)),
    );
  });

  embed.setDescription(listItems.join("\n"));

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
  );

  return {
    embeds: [embed],
    components: [row],
  };
}
