import { guardEconomyChannel } from "!/common/logic/guildConfig/guardEconomyChannel";
import { type Interaction, SlashCommandBuilder } from "discord.js";
import type { Command } from "!/common/types";

export const shop = {
  data: new SlashCommandBuilder()
    .setName("shop")
    .setDescription("Buy or Sell Resources/Tools"),
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

    //I still haven't started so there is nothing to see here - Poke :)
    return await interaction.reply({ content: "test" });
  },
} satisfies Command;
