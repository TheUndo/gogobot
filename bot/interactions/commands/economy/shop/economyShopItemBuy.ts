import { createWallet } from "!/bot/logic/economy/createWallet";
import { notYourInteraction } from "!/bot/logic/responses/notYourInteraction";
import { wrongGuildForInteraction } from "!/bot/logic/responses/wrongGuildForInteraction";
import { wrongInteractionType } from "!/bot/logic/responses/wrongInteractionType";
import type { AnyInteraction, InteractionContext } from "!/bot/types";
import { addCurrency } from "!/bot/utils/addCurrency";
import { formatNumber } from "!/bot/utils/formatNumber";
import { prisma } from "!/core/db/prisma";
import { sprintf } from "sprintf-js";
import { z } from "zod";
import { ItemType, ShopItemType } from "../lib/shopCatalogue";
import { items } from "../lib/shopItems";
import { shopBuyMenuContext } from "./economyShop";

export async function shopToolBuy(
  interactionContext: InteractionContext,
  interaction: AnyInteraction,
) {
  if (!interaction.isStringSelectMenu()) {
    return await interaction.reply(
      wrongInteractionType(interactionContext, interaction),
    );
  }

  const context = shopBuyMenuContext.safeParse(
    JSON.parse(interactionContext.payload ?? "{}"),
  );

  if (!context.success) {
    return await interaction.reply({
      content: "Invalid interaction context",
      ephemeral: true,
    });
  }

  if (interaction.user.id !== interactionContext.userDiscordId) {
    return await interaction.reply(
      notYourInteraction(interactionContext, interaction),
    );
  }

  const guildId = interactionContext.guildId;

  if (!guildId) {
    return await interaction.reply({
      content: "This command can only be used in servers.",
      ephemeral: true,
    });
  }

  if (guildId !== interactionContext.guildId) {
    return await interaction.reply(
      wrongGuildForInteraction(interactionContext, interaction),
    );
  }

  const toolValue = z.nativeEnum(ShopItemType).safeParse(interaction.values[0]);

  if (!toolValue.success) {
    return await interaction.reply({
      content: "Invalid value",
      ephemeral: true,
    });
  }

  const wallet = await createWallet(interactionContext.userDiscordId, guildId);

  const inventory = await prisma.shopItem.findMany({
    where: {
      walletId: context.data.walletId,
    },
  });

  const item = items[toolValue.data];
  const itemInInv = inventory?.filter((tool) => tool.itemId === item.id);

  if (itemInInv.length >= 1) {
    return await interaction.reply({
      content: "You can only have one pickaxe of each variety.",
      ephemeral: true,
    });
  }

  const makeDollars = addCurrency();

  if (wallet.balance < item.price) {
    return await interaction.reply({
      content: sprintf(
        "You don't have enough money in your wallet. Your balance is %s.",
        makeDollars(formatNumber(wallet.balance)),
      ),
      ephemeral: true,
    });
  }

  await prisma.$transaction([
    prisma.wallet.update({
      where: {
        id: wallet.id,
      },

      data: {
        balance: {
          decrement: item.price,
        },
      },
    }),

    prisma.shopItem.create({
      data: {
        itemId: item.id,
        type: ItemType.Tools,
        durability: item.durability,
        walletId: wallet.id,
      },
    }),
  ]);

  return await interaction.reply({
    content: sprintf(
      "You have purchased a %s|`%s` for only %s",
      item.emoji,
      item.name,
      makeDollars(formatNumber(item.price)),
    ),
  });
}
