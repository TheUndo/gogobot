import { items } from "!/bot/interactions/commands/economy/lib/shopItems";
import { createWallet } from "!/bot/logic/economy/createWallet";
import { guardEconomyChannel } from "!/bot/logic/guildConfig/guardEconomyChannel";
import { getResource } from "!/bot/logic/inventory/getResource";
import { Colors, type Command, InteractionType } from "!/bot/types";
import { addCurrency } from "!/bot/utils/addCurrency";
import { formatItem } from "!/bot/utils/formatItem";
import { formatNumber } from "!/bot/utils/formatNumber";
import { prisma } from "!/core/db/prisma";
import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  type Guild,
  type Interaction,
  SlashCommandBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  type User,
} from "discord.js";
import { sprintf } from "sprintf-js";
import { z } from "zod";
import { aggregateResources } from "../lib/aggregateResources";
import { ItemType, type Resources, resourceIds } from "../lib/shopCatalogue";

export const shopBuyMenuContext = z.object({
  walletId: z.string(),
});

export const shop = {
  data: new SlashCommandBuilder()
    .setName("shop")
    .setDescription("Buy or Sell Resources/Tools")
    .addSubcommand((subcommand) =>
      subcommand.setName("buy").setDescription("Buy items from the store!"),
    )
    .addSubcommand((subcommand) =>
      subcommand.setName("sell").setDescription("Sell items to the store!"),
    ),
  async execute(interaction: Interaction) {
    if (!interaction.isRepliable() || !interaction.isChatInputCommand()) {
      return;
    }

    const guildId = interaction.guild?.id;

    if (!guildId) {
      return await interaction.reply({
        content: "This command can only be used in a server.",
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

    const query = interaction.options.getSubcommand();
    switch (query) {
      case "buy": {
        const interactionOptions = await formatBuyToolItems(
          interaction.user,
          interaction.guild,
        );
        return await interaction.reply({
          embeds: [interactionOptions.embed],
          components: interactionOptions.component,
        });
      }

      case "sell": {
        const interactionOptions = await formatSellResourceItems({
          user: interaction.user,
          guild: interaction.guild,
        });
        return await interaction.reply(interactionOptions);
      }
    }
  },
} satisfies Command;

/** Creates the embed for /shop buy (tools)*/
const formatBuyToolItems = async (user: User, guild: Guild) => {
  const makeDollars = addCurrency();
  const embed = new EmbedBuilder()
    .setTitle(sprintf("%s Shop - Buy", guild.name))
    .setDescription(sprintf("Buy tools from %s's Shop", guild.name))
    .setColor(Colors.Info);

  const tools = Object.entries(items);
  const wallet = await createWallet(user.id, guild.id);

  const inventory = await prisma.shopItem.findMany({
    where: {
      walletId: wallet.id,
    },
  });

  embed.addFields([
    {
      name: "Tools",
      value: sprintf(
        "%s",
        tools
          .map(([_, pick]) =>
            sprintf(
              formatItem(pick),
              pick.emoji,
              inventory?.filter((tool) => tool.itemId === pick.id).length >= 1
                ? `${pick.name} (Already Owned)`
                : pick.name,
              makeDollars(formatNumber(pick.price)),
            ),
          )
          .join("\n"),
      ),
    },
  ]);

  const shopSelectItemsInteraction = await prisma.interaction.create({
    data: {
      type: InteractionType.ShopBuyToolMenu,
      guildId: guild.id,
      userDiscordId: user.id,
      payload: JSON.stringify({
        walletId: wallet.id,
      } satisfies z.infer<typeof shopBuyMenuContext>),
    },
  });

  const firstRow = new ActionRowBuilder<StringSelectMenuBuilder>();

  const stringSelectMenuBuilder = new StringSelectMenuBuilder()
    .setCustomId(shopSelectItemsInteraction.id)
    .setPlaceholder("Select the item you would like to purchase");

  for (const [_, tool] of tools) {
    stringSelectMenuBuilder.addOptions(
      new StringSelectMenuOptionBuilder()
        .setDefault(false)
        .setLabel(tool.name)
        .setEmoji(tool.emoji)
        .setValue(tool.type),
    );
  }

  firstRow.addComponents(stringSelectMenuBuilder);

  return { embed, component: [firstRow] };
};

type FieldValue = {
  name: string;
  emoji: string;
  quantity: number;
  totalPrice: number;
};

export const shopSellMenuContext = z.object({
  walletId: z.string(),
});

export enum ShopSellContextActionType {
  SellOne = "SELLONE",
  SellHalf = "SELLHALF",
  SellAll = "SELLALL",
}

export const shopSellButtonContext = z.object({
  walletId: z.string(),
  itemId: z.string(),
  action: z.nativeEnum(ShopSellContextActionType),
});

type formatSellResourceItemsOptions = {
  user: User;
  guild: Guild;
  page?: number;
  resourceSelected?: Resources;
};

/**Creates the embed for /shop sell (resources) */
export const formatSellResourceItems = async ({
  user,
  guild,
  page,
  resourceSelected,
}: formatSellResourceItemsOptions) => {
  const makeDollars = addCurrency();

  const wallet = await createWallet(user.id, guild.id);
  const resources = await prisma.shopItem.findMany({
    where: {
      walletId: wallet.id,
      type: ItemType.Resources,
    },
  });

  const fieldValue: FieldValue[] = [];

  const firstRow = new ActionRowBuilder<StringSelectMenuBuilder>();
  const aggregateResource = await aggregateResources(resources);

  const totalPage = Math.ceil(aggregateResource.length / 25);
  const startIndex = ((page ?? 1) - 1) * 25;
  const endIndex = Math.min(startIndex + 25, aggregateResource.length);

  const resourceForPage = aggregateResource.splice(startIndex, endIndex);

  const embed = new EmbedBuilder()
    .setTitle(sprintf("%s Shop - Sell", guild.name))
    .setDescription(
      sprintf(
        "Sell your items in %s's shop \n\n> **NOTE:** The following item total does not include Clan Bonus",
        guild.name,
      ),
    )
    .setColor(Colors.Info)
    .setFooter({ text: sprintf("Page %d/%d", page ?? 1, totalPage) });

  if (resourceForPage.length < 1) {
    embed.addFields([
      {
        name: "You don't have any resource in the inventory to sell!",
        value: "\u200b",
      },
    ]);

    return {
      content: "",
      embeds: [embed],
      component: [],
    };
  }

  const shopSellMenu = await prisma.interaction.create({
    data: {
      type: InteractionType.ShopSellResourceMenu,
      guildId: guild.id,
      userDiscordId: user.id,
      payload: JSON.stringify({
        walletId: wallet.id,
      } satisfies z.infer<typeof shopSellMenuContext>),
    },
  });

  const stringSelectMenuBuilder = new StringSelectMenuBuilder()
    .setCustomId(shopSellMenu.id)
    .setPlaceholder("Select the resource you would like to sell.");

  for (const resource of resourceForPage) {
    const resourceData = await getResource(resource.resourceId);

    if (!resourceData) {
      return {
        content: "Something went wrong, Contact a developer",
        embeds: [],
        components: [],
        ephemeral: true,
      };
    }

    stringSelectMenuBuilder.addOptions(
      new StringSelectMenuOptionBuilder()
        .setDefault(false)
        .setLabel(resourceData.name)
        .setEmoji(resourceData.emoji)
        .setValue(resourceData.id),
    );

    fieldValue.push({
      name: resourceData.name,
      emoji: resourceData.emoji,
      quantity: resource.quantity,
      totalPrice: resource.sellPrice,
    });
  }

  firstRow.addComponents(stringSelectMenuBuilder);

  embed.addFields([
    {
      name: "Resource(s)",
      value: sprintf(
        "%s",
        await Promise.all(
          fieldValue.map(async (val) => {
            const name = await formatItem({ name: val.name, emoji: val.emoji });
            const formatPrice = makeDollars(formatNumber(val.totalPrice));

            return sprintf(
              "%s\n> **Quantity:** %s\n> **Total Price:** %s",
              name,
              val.quantity,
              formatPrice,
            );
          }),
        ).then((formattedValue) => formattedValue.join("\n")),
      ),
    },
  ]);

  if (!resourceSelected) {
    return { content: "", embeds: [embed], components: [firstRow] };
  }

  const [shopSellButtonOne, shopSellButtonHalf, shopSellButtonAll] =
    await prisma.$transaction([
      prisma.interaction.create({
        data: {
          type: InteractionType.ShopSellResourceButton,
          guildId: guild.id,
          userDiscordId: user.id,
          payload: JSON.stringify({
            walletId: wallet.id,
            itemId: resourceIds[resourceSelected],
            action: ShopSellContextActionType.SellOne,
          } satisfies z.infer<typeof shopSellButtonContext>),
        },
      }),

      prisma.interaction.create({
        data: {
          type: InteractionType.ShopSellResourceButton,
          guildId: guild.id,
          userDiscordId: user.id,
          payload: JSON.stringify({
            walletId: wallet.id,
            itemId: resourceIds[resourceSelected],
            action: ShopSellContextActionType.SellHalf,
          } satisfies z.infer<typeof shopSellButtonContext>),
        },
      }),

      prisma.interaction.create({
        data: {
          type: InteractionType.ShopSellResourceButton,
          guildId: guild.id,
          userDiscordId: user.id,
          payload: JSON.stringify({
            walletId: wallet.id,
            itemId: resourceIds[resourceSelected],
            action: ShopSellContextActionType.SellAll,
          } satisfies z.infer<typeof shopSellButtonContext>),
        },
      }),
    ]);

  const secondRow = new ActionRowBuilder<ButtonBuilder>();

  firstRow.components[0]?.options
    .filter((opt) => opt.data.value === resourceIds[resourceSelected])[0]
    ?.setDefault(true);

  const total = await aggregateResources(resources);
  const totalQuantity = total.filter(
    (res) => res.resourceId === resourceIds[resourceSelected],
  )[0]?.quantity;

  secondRow.addComponents(
    new ButtonBuilder()
      .setCustomId(shopSellButtonOne.id)
      .setLabel("Sell One")
      .setStyle(ButtonStyle.Secondary),

    new ButtonBuilder()
      .setCustomId(shopSellButtonHalf.id)
      .setLabel("Sell Half")
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(totalQuantity ? totalQuantity < 2 : true),

    new ButtonBuilder()
      .setCustomId(shopSellButtonAll.id)
      .setLabel("Sell All")
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(totalQuantity ? totalQuantity < 2 : true),
  );

  return { content: "", embeds: [embed], components: [firstRow, secondRow] };
};
