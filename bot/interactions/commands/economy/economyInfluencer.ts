import { createWallet } from "!/bot/logic/economy/createWallet";
import { guardEconomyChannel } from "!/bot/logic/guildConfig/guardEconomyChannel";
import { Colors, type Command } from "!/bot/types";
import { addCurrency } from "!/bot/utils/addCurrency";
import { formatNumber } from "!/bot/utils/formatNumber";
import { randomNumber } from "!/bot/utils/randomNumber";
import { prisma } from "!/core/db/prisma";
import {
  EmbedBuilder,
  type Interaction,
  SlashCommandBuilder,
} from "discord.js";
import { sprintf } from "sprintf-js";
import { getRandomizedScenario } from "./lib/getRandomizedScenario";
import { stackOdds } from "./lib/stackOdds";
import { WorkType, coolDowns, workCommandUses } from "./lib/workConfig";
import { workTitle } from "./lib/workTitle";
enum Scenario {
  Youtuber = "Youtuber", //basic youtuber
  MrBeast = "MRBEAST", //mega youtuber
  Pewdiepie = "PEWDIEPIE", //second mega youtuber
  Flop = "FLOP", //debuff
  Logan = "LOGAN", // mega debuff youtuber
  Xqc = "XQC", // mega streamer
  Charlie = "CHARLIE", //basic streamer penguinz0
  Streamer = "STREAMER", //less basic streamer
  Pstar = "PSTAR", //mega OF
  Hoe = "HOE", //basic OF
  Junkie = "JUNKIE", // mega bebuff OF
  Instagram = "INSTAGRAM", //Insta influencer
  Failure = "FAILURE", // Debuff inluencer
  Tiktok = "TikTok", //basic tiktoker
}

const odds: Record<Scenario, number> = {
  [Scenario.MrBeast]: 1,
  [Scenario.Pewdiepie]: 3,
  [Scenario.Pstar]: 5,
  [Scenario.Xqc]: 5,
  [Scenario.Charlie]: 51,
  [Scenario.Youtuber]: 100,
  [Scenario.Streamer]: 100,
  [Scenario.Hoe]: 100,
  [Scenario.Flop]: 51,
  [Scenario.Logan]: 2,
  [Scenario.Instagram]: 100,
  [Scenario.Failure]: 50,
  [Scenario.Tiktok]: 100,
  [Scenario.Junkie]: 3,
};

const computedOdds = stackOdds(odds);

const rewards: Record<
  Scenario,
  {
    message: string;
    generateReward: () => Promise<number>;
  }
> = {
  [Scenario.Charlie]: {
    message:
      "You streamed 📹 on Twitch and surpassed the view count of moistcr1tikal!",
    generateReward: async () => 50_000,
  },
  [Scenario.MrBeast]: {
    message:
      "You decided to be a Youtuber 🎥 and surpassed the subscriber count of MrBeast!",
    generateReward: async () => 2_000_000,
  },
  [Scenario.Pewdiepie]: {
    message:
      "You decided to be a Youtuber 🎥 and surpassed the subscriber count of PewDiePie!",
    generateReward: async () => 1_200_000,
  },
  [Scenario.Pstar]: {
    message:
      "You decided to work on OnlyFans 📸 and break in to the top 0.1% creator!",
    generateReward: async () => 300_000,
  },
  [Scenario.Xqc]: {
    message:
      "You decided to be a Twitch streamer 📹 and surpassed the view count of xQc!",
    generateReward: async () => 300_000,
  },
  [Scenario.Youtuber]: {
    message: "You decided to be a Youtuber 🎥 and got your first ad revenue!",
    generateReward: async () => randomNumber(3_000, 10_000),
  },
  [Scenario.Streamer]: {
    message:
      "You decided to be a Twitch Streamer 📹 and got a few subscribers!",
    generateReward: async () => randomNumber(1_000, 5_000),
  },
  [Scenario.Hoe]: {
    message:
      "You decided to open an OnlyFans account and posted some feet pics. 📸",
    generateReward: async () => randomNumber(100, 1_000),
  },
  [Scenario.Flop]: {
    message:
      "You decided to be an YouTuber 🎥 and spent money on a video but it flopped miserably.",
    generateReward: async () => -20_000,
  },
  [Scenario.Logan]: {
    message:
      "You were caught in a massive internet drama bigger than Logan Paul's Japan Controversy! ☠️",
    generateReward: async () => -randomNumber(100_000, 200_000),
  },
  [Scenario.Instagram]: {
    message: "You decided to be Instagram influencer! 📷",
    generateReward: async () => randomNumber(1_000, 3_000),
  },
  [Scenario.Tiktok]: {
    message: "You decided to be a TikToker. 🤳",
    generateReward: async () => randomNumber(500, 2_500),
  },
  [Scenario.Failure]: {
    message: "After years of trying you failed as an influencer. 😔",
    generateReward: async () => -randomNumber(10_000, 15_000),
  },
  [Scenario.Junkie]: {
    message:
      "You decided to post your feet pics on OnlyFans and it failed miserably and lost all of your subscribers. 💀",
    generateReward: async () => -randomNumber(50_000, 100_000),
  },
};

