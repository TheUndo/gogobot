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
import { match } from "ts-pattern";
import { z } from "zod";
import { getRandomizedScenario } from "./lib/getRandomizedScenario";
import {
  ToolTypes,
  itemType,
  toolEmojis,
  toolIds,
  toolNames,
} from "./lib/shopConfig";
import { stackOdds } from "./lib/stackOdds";
import { WorkType, coolDowns, workCommandUses } from "./lib/workConfig";
import { workTitle } from "./lib/workTitle";

enum Resources {
  Copper = "COPPER", // 1k
  Silver = "SILVER", //10k
  Iron = "IRON", //50k
  Gold = "GOLD", // 100k
  Emerald = "EMERALD", // 500k
  Diamond = "DIAMOND", //1m
  RockSlide = "ROCK_FALL", //-10k
  DeadEnd = "DEAD_END", // 0
  Nothing = "NOTHING", // 0
  Ambush = "AMBUSH", // -100k
}

// const odds: Record<Resources, number> = {
//   [Resources.Copper]: 100,
//   [Resources.Silver]: 100,
//   [Resources.Iron]: 30,
//   [Resources.Gold]: 20,
//   [Resources.Emerald]: 4,
//   [Resources.Diamond]: 1,
//   [Resources.RockSlide]: 30,
//   [Resources.DeadEnd]: 30,
//   [Resources.Nothing]: 30,
//   [Resources.Ambush]: 10,
// };

// const computedOdds = stackOdds(odds);

const rewards: Record<
  Resources,
  { message: string; generateReward: () => Promise<number> }
> = {
  [Resources.Copper]: {
    message: "You found copper! ⛏️",
    generateReward: async () => randomNumber(500, 1_000),
  },
  [Resources.Silver]: {
    message: "You found silver! ⛏️",
    generateReward: async () => randomNumber(30_000, 50_000),
  },
  [Resources.Iron]: {
    message: "You found iron! ⛏️",
    generateReward: async () => randomNumber(5_000, 10_000),
  },
  [Resources.Gold]: {
    message: "You found gold! ⛏️",
    generateReward: async () => randomNumber(75_000, 100_000),
  },
  [Resources.Emerald]: {
    message: "You found an emerald! ⛏️",
    generateReward: async () => randomNumber(250_000, 500_000),
  },
  [Resources.Diamond]: {
    message: "You found Diamond! 💎",
    generateReward: async () => randomNumber(1_000_000, 1_200_000),
  },
  [Resources.RockSlide]: {
    message: "You were caught on a rockslide and had to pay for injuries. 🩹",
    generateReward: async () => -randomNumber(7_000, 10_000),
  },
  [Resources.DeadEnd]: {
    message: "You reached a dead end and had to return empty handed. 🧱",
    generateReward: async () => 0,
  },
  [Resources.Nothing]: {
    message: "After hours of mining you found nothing. 🚫",
    generateReward: async () => 0,
  },
  [Resources.Ambush]: {
    message: "While mining you were ambushed by goblins! 👽",
    generateReward: async () => -randomNumber(50_000, 75_000),
  },
};

const decrementDurability: Record<Resources, number> = {
  [Resources.Copper]: 2,
  [Resources.Silver]: 5,
  [Resources.Iron]: 3,
  [Resources.Gold]: 6,
  [Resources.Emerald]: 8,
  [Resources.Diamond]: 10,
  [Resources.RockSlide]: 0,
  [Resources.DeadEnd]: 0,
  [Resources.Nothing]: 0,
  [Resources.Ambush]: 0,
};

