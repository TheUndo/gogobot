import { SlashCommandBuilder, type Interaction } from "discord.js";
import type { Command } from "../../common/types";

export const bulk = {
  data: new SlashCommandBuilder()
    .setName("bulk")
    .setDescription("Information about why Bulk Download is not possible."),
  async execute(interaction: Interaction) {
    if (!interaction.isRepliable()) {
      return;
    }

    await interaction.reply(
      "**Bulk download is not possible**\nYou cannot download whole seasons of anime.\n\n**Why can't I bulk download?**\nThere are several reasons:\n**1.** Abuse, copiers and bots would abuse this feature.\n**2.** Server strain. Storing such a massive zip file and having it be download takes enormous amounts of bandwidth, data and cpu power which is not reasonably financially justifiable.\n**3.** Videos are not stored on the same servers. Videos are located on different servers and it varies from episode to episode therefore downloading them as one is near impossible.",
    );
  },
} satisfies Command;
