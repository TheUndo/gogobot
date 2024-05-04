import { guardEconomyChannel } from "!/bot/logic/guildConfig/guardEconomyChannel";
import type { Command } from "!/bot/types";
import { type Interaction, SlashCommandBuilder } from "discord.js";

/* enum SlotSymbol {
  Cherries = "CHERRIES",
  Seven = "SEVEN",
  Diamond = "DIAMOND",
  Bar = "BAR",
  TwoBar = "2BAR",
  ThreeBar = "3BAR",
  Watermelon = "WATERMELON",
}

enum Scenario {

} */

export const gift = {
  data: new SlashCommandBuilder()
    .setName("spin")
    .setDescription("Spin the slot machine!"),
  async execute(interaction: Interaction) {
    if (!interaction.isRepliable()) {
      return;
    }

    if (!interaction.isChatInputCommand()) {
      return await interaction.reply({
        content: "This command can only be used in a server.",
        ephemeral: true,
      });
    }

    const guildId = interaction.guild?.id;

    if (!guildId) {
      return await interaction.reply(
        "This command can only be used in a server.",
      );
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
  },
} satisfies Command;