export const influencer = {
  data: new SlashCommandBuilder()
    .setName("influencer")
    .setDescription("Become an influencer"),
  async execute(interaction: Interaction) {
    if (!interaction.isRepliable() || !interaction.isChatInputCommand()) {
      return;
    }

    const guildId = interaction.guild?.id;

    if (!guildId) {
      return await interaction.reply(
        "This command can only be used in a server.",
      );
    }

    const guard = await guardEconomyChannel(
      guildId,
      interaction.channelId,
      interaction.user.id,
    );

    if (guard) {
      return await interaction.reply({
        ephemeral: true,
        ...guard,
      });
    }

    const coolDown = coolDowns.INFLUENCER;

    const lastUses = await prisma.work.findMany({
      where: {
        type: WorkType.Influencer,
        createdAt: {
          gte: new Date(Date.now() - coolDown),
        },
        userDiscordId: interaction.user.id,
        guildDiscordId: guildId,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: workCommandUses.INFLUENCER,
    });

    if (lastUses.length >= workCommandUses.INFLUENCER) {
      const lastUse = lastUses.at(-1);

      if (!lastUse) {
        return await interaction.reply({
          content: "Hmm, something went wrong. Please try again later.",
        });
      }

      return await interaction.reply({
        content: sprintf(
          "You are tired from influencing people. Try again <t:%s:R>",
          Math.floor((lastUse.createdAt.getTime() + coolDown) / 1000),
        ),
      });
    }

    const randomizedScenario = getRandomizedScenario(computedOdds);

    const { generateReward, message } = rewards[randomizedScenario];
    const reward = await generateReward();
    const wallet = await createWallet(interaction.user.id, guildId);

    const userClan = await prisma.clan.findFirst({
      where: {
        members: {
          some: {
            discordUserId: interaction.user.id,
          },
        },
        discordGuildId: guildId,
      },
      select: {
        level: true,
      },
    });

    const clanBonusMultiplier =
      reward < 0 ? 0 : userClan?.level ? userClan.level / 20 : 0;

    const clanBonus = Math.round(reward * clanBonusMultiplier);
    const totalReward = reward + clanBonus;

    await prisma.$transaction([
      prisma.work.create({
        data: {
          userDiscordId: interaction.user.id,
          guildDiscordId: guildId,
          type: WorkType.Influencer,
        },
      }),
      prisma.wallet.update({
        where: {
          id: wallet.id,
        },
        data: {
          balance: {
            increment: totalReward,
          },
        },
      }),
    ]);

    const makeDollars = addCurrency();

    const embed = new EmbedBuilder()
      .setColor(reward > 0 ? Colors.Success : Colors.Error)
      .setTitle(workTitle(totalReward))
      .setDescription(
        sprintf(
          "%s%s",
          message,
          clanBonusMultiplier > 0 && totalReward > 0
            ? sprintf(
                " Clan bonus: **+%s** (%s)",
                makeDollars(formatNumber(clanBonus)),
                `${((clanBonusMultiplier + 1) * 100 - 100).toFixed(0)}%`,
              )
            : "",
        ),
      );

    if (lastUses.length === workCommandUses.INFLUENCER - 1) {
      const nextInfluencer = sprintf(
        "Next Influencing <t:%d:R>",
        Math.floor((Date.now() + coolDown) / 1000),
      );
      embed.setDescription(
        [embed.data.description, nextInfluencer]
          .filter((v): v is string => v != null)
          .join("\n"),
      );
    } else {
      const count = workCommandUses.INFLUENCER - lastUses.length - 1;
      const word = count === 1 ? "use" : "uses";
      embed.setFooter({
        text: sprintf("%d %s left", count, word),
      });
    }

    return await interaction.reply({
      embeds: [embed],
    });
  },
} satisfies Command;
