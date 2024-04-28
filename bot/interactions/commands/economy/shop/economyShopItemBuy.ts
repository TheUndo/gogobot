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
import { ToolTypes, itemTypes } from "../lib/shopConfig";
import { buyToolItems } from "../lib/shopItems";
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

  const Toolvalue = z.nativeEnum(ToolTypes).safeParse(interaction.values[0]);

  if (!Toolvalue.success) {
    return await interaction.reply({
      content: "Invalid value",
      ephemeral: true,
    });
  }

  const wallet = await createWallet(interactionContext.userDiscordId, guildId);

  const inventory = await prisma.shopItems.findMany({
    where: {
      walletId: context.data.walletId,
    },
  });

  const item = buyToolItems[Toolvalue.data];
  const itemInInv = inventory?.filter((tool) => tool.itemId === item.id);

  console.table(itemInInv);

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

    prisma.shopItems.create({
      data: {
        itemId: item.id,
        type: itemTypes.Tools,
        durability: item.durability,
        walletId: wallet.id,
      },
    }),
  ]);

  return await interaction.reply({
    content: sprintf(
      "You have bought a %s|`%s` for only %s",
      item.emoji,
      item.name,
      makeDollars(formatNumber(item.price)),
    ),
    ephemeral: true,
  });
}
