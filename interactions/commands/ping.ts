import { SlashCommandBuilder, type Interaction } from "discord.js";
import type { Command } from "../../common/types";

export const ping = {
  data: new SlashCommandBuilder()
    .setName("ping")
    .setDescription("Does something"),
  async execute(interaction: Interaction) {
    if (!interaction.isRepliable()) {
      return;
    }

    await interaction.reply(
      `This command was run by ${interaction.user.username}, who joined on.`,
    );
  },
  dev: true,
} satisfies Command;
