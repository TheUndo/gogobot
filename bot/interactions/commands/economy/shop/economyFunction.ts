import { getResource } from "!/bot/logic/inventory/getResource";
import { addCurrency } from "!/bot/utils/addCurrency";
import { formatItem } from "!/bot/utils/formatItem";
import { formatNumber } from "!/bot/utils/formatNumber";
import { prisma } from "!/core/db/prisma";
import type { Guild, User } from "discord.js";
import { sprintf } from "sprintf-js";
import { ItemType } from "../lib/shopConfig";
import { formatSellResourceItems } from "./economyShop";

type ResourceType = {
  user: User;
  guild: Guild;
  walletId: string;
  itemId: string;
  quantitySold: number;
};

export async function sellResources(resource: ResourceType) {
  const inventory = await prisma.shopItem.findMany({
    where: {
      walletId: resource.walletId,
      type: ItemType.Resources,
      itemId: resource.itemId,
    },

    take: resource.quantitySold,
  });

  if (inventory.length < resource.quantitySold) {
    return {
      content: "Something went wrong. Contact a Developer!",
      embeds: [],
      components: [],
      ephemeral: true,
    };
  }

  const resourceData = await getResource(resource.itemId);

  if (!resourceData) {
    return {
      content: "Something went wrong. Contact a Developer!",
      embeds: [],
      components: [],
      ephemeral: true,
    };
  }

  const userClan = await prisma.clan.findFirst({
    where: {
      members: {
        some: {
          discordUserId: resource.user.id,
        },
      },
    },

    select: {
      level: true,
    },
  });

  const clanBonusMultiplier = userClan?.level ? userClan.level / 20 : 0;
  const clanBonus = Math.round(resourceData?.sellPrice * clanBonusMultiplier);
  const totalPrice = resourceData.sellPrice * resource.quantitySold + clanBonus;

  await prisma.$transaction([
    prisma.shopItem.deleteMany({
      where: {
        id: {
          in: inventory.map((item) => item.id),
        },
      },
    }),

    prisma.wallet.update({
      where: {
        id: resource.walletId,
      },
      data: {
        balance: {
          increment: totalPrice,
        },
      },
    }),
  ]);

  return await createSoldEmbed({
    data: { user: resource.user, guild: resource.guild },
    inventory,
    price: { per: resourceData.sellPrice, total: totalPrice, bonus: clanBonus },
  });
}

type InventoryType = {
  itemId: string;
};

type PriceType = {
  per: number;
  total: number;
  bonus: number;
};

type Data = {
  user: User;
  guild: Guild;
};

type CreateSoldEmbedType = {
  data: Data;
  inventory: InventoryType[];
  price: PriceType;
};

async function createSoldEmbed(options: CreateSoldEmbedType) {
  const makeDollars = addCurrency();

  if (!options.inventory[0]) {
    return {
      content: "Something went wrong. Contact a Developer!",
      embeds: [],
      components: [],
      ephemeral: true,
    };
  }

  const resourceData = await getResource(options.inventory[0]?.itemId);

  if (!resourceData) {
    return {
      content: "Something went wrong. Contact a Developer!",
      embeds: [],
      components: [],
      ephemeral: true,
    };
  }

  const resourceEmbed = await formatSellResourceItems({
    user: options.data.user,
    guild: options.data.guild,
  });

  if (!resourceEmbed.embeds[0]) {
    return {
      content: "Something went wrong, Contact an developer!",
      embeds: [],
      components: [],
      ephemeral: true,
    };
  }

  resourceEmbed.embeds[0].addFields([
    { name: "\u200b", value: "\u200b" },
    {
      name: sprintf(
        "%s",
        options.inventory.length > 1 ? "Items sold" : "Item sold",
      ),
      value: sprintf(
        "%dx %s - %s",
        options.inventory.length,
        await formatItem(resourceData),
        makeDollars(formatNumber(options.price.per)),
      ),
    },
    {
      name: "Payment Details",
      value: sprintf(
        "```%s```",
        options.price.bonus > 0
          ? sprintf(
              "Total without clan bonus: %s\nClan bonus: %s\nGrand Total: %s",
              makeDollars(
                formatNumber(options.price.per * options.inventory.length),
              ),
              makeDollars(formatNumber(options.price.bonus)),
              makeDollars(formatNumber(options.price.total)),
            )
          : sprintf(
              "Grand Total: %s",
              makeDollars(
                formatNumber(options.price.per * options.inventory.length),
              ),
            ),
      ),
    },
  ]);

  return {
    content: "",
    embeds: [resourceEmbed.embeds[0]],
    components: resourceEmbed.components ?? [],
  };
}
