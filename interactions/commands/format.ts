import { SlashCommandBuilder, type Interaction } from "discord.js";
import type { Command } from "../../common/types";

export const format = {
  data: new SlashCommandBuilder()
    .setName("format")
    .setDescription("Shows the format for requesting anime."),
  async execute(interaction: Interaction) {
    if (!interaction.isRepliable()) {
      return;
    }

    await interaction.reply(
      "Anime name:\nAnime URL From MAL:\nLanguage (DUB/SUB):\nNotes:\nTag GoGoAnime Admin by @",
    );
  },
} satisfies Command;
