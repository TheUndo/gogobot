import { SlashCommandBuilder, type Interaction } from "discord.js";
import type { Command } from "../../common/types";

export const releaseDate = {
  data: new SlashCommandBuilder()
    .setName("rd")
    .setDescription("When a certain anime will release"),
  async execute(interaction: Interaction) {
    if (!interaction.isRepliable()) {
      return;
    }

    await interaction.reply(
      "**When will X anime release?**\n\n__**Please refer to the following sites and add extra 3 hours for the episode to be uploaded..**__\n\nThe sites are:\n<https://anichart.net>\n<https://livechart.me>\n\n*N.B. the 3 hours is an approximate time. It might be more or less depending on the source.*",
    );
  },
} satisfies Command;
