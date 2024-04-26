import { welcomeMessage } from "!/bot/routers/userJoin";
import type { Command } from "!/bot/types";
import { type Interaction, SlashCommandBuilder } from "discord.js";

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
