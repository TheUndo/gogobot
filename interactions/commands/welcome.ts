import { type Interaction, SlashCommandBuilder } from "discord.js";
import { welcomeMessage } from "~/common/routers/userJoin";
import type { Command } from "~/common/types";

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