export const mine = {
  data: new SlashCommandBuilder()
    .setName("mine")
    .setDescription("Head to the mine to get some resources")
    .addStringOption((options) =>
      options
        .setName("pickaxe")
        .setDescription("Choose which pickaxe you wanna use.")
        .setChoices(
          { name: "Stone Pickaxe", value: ToolTypes.StonePickaxe },
          { name: "Iron Pickaxe", value: ToolTypes.IronPickaxe },
          { name: "Diamond Pickaxe", value: ToolTypes.DiamondPickaxe },
        )
        .setRequired(true),
    ),
  async execute(interaction: Interaction) {
    if (!interaction.isRepliable() || !interaction.isChatInputCommand()) {
      return;
    }

    const guildId = interaction.guild?.id;

    if (!guildId) {
      return await interaction.reply({
        content: "This command can only be used in a Server.",
        ephemeral: true,
      });
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

    const coolDown = coolDowns.MINE;

    const lastUses = await prisma.work.findMany({
      where: {
        type: WorkType.Mine,
        createdAt: {
          gte: new Date(Date.now() - coolDown),
        },
        userDiscordId: interaction.user.id,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: workCommandUses.MINE,
    });

    if (lastUses.length >= workCommandUses.MINE) {
      const lastUse = lastUses.at(-1);

      if (!lastUse) {
        return await interaction.reply({
          content: "Hmm, something went wrong, Please try agian later.",
        });
      }

      return await interaction.reply({
        content: sprintf(
          "You are too tired to enter the mine, visit again <t:%s:R>",
          Math.floor((lastUse.createdAt.getTime() + coolDown) / 1000),
        ),
      });
    }

    const wallet = await createWallet(interaction.user.id, guildId);
    const inventory = await prisma.shopItem.findMany({
      where: {
        walletId: wallet.id,
      },
    });

    const pickaxes = inventory.filter((tool) => tool.type === itemType.Tools);
    const selectedPickaxe = z
      .nativeEnum(ToolTypes)
      .parse(interaction.options.getString("pickaxe"));

    const pickaxe = pickaxes.find(
      (pick) => pick.itemId === toolIds[selectedPickaxe],
    );

    if (!pickaxe) {
      return await interaction.reply({
        content: sprintf(
          "You don't have a %s|%s. Purchase one from `/shop buy`",
          toolEmojis[selectedPickaxe],
          toolNames[selectedPickaxe],
        ),
        ephemeral: true,
      });
    }

    const randomizedResources = getRandomizedResources(selectedPickaxe);

    if (!randomizedResources) {
      return await interaction.reply({
        content: "Something went wrong, Please try again!",
        ephemeral: true,
      });
    }

    const { generateReward, message } = rewards[randomizedResources];
    const decrement = decrementDurability[randomizedResources];
    const reward = await generateReward();

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
      reward < 0 ? 0 : userClan?.level ? userClan.level / 40 : 0;

    const clanBonus = Math.round(reward * clanBonusMultiplier);
    const totalReward = reward + clanBonus;

    const [pickaxeUpdated] = await prisma.$transaction([
      prisma.shopItem.updateMany({
        where: {
          walletId: wallet.id,
          itemId: pickaxe.itemId,
        },

        data: {
          durability: {
            decrement,
          },
        },
      }),
      prisma.work.create({
        data: {
          userDiscordId: interaction.user.id,
          guildDiscordId: guildId,
          type: WorkType.Mine,
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

    if (pickaxeUpdated.count === 0) {
      return await interaction.reply({
        content:
          "Something went wrong while updating the pickaxe, Contact an Adminstrator",
        ephemeral: true,
      });
    }

    const pickaxesUpdated = await prisma.shopItem.findFirst({
      where: {
        walletId: wallet.id,
        itemId: pickaxe.itemId,
      },
    });

    if (pickaxesUpdated?.durability && pickaxesUpdated.durability <= 0) {
      await prisma.shopItem.delete({
        where: {
          id: pickaxesUpdated.id,
        },
      });
    }

    const embed = new EmbedBuilder()
      .setColor(reward > 0 ? Colors.Success : Colors.Error)
      .setTitle(workTitle(totalReward))
      .setDescription(
        sprintf(
          "%s%s\n\n%s",
          message,
          clanBonusMultiplier > 0 && totalReward > 0
            ? sprintf(
                "Clan Bonus: **+%s** (%s)",
                makeDollars(formatNumber(clanBonus)),
                `${((clanBonusMultiplier + 1) * 100 - 100).toFixed(0)}%`,
              )
            : "",
          pickaxesUpdated?.durability && pickaxesUpdated?.durability <= 0
            ? `Your ${toolEmojis[selectedPickaxe]}|${toolNames[selectedPickaxe]} Broke`
            : `Your ${toolEmojis[selectedPickaxe]}|${toolNames[selectedPickaxe]} durability is ${pickaxesUpdated?.durability}`,
        ),
      );

    if (lastUses.length === workCommandUses.MINE - 1) {
      const nextMine = sprintf(
        "Next Mine <t:%d:R>",
        Math.floor((Date.now() + coolDown) / 1000),
      );

      embed.setDescription(
        [embed.data.description, nextMine]
          .filter((v): v is string => v != null)
          .join("\n"),
      );
    } else {
      const count = workCommandUses.MINE - lastUses.length - 1;
      const word = count === 1 ? "use" : "uses";
      embed.setFooter({
        text: sprintf("%d %s left", count, word),
      });
    }

    return await interaction.reply({ embeds: [embed] });
  },
} satisfies Command;

const getRandomizedResources = (pickaxe: ToolTypes) => {
  const odds: Record<Resources, number> = match(pickaxe)
    .with(ToolTypes.StonePickaxe, () => ({
      [Resources.Copper]: 100,
      [Resources.Silver]: 30,
      [Resources.Iron]: 80,
      [Resources.Gold]: 6,
      [Resources.Emerald]: 0,
      [Resources.Diamond]: 0,
      [Resources.RockSlide]: 30,
      [Resources.DeadEnd]: 30,
      [Resources.Nothing]: 30,
      [Resources.Ambush]: 1,
    }))
    .with(ToolTypes.IronPickaxe, () => ({
      [Resources.Copper]: 90,
      [Resources.Silver]: 60,
      [Resources.Iron]: 60,
      [Resources.Gold]: 30,
      [Resources.Emerald]: 1,
      [Resources.Diamond]: 1,
      [Resources.RockSlide]: 30,
      [Resources.DeadEnd]: 30,
      [Resources.Nothing]: 30,
      [Resources.Ambush]: 3,
    }))
    .with(ToolTypes.DiamondPickaxe, () => ({
      [Resources.Copper]: 50,
      [Resources.Silver]: 70,
      [Resources.Iron]: 50,
      [Resources.Gold]: 50,
      [Resources.Emerald]: 10,
      [Resources.Diamond]: 5,
      [Resources.RockSlide]: 30,
      [Resources.DeadEnd]: 30,
      [Resources.Nothing]: 30,
      [Resources.Ambush]: 5,
    }))
    .run();

  const computedOdds = stackOdds(odds);

  return getRandomizedScenario(computedOdds);
};
