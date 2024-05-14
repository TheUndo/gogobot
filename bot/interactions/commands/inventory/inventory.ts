import { createWallet } from "!/bot/logic/economy/createWallet";
import { guardEconomyChannel } from "!/bot/logic/guildConfig/guardEconomyChannel";
import { getTool } from "!/bot/logic/inventory/getTool";
import { Colors, type Command, InteractionType } from "!/bot/types";
import { formatItem } from "!/bot/utils/formatItem";
import { prisma } from "!/core/db/prisma";
import {
  type APIEmbedField,
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
import { ItemType } from "../economy/lib/shopConfig";
import { getResource } from "!/bot/logic/inventory/getResource";
import { addCurrency } from "!/bot/utils/addCurrency";
import { formatNumber } from "!/bot/utils/formatNumber";
import { aggregateResources } from "../economy/lib/aggregateResources";

export const inventory = {
  data: new SlashCommandBuilder()
    .setName("inventory")
    .setDescription("Check your inventory.")
    .addSubcommand((subcommand) =>
      subcommand.setName("tools").setDescription("Check your tool inventory"),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("resources")
        .setDescription("Check your resource inventory"),
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

    const query = interaction.options.getSubcommand();

    switch (query) {
      case "tools": {
        const interactionReplyOption = await createToolEmbed(
          interaction.user,
          interaction.guild,
        );

        return await interaction.reply(interactionReplyOption);
      }

      case "resources": {
        const interactionReplyOption = await createResourceEmbed(
          interaction.user,
          interaction.guild,
        );

        return await interaction.reply(interactionReplyOption);
      }
    }
  },
} satisfies Command;

export const inventoryContext = z.object({
  walletId: z.string(),
  type: z.nativeEnum(ItemType),
});

/**Creates the Embed for Tools that are in the inventory */
export const createToolEmbed = async (
  user: User,
  guild: Guild,
  content?: string,
) => {
  const guildId = guild.id;
  const wallet = await createWallet(user.id, guildId);

  const inventory = await prisma.shopItem.findMany({
    where: {
      walletId: wallet.id,
    },
  });

  const fields: APIEmbedField[] = [];

  const embed = new EmbedBuilder()
    .setTitle("Player Inventory")
    .setDescription("### Tools")
    .setColor(Colors.Info);

  const [inventoryDisposeInteraction, inventoryResourceButton] =
    await prisma.$transaction([
      prisma.interaction.create({
        data: {
          type: InteractionType.InventoryDisposeToolMenu,
          guildId,
          userDiscordId: user.id,
          payload: JSON.stringify({
            walletId: wallet.id,
            type: ItemType.Tools,
          } satisfies z.infer<typeof inventoryContext>),
        },
      }),
      prisma.interaction.create({
        data: {
          type: InteractionType.InventoryViewButton,
          guildId,
          userDiscordId: user.id,
          payload: JSON.stringify({
            walletId: wallet.id,
            type: ItemType.Resources,
          } satisfies z.infer<typeof inventoryContext>),
        },
      }),
    ]);

  const firstRow = new ActionRowBuilder<StringSelectMenuBuilder>();
  const secondRow = new ActionRowBuilder<ButtonBuilder>();

  const stringSelectMenuBuilder = new StringSelectMenuBuilder()
    .setCustomId(inventoryDisposeInteraction.id)
    .setPlaceholder("Select the tool you would like to dispose.");

  secondRow.addComponents(
    new ButtonBuilder()
      .setCustomId(inventoryResourceButton.id)
      .setLabel("Resources")
      .setStyle(ButtonStyle.Secondary),
  );

  const tools = inventory.filter((tool) => tool.type === ItemType.Tools);
  if (tools.length < 1) {
    embed.addFields([{ name: "No tools data found!", value: "\u200b" }]);
    return { content: "", embeds: [embed], components: [secondRow] };
  }

  //Filtering out the first 25 items will be added in the future when more tools/items are added

  for (const tool of tools) {
    const toolData = await getTool(tool.itemId);
    if (!toolData) {
      return {
        content: "Something went wrong, Contact a Developer",
        ephemeral: true,
      };
    }

    stringSelectMenuBuilder.addOptions(
      new StringSelectMenuOptionBuilder()
        .setDefault(false)
        .setLabel(toolData.name)
        .setEmoji(toolData.emoji)
        .setValue(tool.id),
    );

    fields.push({
      name: await formatItem(toolData),
      value: sprintf("Durability: %s", tool.durability),
    });
  }

  firstRow.addComponents(stringSelectMenuBuilder);

  embed.addFields(fields);

  return {
    content: content ?? "",
    embeds: [embed],
    components: [firstRow, secondRow],
  };
};

/**Creates an Embed for the resources in the inventory */
export const createResourceEmbed = async (user: User, guild: Guild) => {
  const guildId = guild.id;
  const wallet = await createWallet(user.id, guildId);

  const inventoryResources = await prisma.shopItem.findMany({
    where: {
      walletId: wallet.id,
      type: ItemType.Resources,
    },
  });

  const makeDollars = addCurrency();
  const firstRow = new ActionRowBuilder<ButtonBuilder>();
  const fields: APIEmbedField[] = [];

  const inventoryToolsButton = await prisma.interaction.create({
    data: {
      type: InteractionType.InventoryViewButton,
      guildId,
      userDiscordId: user.id,
      payload: JSON.stringify({
        walletId: wallet.id,
        type: ItemType.Tools,
      } satisfies z.infer<typeof inventoryContext>),
    },
  });

  firstRow.addComponents(
    new ButtonBuilder()
      .setCustomId(inventoryToolsButton.id)
      .setLabel("Tools")
      .setStyle(ButtonStyle.Secondary),
  );

  const embed = new EmbedBuilder()
    .setTitle("Player Inventory")
    .setDescription("### Resources")
    .setColor(Colors.Info);

  const aggregatedResources = await aggregateResources(inventoryResources);

  if (inventoryResources.length < 1) {
    embed.addFields([
      {
        name: "No Resources found!",
        value: "\u200b",
      },
    ]);

    return { content: "", embeds: [embed], components: [firstRow] };
  }

  embed.setDescription(
    sprintf(
      "%s\n\n> %s",
      embed.data.description,
      "NOTE: The total price mention here does not include _clan bonus_.",
    ),
  );

  for (const resource of aggregatedResources) {
    const resourceData = await getResource(resource.resourceId);
    if (!resourceData) {
      return {
        content: "Something went wrong, Contact a Developer",
        ephemeral: true,
      };
    }

    fields.push({
      name: await formatItem(resourceData),
      value: sprintf(
        "> Quantity: **%i**\n> Total SellPrice: **%s**",
        resource.quantity,
        makeDollars(formatNumber(resource.sellPrice)),
      ),
    });
  }
  embed.addFields(fields);
  return { content: "", embeds: [embed], components: [firstRow] };
};
