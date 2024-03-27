import { SlashCommandBuilder, type Interaction } from "discord.js";
import type { Command } from "../../common/types";
import { createWallet } from "../../common/logic/economy/createWallet";
import { createBank } from "../../common/logic/economy/createBank";
import { prisma } from "../../prisma";
import { formatNumber } from "../../common/utils/formatNumber";

export const balance = {
  data: new SlashCommandBuilder()
    .setName("bal")
    .setDescription("View the balance of your accounts"),
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

    const [wallet, bank] = await Promise.all([
      createWallet(interaction.user.id, guildId),
      createBank(interaction.user.id, guildId),
    ]);

    return await interaction.reply(
      `**Wallet**: $${formatNumber(wallet.balance)}\n**Bank**: $${formatNumber(
        bank.balance,
      )}`,
    );
  },
} satisfies Command;
