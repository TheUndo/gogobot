import { createWallet } from "!/bot/logic/economy/createWallet";
import { guardEconomyChannel } from "!/bot/logic/guildConfig/guardEconomyChannel";
import type { Command } from "!/bot/types";
import { addCurrency } from "!/bot/utils/addCurrency";
import { BigIntMath } from "!/bot/utils/bigIntMath";
import { formatNumber } from "!/bot/utils/formatNumber";
import { prisma } from "!/core/db/prisma";
import { type Interaction, SlashCommandBuilder } from "discord.js";
import { sprintf } from "sprintf-js";
import { z } from "zod";
import { getRandomizedScenario } from "./lib/getRandomizedScenario";
import { stackOdds } from "./lib/stackOdds";
import { WorkType, coolDowns } from "./lib/workConfig";

const failureCost = 10_000;

enum Scenario {
  CompleteSuccess = "COMPLETE_SUCCESS",
  PartialSuccess = "PARTIAL_SUCCESS",
  Failure = "FAILURE",
  Caught = "CAUGHT",
}

const odds: Record<Scenario, number> = {
  [Scenario.CompleteSuccess]: 30,
  [Scenario.PartialSuccess]: 50,
  [Scenario.Failure]: 15,
  [Scenario.Caught]: 7,
};

const computedOdds = stackOdds(odds);

export const rob = {
  data: new SlashCommandBuilder()
    .setName("rob")
    .setDescription("Rob someone")
    .addUserOption((option) =>
      option
        .setName("user")
        .setDescription("User you wish to rob")
        .setRequired(true),
    ),
  async execute(interaction: Interaction) {
    if (!interaction.isRepliable() || !interaction.isCommand()) {
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

    const robber = interaction.user;
    const victim = interaction.options.getUser("user");

    if (!victim) {
      return await interaction.reply("Invalid user (505)");
    }

    if (victim.bot) {
      return await interaction.reply({
        content: "You can't rob bots.",
        ephemeral: true,
      });
    }

    if (robber.id === victim.id) {
      return await interaction.reply({
        content: "You can't rob yourself.",
        ephemeral: true,
      });
    }

    const [robberClan, victimClan] = await Promise.all([
      prisma.clan.findFirst({
        where: {
          members: {
            some: {
              discordUserId: robber.id,
            },
          },
          discordGuildId: guildId,
        },
      }),
      prisma.clan.findFirst({
        where: {
          members: {
            some: {
              discordUserId: victim.id,
            },
          },
          discordGuildId: guildId,
        },
      }),
    ]);

    if (robberClan && robberClan.id === victimClan?.id) {
      return await interaction.reply({
        content: "You can't rob your clan members.",
        ephemeral: true,
      });
    }

    const lastUsed = await prisma.work.findFirst({
      where: {
        userDiscordId: robber.id,
        guildDiscordId: guildId,
        type: WorkType.Rob,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    if (lastUsed && lastUsed.createdAt.getTime() + coolDowns.ROB > Date.now()) {
      return await interaction.reply({
        content: sprintf(
          "You're still hiding from the cops. Next rob <t:%d:R>",
          Math.floor((lastUsed.createdAt.getTime() + coolDowns.ROB) / 1000),
        ),
      });
    }

    const [_, victimWallet] = await Promise.all([
      createWallet(robber.id, guildId),
      createWallet(victim.id, guildId),
    ]);

    if (
      victimWallet.immuneUntil &&
      victimWallet.immuneUntil.getTime() > Date.now()
    ) {
      return await interaction.reply({
        content: sprintf(
          "<@%s> is still recovering from the last robbery. Next rob <t:%d:R>",
          victim.id,
          Math.floor(victimWallet.immuneUntil.getTime() / 1000),
        ),
      });
    }

    await prisma.work.create({
      data: {
        userDiscordId: robber.id,
        guildDiscordId: guildId,
        type: WorkType.Rob,
      },
    });

    if (victimWallet.balance < 1) {
      return await interaction.reply({
        content: sprintf("<@%s> is broke. Robbery failed.", victim.id),
      });
    }

    const randomizedScenario = getRandomizedScenario(computedOdds);

    const parsedScenario = z.nativeEnum(Scenario).safeParse(randomizedScenario);
    if (!randomizedScenario || !parsedScenario.success) {
      return await interaction.reply(
        "An error occurred. Please try again later.",
      );
    }

    const makeDollars = addCurrency();

    switch (parsedScenario.data) {
      case Scenario.CompleteSuccess: {
        await performRobbery({
          robberId: robber.id,
          victimId: victim.id,
          amount: victimWallet.balance,
          guildId,
        });

        return await interaction.reply({
          content: sprintf(
            "You successfully robbed <@%s> for **%s**!",
            victim.id,
            makeDollars(formatNumber(victimWallet.balance)),
          ),
        });
      }
      case Scenario.PartialSuccess: {
        const amount = (victimWallet.balance * 3n) / 4n;

        await performRobbery({
          robberId: robber.id,
          victimId: victim.id,
          amount,
          guildId,
        });

        return await interaction.reply({
          content: sprintf(
            "You successfully robbed <@%s> for **%s**!",
            victim.id,
            makeDollars(formatNumber(amount)),
          ),
        });
      }
      case Scenario.Failure: {
        return await interaction.reply({
          content: sprintf("You failed to rob <@%s>", victim.id),
        });
      }
      case Scenario.Caught: {
        await prisma.wallet.update({
          where: {
            userDiscordId_guildId: {
              userDiscordId: robber.id,
              guildId,
            },
          },
          data: {
            balance: {
              decrement: failureCost,
            },
          },
        });

        return await interaction.reply({
          content: sprintf(
            "You were caught trying to rob <@%s>! You got fined **%s**.",
            victim.id,
            makeDollars(formatNumber(failureCost)),
          ),
        });
      }
      default: {
        return await interaction.reply("Unreachable code");
      }
    }
  },
} satisfies Command;

type RobberyOptions = {
  guildId: string;
  robberId: string;
  victimId: string;
  amount: bigint;
};
async function performRobbery({
  robberId,
  victimId,
  amount,
  guildId,
}: RobberyOptions) {
  const immunityLength = amount < 100_000n ? 0n : amount * 10n;
  const immuneUntil = new Date(
    Number(
      BigInt(Date.now()) +
        BigIntMath.clamp(
          immunityLength,
          1000n * 60n * 2n,
          1000n * 60n * 60n * 24n * 4n,
        ),
    ),
  );
  return await prisma.$transaction([
    prisma.wallet.update({
      where: {
        userDiscordId_guildId: {
          userDiscordId: robberId,
          guildId,
        },
      },
      data: {
        immuneUntil: null,
        balance: {
          increment: amount,
        },
      },
    }),
    prisma.wallet.update({
      where: {
        userDiscordId_guildId: {
          userDiscordId: victimId,
          guildId,
        },
      },
      data: {
        lastRobbed: new Date(),
        immuneUntil,
        balance: {
          decrement: amount,
        },
      },
    }),
  ]);
}
