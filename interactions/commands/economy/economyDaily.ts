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

const coolDown = 1000 * 60 * 60 * 23.5;
const maxStreak = 7;

export const daily = {
  data: new SlashCommandBuilder()
    .setName("daily")
    .setDescription("Get daily reward"),
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

    const baseReward = 9_750;
    const randomBonus = Math.floor(Math.random() * 500);

    const [lastWork, clan] = await Promise.all([
      prisma.work
        .findFirst({
          where: {
            userDiscordId: userId,
            guildDiscordId: guildId,
            type: WorkType.Daily,
          },
          orderBy: {
            createdAt: "desc",
          },
        })
        .then((d) => {
          const currentStreak = (() => {
            if (!d) {
              return 1;
            }
            if (d.createdAt.getTime() + coolDown * 2 < Date.now()) {
              return 1;
            }
            if (d.streak === maxStreak) {
              return 1;
            }
            return d.streak + 1;
          })();
          return { currentStreak, lastUsed: d?.createdAt };
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

    if (
      lastWork.lastUsed &&
      lastWork.lastUsed.getTime() + coolDown > Date.now()
    ) {
      return await interaction.reply({
        content: sprintf(
          "You've already claimed your daily reward. Next claim <t:%d:R>",
          Math.floor((lastWork.lastUsed.getTime() + coolDown) / 1000),
        ),
        ephemeral: true,
      });
    }

    const clanRewardMultiplier = 1 + (clan?.level ?? 0) / 10;
    const streakReward = Math.floor(2.2 ** lastWork.currentStreak * 1_000);
    const dailyReward = baseReward + randomBonus;
    const reward = (dailyReward + streakReward) * clanRewardMultiplier;

    await prisma.$transaction([
      prisma.work.create({
        data: {
          userDiscordId: userId,
          guildDiscordId: guildId,
          type: WorkType.Daily,
          streak: lastWork.currentStreak,
        },
      }),
      prisma.wallet.update({
        where: {
          userDiscordId_guildId: {
            userDiscordId: userId,
            guildId,
          },
        },
        data: {
          balance: {
            increment: reward,
          },
        },
      }),
    ]);

    const mainPart = sprintf("**+%s**", addCurrency()(formatNumber(reward)));

    const dailyRewardPart = sprintf(
      "Daily reward: %s",
      addCurrency()(formatNumber(dailyReward)),
    );

    const streakBonusPart = sprintf(
      "Streak bonus (%d/%d): %s",
      lastWork.currentStreak,
      maxStreak,
      addCurrency()(formatNumber(streakReward)),
    );

    const clanBonusPart = clan
      ? sprintf(
          "Clan bonus (%s): %s",
          `${(clanRewardMultiplier * 100 - 100).toFixed(0)}%`,
          addCurrency()(formatNumber(reward - dailyReward - streakReward)),
        )
      : null;

    const embed = new EmbedBuilder()
      .setTitle(mainPart)
      .setDescription(
        [dailyRewardPart, streakBonusPart, clanBonusPart]
          .filter(Boolean)
          .join("\n"),
      )
      .setFooter({
        text: "Come back tomorrow!",
      })
      .setColor(Colors.Success);

    return await interaction.reply({
      embeds: [embed],
    });
  },
} satisfies Command;
