import { SlashCommandBuilder, type Interaction } from "discord.js";
import type { Command } from "../../common/types";
import { prisma } from "../../prisma";

export const resetCoolDowns = {
  data: new SlashCommandBuilder()
    .setName("owner-reset-cooldowns")
    .setDescription("Resets cooldowns for all users"),
  async execute(interaction: Interaction) {
    if (!interaction.isRepliable()) {
      return;
    }

    await prisma.wallet.updateMany({
      where: {},
      data: {
        lastUsedDaily: null,
        lastUsedWeekly: null,
      },
    });

    return await interaction.reply("ok");
  },
  private: true,
} satisfies Command;
