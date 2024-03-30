import { SlashCommandBuilder, type Interaction } from "discord.js";
import type { Command } from "../../common/types";
import { welcomeMessage } from "../../common/routers/userJoin";

export const welcome = {
  data: new SlashCommandBuilder()
    .setName("welcome")
    .setDescription("Welcomes user"),
  async execute(interaction: Interaction) {
    if (!interaction.isRepliable()) {
      return;
    }

    await interaction.reply(welcomeMessage());
  },
  dev: true,
} satisfies Command;
