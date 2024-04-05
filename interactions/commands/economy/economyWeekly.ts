import {
  EmbedBuilder,
  type Interaction,
  SlashCommandBuilder,
} from "discord.js";
import { sprintf } from "sprintf-js";
import { Colors, type Command, WorkType } from "~/common/types";
import { addCurrency } from "~/common/utils/addCurrency";
import { formatNumber } from "~/common/utils/formatNumber";
import { prisma } from "~/prisma";

const coolDown = 1000 * 60 * 60 * 24 * 7 - 1000 * 60 * 60;

export const weekly = {
  data: new SlashCommandBuilder()
    .setName("weekly")
    .setDescription("Get weekly reward"),
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

    const userId = interaction.user.id;

    const baseReward = 100_000;
    const randomBonus = Math.floor(Math.random() * 10_00);

    const [lastWork, clan] = await Promise.all([
      prisma.work.findFirst({
        where: {
          userDiscordId: userId,
          guildDiscordId: guildId,
          type: WorkType.Weekly,
        },
        orderBy: {
          createdAt: "desc",
        },
      }),
      prisma.clan.findFirst({
        where: {
          members: {
            some: {
              discordUserId: userId,
            },
          },
          discordGuildId: guildId,
        },
      }),
    ]);

    if (lastWork && lastWork.createdAt.getTime() + coolDown > Date.now()) {
      return await interaction.reply({
        content: sprintf(
          "You've already claimed your weekly reward. Next claim <t:%d:R>",
          Math.floor((lastWork.createdAt.getTime() + coolDown) / 1000),
        ),
        ephemeral: true,
      });
    }

    const clanRewardMultiplier = 1 + (clan?.level ?? 0) / 10;
    const weeklyReward = baseReward + randomBonus;
    const reward = weeklyReward * clanRewardMultiplier;

    await prisma.work.create({
      data: {
        userDiscordId: userId,
        guildDiscordId: guildId,
        type: WorkType.Weekly,
      },
    });

    const mainPart = sprintf("**+%s**", addCurrency()(formatNumber(reward)));

    const weeklyRewardPart = sprintf(
      "Daily reward: %s",
      addCurrency()(formatNumber(weeklyReward)),
    );

    const clanBonusPart = clan
      ? sprintf(
          "Clan bonus (%s): %s",
          `${(clanRewardMultiplier * 100 - 100).toFixed(0)}%`,
          addCurrency()(formatNumber(reward - weeklyReward)),
        )
      : null;

    const embed = new EmbedBuilder()
      .setTitle(mainPart)
      .setDescription(
        [weeklyRewardPart, clanBonusPart].filter(Boolean).join("\n"),
      )
      .setFooter({
        text: "Come back next week!",
      })
      .setColor(Colors.Success);

    return await interaction.reply({
      embeds: [embed],
    });
  },
} satisfies Command;
