import { SlashCommandBuilder, type Interaction } from "discord.js";
import type { Command } from "../../common/types";
import { prisma } from "../../prisma";
import { creteEconomyReward } from "../../common/logic/economy/createReward";

export const daily = {
  data: new SlashCommandBuilder()
    .setName("daily")
    .setDescription("Get daily reward"),
  async execute(interaction: Interaction) {
    if (!interaction.isRepliable()) {
      return;
    }

    const guildId = interaction.guild?.id;

    if (!guildId) {
      return await interaction.reply(
        "This command can only be used in a server.",
      );
    }

    return await interaction.reply(
      await creteEconomyReward({
        type: "daily",
        userDiscordId: interaction.user.id,
        guildId,
      }),
    );
  },
} satisfies Command;
