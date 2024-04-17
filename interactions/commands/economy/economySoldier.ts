import {
  EmbedBuilder,
  type Interaction,
  SlashCommandBuilder,
} from "discord.js";
import { sprintf } from "sprintf-js";
import { createWallet } from "~/common/logic/economy/createWallet";
import { guardEconomyChannel } from "~/common/logic/guildConfig/guardEconomyChannel";
import { Colors, type Command } from "~/common/types";
import { addCurrency } from "~/common/utils/addCurrency";
import { formatNumber } from "~/common/utils/formatNumber";
import { randomNumber } from "~/common/utils/randomNumber";
import { prisma } from "~/prisma";
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
  SuicideBomber = "SUICIDE_BOMBER",
  Terrorist = "TERRORIST",
  Coward = "COWARD",
  InjuredInCombat = "INJURED_IN_COMBAT",
}

const odds: Record<Scenario, number> = {
  [Scenario.Infantry]: 30,
  [Scenario.AirForce]: 10,
  [Scenario.Navy]: 10,
  [Scenario.Marines]: 10,
  [Scenario.CoastGuard]: 10,
};

const computedOdds = stackOdds(odds);

const rewards: Record<
  Scenario,
  {
    message: string;
    generateReward: () => Promise<number>;
  }
> = {
  [Scenario.Hooker]: {
    message: "You worked as a hooker.",
    generateReward: async () => randomNumber(10_000, 15_000),
  },
  [Scenario.Gigolo]: {
    message:
      "You did some gigolo work which pays less than hookers because of income inequality.",
    generateReward: async () => randomNumber(5_000, 10_000),
  },
  [Scenario.CamGirl]: {
    message:
      "You logged onto a cam site and made a few bucks filming yourself.",
    generateReward: async () => randomNumber(1_000, 2_000),
  },
  [Scenario.OnlyFans]: {
    message: "Your only fans simps paid you.",
    generateReward: async () => randomNumber(3_000, 4_000),
  },
  [Scenario.SugarBaby]: {
    message:
      "Your sugar daddy gave you some pocket money in exchange for some nasty favors.",
    generateReward: async () => randomNumber(2_000, 2_500),
  },
  [Scenario.MethHead]: {
    message: "You spent almost all your hooker money on meth.",
    generateReward: async () => randomNumber(50, 100),
  },
  [Scenario.Scammed]: {
    message: "You got scammed.",
    generateReward: async () => -randomNumber(3_000, 5_000),
  },
  [Scenario.TooUgly]: {
    message: "You're too ugly to sell your body.",
    generateReward: async () => -randomNumber(0, 100),
  },
};

export const soldier = {
  data: new SlashCommandBuilder()
    .setName("prostitute")
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

    const coolDown = coolDowns.PROSTITUTE;

    const lastUses = await prisma.work.findMany({
      where: {
        type: WorkType.Prostitute,
        createdAt: {
          gte: new Date(Date.now() - coolDown),
        },
        userDiscordId: interaction.user.id,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: workCommandUses.PROSTITUTE,
    });

    if (lastUses.length >= workCommandUses.PROSTITUTE) {
      const lastUse = lastUses.at(-1);

      if (!lastUse) {
        return await interaction.reply({
          content: "Hmm, something went wrong. Please try again later.",
        });
      }

      return await interaction.reply({
        content: sprintf(
          "You're all spent! You can get back on the streets <t:%s:R>",
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
      reward < 0 ? 0 : userClan?.level ? userClan.level / 30 : 0;

    const clanBonus = Math.round(reward * clanBonusMultiplier);
    const totalReward = reward + clanBonus;

    await prisma.$transaction([
      prisma.work.create({
        data: {
          userDiscordId: interaction.user.id,
          guildDiscordId: guildId,
          type: WorkType.Prostitute,
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

    if (lastUses.length === workCommandUses.PROSTITUTE - 1) {
      const nextProstitution = sprintf(
        "Next use <t:%d:R>",
        Math.floor((Date.now() + coolDown) / 1000),
      );
      embed.setDescription(
        [embed.data.description, nextProstitution]
          .filter((v): v is string => v != null)
          .join("\n"),
      );
    } else {
      const count = workCommandUses.PROSTITUTE - lastUses.length - 1;
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
