import { SlashCommandBuilder, type Interaction } from "discord.js";
import type { Command } from "../../common/types";

export const domains = {
  data: new SlashCommandBuilder()
    .setName("domains")
    .setDescription("Show the official Gogoanime domains.")
    .addUserOption((option) =>
      option.setName("user").setDescription("The user to mention"),
    ),
  async execute(interaction: Interaction) {
    if (!interaction.isRepliable() || !interaction.isChatInputCommand()) {
      return;
    }

    const user = interaction.options.getMember("user");

    const content =
      user && "id" in user
        ? `Hey <@${user.id}> checkout the official Gogoanime domains here: <#1043981342691557447>`
        : "Official domains here: <#1043981342691557447>";

    await interaction.reply({
      content,
    });
  },
} satisfies Command;
