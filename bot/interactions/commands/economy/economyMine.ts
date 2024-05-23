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
  ItemType,
  Resources,
  ShopItemType,
  resourceEmojis,
  toolEmojis,
  toolIds,
  toolNames,
} from "./lib/shopCatalogue";
import { sellResourceItems } from "./lib/shopItems";
import { stackOdds } from "./lib/stackOdds";
import { WorkType, coolDowns, workCommandUses } from "./lib/workConfig";

const rewards: Record<
  Resources,
  {
    message: string;
    generateReward: (pickaxe: ShopItemType) => Promise<number>;
  }
> = {
  [Resources.Copper]: {
    message: sprintf("You found copper! %s", resourceEmojis.COPPER),
    generateReward: async (pickaxe: ShopItemType) =>
      await getResourceQuantity(pickaxe, Resources.Copper),
  },
  [Resources.Silver]: {
    message: sprintf("You found silver! %s", resourceEmojis.SILVER),
    generateReward: async (pickaxe: ShopItemType) =>
      await getResourceQuantity(pickaxe, Resources.Silver),
  },
  [Resources.Iron]: {
    message: sprintf("You found iron! %s", resourceEmojis.IRON),
    generateReward: async (pickaxe: ShopItemType) =>
      await getResourceQuantity(pickaxe, Resources.Iron),
  },
  [Resources.Titanium]: {
    message: sprintf("You found titanium! %s", resourceEmojis.TITANIUM),
    generateReward: async (pickaxe: ShopItemType) =>
      await getResourceQuantity(pickaxe, Resources.Titanium),
  },
  [Resources.Gold]: {
    message: sprintf("You found gold! %s", resourceEmojis.GOLD),
    generateReward: async (pickaxe: ShopItemType) =>
      await getResourceQuantity(pickaxe, Resources.Gold),
  },
  [Resources.Emerald]: {
    message: sprintf("You found an emerald! %s", resourceEmojis.EMERALD),
    generateReward: async (pickaxe: ShopItemType) =>
      await getResourceQuantity(pickaxe, Resources.Emerald),
  },
  [Resources.Diamond]: {
    message: sprintf("You found diamond! %s", resourceEmojis.DIAMOND),
    generateReward: async (pickaxe: ShopItemType) =>
      await getResourceQuantity(pickaxe, Resources.Diamond),
  },
  [Resources.Netherite]: {
    message: sprintf("You found netherite! %s", resourceEmojis.NETHERITE),
    generateReward: async (pickaxe: ShopItemType) =>
      await getResourceQuantity(pickaxe, Resources.Netherite),
  },
  [Resources.Kryptonite]: {
    message: sprintf("You found kryptonite! %s", resourceEmojis.KRYPTONITE),
    generateReward: async (pickaxe: ShopItemType) =>
      getResourceQuantity(pickaxe, Resources.Kryptonite),
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
  [Resources.Titanium]: 4,
  [Resources.Gold]: 6,
  [Resources.Emerald]: 8,
  [Resources.Diamond]: 10,
  [Resources.Netherite]: 10,
  [Resources.Kryptonite]: 10,
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
          { name: "Stone Pickaxe", value: ShopItemType.StonePickaxe },
          { name: "Iron Pickaxe", value: ShopItemType.IronPickaxe },
          { name: "Diamond Pickaxe", value: ShopItemType.DiamondPickaxe },
        ),
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
        guildDiscordId: guildId,
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
          content: "Hmm, something went wrong, Please try again later.",
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

    const pickaxes = inventory
      .filter((tool) => tool.type === ItemType.Tools)
      .filter((tool) => tool.itemId.endsWith("PICKAXE"));

    const selectedPickaxe = interaction.options.getString("pickaxe")
      ? z
          .nativeEnum(ShopItemType)
          .parse(interaction.options.getString("pickaxe"))
      : pickaxes.length >= 1
        ? z
            .nativeEnum(ShopItemType)
            .parse(
              (Object.keys(toolIds) as Array<ShopItemType>).find(
                (key) => toolIds[key] === pickaxes[0]?.itemId,
              ),
            )
        : ShopItemType.StonePickaxe;

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

    /**Resource gathering starts from here!*/
    const randomizedResources = getRandomizedResources(selectedPickaxe);

    if (!randomizedResources) {
      return await interaction.reply({
        content: "Something went wrong, Please try again!",
        ephemeral: true,
      });
    }

    const { generateReward, message } = rewards[randomizedResources];
    const resourceData = sellResourceItems[randomizedResources];
    const reward = await generateReward(selectedPickaxe);

    const resourceQuantity = await getResourceQuantity(
      selectedPickaxe,
      randomizedResources,
    );
    const decrement = decrementDurability[randomizedResources];

    /**Checks if the ResourceData has an ID which would indicate that it's a resource, Else it would normally send it to scenario */
    if (resourceData.id !== "" && resourceData.sellPrice !== 0) {
      const shopItemData = Array.from({ length: resourceQuantity }, () => ({
        type: ItemType.Resources,
        itemId: resourceData.id,
        walletId: wallet.id,
      }));

      await prisma.$transaction([
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
        prisma.shopItem.createMany({
          data: shopItemData,
        }),
      ]);
    } else {
      await prisma.$transaction([
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
              increment: reward,
            },
          },
        }),
      ]);
    }

    const pickaxesUpdated = await prisma.shopItem.findFirst({
      where: {
        walletId: wallet.id,
        itemId: pickaxe.itemId,
      },
    });

    if (
      pickaxesUpdated?.durability != null &&
      pickaxesUpdated.durability <= 0
    ) {
      await prisma.shopItem.delete({
        where: {
          id: pickaxesUpdated.id,
        },
      });
    }

    const embed = new EmbedBuilder()
      .setColor(reward > 0 ? Colors.Success : Colors.Error)
      .setTitle(mineTitle(reward, resourceData))
      .setDescription(
        sprintf(
          "%s\n\n%s",
          message,
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

type resourceDataType = {
  name: string;
  emoji: string;
};

/**Formats the embed Title according to the Mine data provided*/
const mineTitle = (reward: number, resourceData: resourceDataType) => {
  if (reward <= 0) {
    return sprintf(
      "You lost %s",
      addCurrency()(formatNumber(Math.abs(reward))),
    );
  }

  return sprintf("+%s %s", reward, resourceData.emoji);
};

/**Gets the possibilities for the resource to be spawned when mining with a specific pickaxe.*/
const getRandomizedResources = (pickaxe: ShopItemType) => {
  const odds: Record<Resources, number> = match(pickaxe)
    .with(ShopItemType.StonePickaxe, () => ({
      [Resources.Copper]: 100,
      [Resources.Silver]: 40,
      [Resources.Iron]: 80,
      [Resources.Titanium]: 50,
      [Resources.Gold]: 2,
      [Resources.Emerald]: 1,
      [Resources.Diamond]: 0,
      [Resources.Netherite]: 0,
      [Resources.Kryptonite]: 0,
      [Resources.RockSlide]: 30,
      [Resources.DeadEnd]: 30,
      [Resources.Nothing]: 30,
      [Resources.Ambush]: 1,
    }))
    .with(ShopItemType.IronPickaxe, () => ({
      [Resources.Copper]: 60,
      [Resources.Silver]: 90,
      [Resources.Iron]: 100,
      [Resources.Titanium]: 60,
      [Resources.Gold]: 30,
      [Resources.Emerald]: 6,
      [Resources.Diamond]: 5,
      [Resources.Netherite]: 1,
      [Resources.Kryptonite]: 0,
      [Resources.RockSlide]: 20,
      [Resources.DeadEnd]: 20,
      [Resources.Nothing]: 20,
      [Resources.Ambush]: 3,
    }))
    .with(ShopItemType.DiamondPickaxe, () => ({
      [Resources.Copper]: 30,
      [Resources.Silver]: 30,
      [Resources.Iron]: 30,
      [Resources.Titanium]: 50,
      [Resources.Gold]: 80,
      [Resources.Emerald]: 15,
      [Resources.Diamond]: 10,
      [Resources.Netherite]: 3,
      [Resources.Kryptonite]: 1,
      [Resources.RockSlide]: 15,
      [Resources.DeadEnd]: 15,
      [Resources.Nothing]: 15,
      [Resources.Ambush]: 5,
    }))
    .run();

  const computedOdds = stackOdds(odds);

  return getRandomizedScenario(computedOdds);
};

/**Gets the possibilities for the resource quantity depending on the pickaxe type */
const getResourceQuantity = async (
  pickaxe: ShopItemType,
  resource: Resources,
) => {
  const quantity: Record<Resources, number> = match(pickaxe)
    .with(ShopItemType.StonePickaxe, () => ({
      [Resources.Copper]: randomNumber(1, 4),
      [Resources.Silver]: randomNumber(1, 3),
      [Resources.Iron]: randomNumber(1, 2),
      [Resources.Titanium]: 1,
      [Resources.Gold]: 1,
      [Resources.Emerald]: 1,
      [Resources.Diamond]: 0,
      [Resources.Netherite]: 0,
      [Resources.Kryptonite]: 0,
      [Resources.RockSlide]: 0,
      [Resources.DeadEnd]: 0,
      [Resources.Nothing]: 0,
      [Resources.Ambush]: 0,
    }))
    .with(ShopItemType.IronPickaxe, () => ({
      [Resources.Copper]: randomNumber(3, 6),
      [Resources.Silver]: randomNumber(2, 5),
      [Resources.Iron]: randomNumber(3, 6),
      [Resources.Titanium]: randomNumber(1, 4),
      [Resources.Gold]: randomNumber(1, 3),
      [Resources.Emerald]: randomNumber(1, 2),
      [Resources.Diamond]: randomNumber(1, 2),
      [Resources.Netherite]: 1,
      [Resources.Kryptonite]: 0,
      [Resources.RockSlide]: 0,
      [Resources.DeadEnd]: 0,
      [Resources.Nothing]: 0,
      [Resources.Ambush]: 0,
    }))
    .with(ShopItemType.DiamondPickaxe, () => ({
      [Resources.Copper]: randomNumber(7, 15),
      [Resources.Silver]: randomNumber(5, 13),
      [Resources.Iron]: randomNumber(3, 8),
      [Resources.Titanium]: randomNumber(2, 5),
      [Resources.Gold]: randomNumber(3, 7),
      [Resources.Emerald]: randomNumber(1, 4),
      [Resources.Diamond]: randomNumber(1, 3),
      [Resources.Netherite]: randomNumber(1, 3),
      [Resources.Kryptonite]: 1,
      [Resources.RockSlide]: 0,
      [Resources.DeadEnd]: 0,
      [Resources.Nothing]: 0,
      [Resources.Ambush]: 0,
    }))
    .run();

  return quantity[resource];
};
