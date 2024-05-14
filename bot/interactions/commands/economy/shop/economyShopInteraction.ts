import { notYourInteraction } from "!/bot/logic/responses/notYourInteraction";
import { wrongGuildForInteraction } from "!/bot/logic/responses/wrongGuildForInteraction";
import type { AnyInteraction, InteractionContext } from "!/bot/types";
import { z } from "zod";
import {
  formatSellResourceItems,
  shopSellButtonContext,
  ShopSellContextActionType,
  shopSellMenuContext,
} from "./economyShop";
import { getResource } from "!/bot/logic/inventory/getResource";
import { prisma } from "!/core/db/prisma";
import { ItemType } from "../lib/shopConfig";
import { sellResources } from "./economyFunction";

export async function economyShopSellMenu(
  interactionContext: InteractionContext,
  interaction: AnyInteraction,
) {
  if (!interaction.isStringSelectMenu()) {
    return void (await interaction.reply({
      ephemeral: true,
      content: "This interaction is only available as string menu select.",
    }));
  }

  const context = shopSellMenuContext.safeParse(
    JSON.parse(interactionContext.payload ?? "{}"),
  );

  if (!context.success) {
    return await interaction.reply({
      content: "Invalid interaction context",
      ephemeral: true,
    });
  }

  if (interaction.user.id !== interactionContext.userDiscordId) {
    return void (await interaction.reply(
      notYourInteraction(interactionContext, interaction),
    ));
  }

  const guild = interaction.guild;

  if (!guild) {
    return void (await interaction.reply({
      content: "This command is only available in servers.",
      ephemeral: true,
    }));
  }

  if (guild.id !== interactionContext.guildId) {
    return await interaction.reply(
      wrongGuildForInteraction(interactionContext, interaction),
    );
  }

  const resouceValue = z.string().safeParse(interaction.values[0]);

  if (!resouceValue.success) {
    return await interaction.reply({
      content: "Invalid value. Contact a Developer!",
      ephemeral: true,
    });
  }

  const resourceData = await getResource(resouceValue.data);
  if (!resourceData) {
    return await interaction.reply({
      content: "Undefined resourceData. Contact Developer!",
      ephemeral: true,
    });
  }

  const interactionReplyOptions = await formatSellResourceItems({
    user: interaction.user,
    guild: interaction.guild,
    resourceSelected: resourceData.type,
  });

  return await interaction.update(interactionReplyOptions);
}

export async function economyShopSellButton(
  interactionContext: InteractionContext,
  interaction: AnyInteraction,
) {
  if (!interaction.isButton()) {
    return void (await interaction.reply({
      content: "This is only for button interaction!",
      ephemeral: true,
    }));
  }

  const context = shopSellButtonContext.safeParse(
    JSON.parse(interactionContext.payload ?? "{}"),
  );

  if (!context.success) {
    return void (await interaction.reply({
      content: "Invalid interaction context",
      ephemeral: true,
    }));
  }

  if (interaction.user.id !== interactionContext.userDiscordId) {
    return void (await interaction.reply(
      notYourInteraction(interactionContext, interaction),
    ));
  }

  const guild = interaction.guild;
  if (!guild) {
    return void (await interaction.reply({
      content: "This command is only available in servers.",
      ephemeral: true,
    }));
  }

  if (guild.id !== interactionContext.guildId) {
    return void (await interaction.reply(
      wrongGuildForInteraction(interactionContext, interaction),
    ));
  }

  const inventory = await prisma.shopItem.findMany({
    where: {
      walletId: context.data.walletId,
      type: ItemType.Resources,
      itemId: context.data.itemId,
    },
  });

  const sellOption = z
    .nativeEnum(ShopSellContextActionType)
    .parse(context.data.action);

  switch (sellOption) {
    case ShopSellContextActionType.SellOne: {
      const interactionReplyOptions = await sellResources({
        user: interaction.user,
        guild: interaction.guild,
        walletId: context.data.walletId,
        itemId: context.data.itemId,
        quantitySold: 1,
      });

      return await interaction.update(interactionReplyOptions);
    }

    case ShopSellContextActionType.SellHalf: {
      const halfQuantity = Math.round(inventory.length / 2);
      const interactionReplyOptions = await sellResources({
        user: interaction.user,
        guild: interaction.guild,
        walletId: context.data.walletId,
        itemId: context.data.itemId,
        quantitySold: halfQuantity,
      });

      return await interaction.update(interactionReplyOptions);
    }

    case ShopSellContextActionType.SellAll: {
      const interactionReplyOptions = await sellResources({
        user: interaction.user,
        guild: interaction.guild,
        walletId: context.data.walletId,
        itemId: context.data.itemId,
        quantitySold: inventory.length,
      });

      return await interaction.update(interactionReplyOptions);
    }
  }
}
