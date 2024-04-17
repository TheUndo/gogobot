import {
  EmbedBuilder,
  type Interaction,
  SlashCommandBuilder,
} from "discord.js";
import { sprintf } from "sprintf-js";
import { createWallet } from "!/common/logic/economy/createWallet";
import { guardEconomyChannel } from "!/common/logic/guildConfig/guardEconomyChannel";
import { Colors, type Command } from "!/common/types";
import { addCurrency } from "!/common/utils/addCurrency";
import { formatNumber } from "!/common/utils/formatNumber";
import { randomNumber } from "!/common/utils/randomNumber";
import { prisma } from "!/prisma";
import { getRandomizedScenario } from "./lib/getRandomizedScenario";
import { stackOdds } from "./lib/stackOdds";
import { WorkType, coolDowns, workCommandUses } from "./lib/workConfig";
import { workTitle } from "./lib/workTitle";

enum Scenario {
  Infantry = "INFANTRY",
  AirForce = "AIR_FORCE",
  Navy = "NAVY",
  Marines = "MARINES",
  CoastGuard = "COAST_GUARD",
  Coward = "COWARD",
  InjuredInCombat = "INJURED_IN_COMBAT",
  DishonorablyDischarged = "DISHONORABLY_DISCHARGED",
}

const odds: Record<Scenario, number> = {
  [Scenario.Infantry]: 30,
  [Scenario.AirForce]: 10,
  [Scenario.Navy]: 10,
  [Scenario.Marines]: 10,
  [Scenario.CoastGuard]: 10,
  [Scenario.DishonorablyDischarged]: 10,
  [Scenario.Coward]: 10,
  [Scenario.InjuredInCombat]: 10,
};

const computedOdds = stackOdds(odds);

const rewards: Record<
  Scenario,
  {
    message: string;
    generateReward: () => Promise<number>;
  }
> = {
  [Scenario.Infantry]: {
    message: "You enlisted in the infantry.",
    generateReward: async () => randomNumber(50_000, 55_000),
  },
  [Scenario.AirForce]: {
    message: "You enlisted in the Air Force.",
    generateReward: async () => randomNumber(30_000, 35_000),
  },
  [Scenario.Navy]: {
    message: "You enlisted in the Navy.",
    generateReward: async () => randomNumber(30_000, 35_000),
  },
  [Scenario.Marines]: {
    message: "You enlisted in the Marines.",
    generateReward: async () => randomNumber(30_000, 35_000),
  },
  [Scenario.CoastGuard]: {
    message: "You enlisted in the Coast Guard.",
    generateReward: async () => randomNumber(30_000, 35_000),
  },
  [Scenario.Coward]: {
    message: "You were too scared to enlist.",
    generateReward: async () => -randomNumber(5_000, 8_000),
  },
  [Scenario.InjuredInCombat]: {
    message: "You were injured in combat.",
    generateReward: async () => -randomNumber(1_000, 3_000),
  },
  [Scenario.DishonorablyDischarged]: {
    message: "You were dishonorably discharged.",
    generateReward: async () => -randomNumber(2_000, 3_000),
  },
};

export const soldier = {
  data: new SlashCommandBuilder()
    .setName("soldier")
    .setDescription("Become a soldier."),
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

    const coolDown = coolDowns.SOLDIER;

    const lastUses = await prisma.work.findMany({
      where: {
        type: WorkType.Soldier,
        createdAt: {
          gte: new Date(Date.now() - coolDown),
        },
        userDiscordId: interaction.user.id,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: workCommandUses.SOLDIER,
    });

    if (lastUses.length >= workCommandUses.SOLDIER) {
      const lastUse = lastUses.at(-1);

      if (!lastUse) {
        return await interaction.reply({
          content: "Hmm, something went wrong. Please try again later.",
        });
      }

      return await interaction.reply({
        content: sprintf(
          "It's peaceful right now. But the war is coming <t:%s:R>",
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
          type: WorkType.Soldier,
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

    if (lastUses.length === workCommandUses.SOLDIER - 1) {
      const nextSoldier = sprintf(
        "Next use <t:%d:R>",
        Math.floor((Date.now() + coolDown) / 1000),
      );
      embed.setDescription(
        [embed.data.description, nextSoldier]
          .filter((v): v is string => v != null)
          .join("\n"),
      );
    } else {
      const count = workCommandUses.SOLDIER - lastUses.length - 1;
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
