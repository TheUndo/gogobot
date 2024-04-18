import { createWallet } from "!/common/logic/economy/createWallet";
import { guardEconomyChannel } from "!/common/logic/guildConfig/guardEconomyChannel";
import { Colors, type Command } from "!/common/types";
import { addCurrency } from "!/common/utils/addCurrency";
import { formatNumber } from "!/common/utils/formatNumber";
import { randomNumber } from "!/common/utils/randomNumber";
import { prisma } from "!/prisma";
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
  Kraken = "KRAKEN",
  Whale = "WHALE",
  Shark = "SHARK",
  BigFish = "BIG_FISH",
  SmallFish = "SMALL_FISH",
  Shoe = "SHOE",
  Squid = "SQUID",
  Turtle = "TURTLE",
  Seaweed = "SEAWEED",
  Starfish = "STARFISH",
  HiddenTreasure = "HIDDEN_TREASURE",
  Jellyfish = "JELLYFISH",
  Nothing = "NOTHING",
  PirateAttack = "PIRATE_ATTACK",
}

const odds: Record<Scenario, number> = {
  [Scenario.Kraken]: 5,
  [Scenario.Whale]: 40,
  [Scenario.Shark]: 150,
  [Scenario.BigFish]: 370,
  [Scenario.SmallFish]: 400,
  [Scenario.Shoe]: 100,
  [Scenario.Squid]: 50,
  [Scenario.Turtle]: 50,
  [Scenario.Seaweed]: 50,
  [Scenario.HiddenTreasure]: 100,
  [Scenario.Jellyfish]: 100,
  [Scenario.Starfish]: 100,
  [Scenario.Nothing]: 30,
  [Scenario.PirateAttack]: 30,
};

const computedOdds = stackOdds(odds);

const rewards: Record<
  Scenario,
  {
    message: string;
    generateReward: () => Promise<number>;
  }
> = {
  [Scenario.Whale]: {
    message: "You caught a whale! 🐋",
    generateReward: async () => 50_000,
  },
  [Scenario.Shark]: {
    message: "You caught a shark! 🦈",
    generateReward: async () => 15_000,
  },
  [Scenario.BigFish]: {
    message: "You caught a big fish! 🐟",
    generateReward: async () => randomNumber(1_000, 1_300),
  },
  [Scenario.SmallFish]: {
    message: "You caught a small fish! 🐠",
    generateReward: async () => randomNumber(500, 800),
  },
  [Scenario.Shoe]: {
    message: "You caught a shoe! 👞",
    generateReward: async () => randomNumber(0, 200),
  },
  [Scenario.Nothing]: {
    message: "You caught nothing... 🎣",
    generateReward: async () => 0,
  },
  [Scenario.Squid]: {
    message: "You caught a squid! 🦑",
    generateReward: async () => randomNumber(200, 400),
  },
  [Scenario.Turtle]: {
    message: "You caught a turtle! 🐢",
    generateReward: async () => randomNumber(200, 400),
  },
  [Scenario.Seaweed]: {
    message: "You caught seaweed! 🌿",
    generateReward: async () => randomNumber(0, 30),
  },
  [Scenario.HiddenTreasure]: {
    message: "You found a hidden treasure! 💰",
    generateReward: async () => randomNumber(5_000, 10_000),
  },
  [Scenario.Jellyfish]: {
    message: "You caught a jellyfish! 🎐",
    generateReward: async () => randomNumber(0, 500),
  },
  [Scenario.Starfish]: {
    message: "You caught a starfish! ⭐",
    generateReward: async () => randomNumber(0, 400),
  },
  [Scenario.PirateAttack]: {
    message: "You were attacked by pirates! 💣",
    generateReward: async () => -randomNumber(5_000, 10_000),
  },
  [Scenario.Kraken]: {
    message: "The Call of Cthulhu! You caught a kraken monster 🦑",
    generateReward: async () => 1_200_000,
  },
};

export const fish = {
  data: new SlashCommandBuilder().setName("fish").setDescription("Go fishing!"),
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

    const coolDown = coolDowns.FISH;

    const lastUses = await prisma.work.findMany({
      where: {
        type: WorkType.Fish,
        createdAt: {
          gte: new Date(Date.now() - coolDown),
        },
        userDiscordId: interaction.user.id,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: workCommandUses.FISH,
    });

    if (lastUses.length >= workCommandUses.FISH) {
      const lastUse = lastUses.at(-1);

      if (!lastUse) {
        return await interaction.reply({
          content: "Hmm, something went wrong. Please try again later.",
        });
      }

      return await interaction.reply({
        content: sprintf(
          "You scared all the fish away. Try your luck <t:%s:R>",
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
          type: WorkType.Fish,
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
          clanBonusMultiplier > 0 && reward > 0
            ? sprintf(
                " Clan bonus: **+%s** (%s)",
                makeDollars(formatNumber(clanBonus)),
                `${((clanBonusMultiplier + 1) * 100 - 100).toFixed(0)}%`,
              )
            : "",
        ),
      );

    if (lastUses.length === workCommandUses.FISH - 1) {
      const nextFish = sprintf(
        "Next fish <t:%d:R>",
        Math.floor((Date.now() + coolDown) / 1000),
      );
      embed.setDescription(
        [embed.data.description, nextFish]
          .filter((v): v is string => v != null)
          .join("\n"),
      );
    } else {
      const count = workCommandUses.FISH - lastUses.length - 1;
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
