//import { createWallet } from "!/bot/logic/economy/createWallet";
import { guardEconomyChannel } from "!/bot/logic/guildConfig/guardEconomyChannel";
import type { Command } from "!/bot/types";
//import { prisma } from "!/core/db/prisma";
import { type Interaction, SlashCommandBuilder } from "discord.js";
//import { ItemType } from "../economy/lib/shopConfig";

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

    // const wallet = await createWallet(interaction.user.id, guildId);
    // const inventory = await prisma.shopItem.findMany({
    //     where: {
    //         walletId: wallet.id
    //     }
    // })

    // const tools = inventory.filter((tool) => tool.type === ItemType.Tools);
  },
} satisfies Command;
