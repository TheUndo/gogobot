import { createWallet } from "!/bot/logic/economy/createWallet";
import { guardEconomyChannel } from "!/bot/logic/guildConfig/guardEconomyChannel";
import { Colors, type Command, InteractionType } from "!/bot/types";
import { prisma } from "!/core/db/prisma";
import {
  type APIEmbedField,
  ActionRowBuilder,
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
import { ItemType, type ToolTypes, toolIds } from "../economy/lib/shopConfig";
import { buyToolItems } from "../economy/lib/shopItems";

export const inventory = {
  data: new SlashCommandBuilder()
    .setName("inventory")
    .setDescription("Check your inventory."),
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

    const interactionReplyOption = await createEmbed(
      interaction.user,
      interaction.guild,
    );

    return await interaction.reply(interactionReplyOption);
  },
} satisfies Command;

export const inventoryDisposeMenuContext = z.object({
  walletId: z.string(),
  type: z.nativeEnum(ItemType),
});

export const createEmbed = async (
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

  const tools = inventory.filter((tool) => tool.type === ItemType.Tools);
  if (tools.length < 1) {
    embed.addFields([{ name: "No tools data found!", value: "\u200b" }]);
    return { content: "", embeds: [embed], components: [] };
  }

  const inventoryDisposeInteraction = await prisma.interaction.create({
    data: {
      type: InteractionType.InventoryDisposeToolMenu,
      guildId,
      userDiscordId: user.id,
      payload: JSON.stringify({
        walletId: wallet.id,
        type: ItemType.Tools,
      } satisfies z.infer<typeof inventoryDisposeMenuContext>),
    },
  });

  const firstRow = new ActionRowBuilder<StringSelectMenuBuilder>();

  const stringSelectMenuBuilder = new StringSelectMenuBuilder()
    .setCustomId(inventoryDisposeInteraction.id)
    .setPlaceholder("Select the item you would like to dispose.");

  /**Filtering out the first 25 items will be added in the future when more tools/items are added */

  for (const tool of tools) {
    const ToolType = (Object.keys(toolIds) as Array<ToolTypes>).find(
      (key) => toolIds[key] === tool.itemId,
    ) as ToolTypes;
    const toolData = buyToolItems[ToolType];

    stringSelectMenuBuilder.addOptions(
      new StringSelectMenuOptionBuilder()
        .setDefault(false)
        .setLabel(toolData.name)
        .setEmoji(toolData.emoji)
        .setValue(tool.id),
    );

    fields.push({
      name: sprintf("%s|%s", toolData.emoji, toolData.name),
      value: sprintf("Durability: %s", tool.durability),
    });
  }

  firstRow.addComponents(stringSelectMenuBuilder);

  embed.addFields(fields);

  return {
    content: content ? content : "",
    embeds: [embed],
    components: [firstRow],
  };
};
