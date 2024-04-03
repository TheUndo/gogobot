import { SlashCommandBuilder, type Interaction } from "discord.js";
import { creteEconomyReward } from "~/common/logic/economy/createReward";
import type { Command } from "~/common/types";

export const weekly = {
  data: new SlashCommandBuilder()
    .setName("weekly")
    .setDescription("Get weekly reward"),
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
        type: "weekly",
        userDiscordId: interaction.user.id,
        guildId,
      }),
    );
  },
} satisfies Command;
