import { SlashCommandBuilder, type Interaction } from "discord.js";
import type { Command } from "../../common/types";
import { createWallet } from "../../common/logic/economy/createWallet";
import { createBank } from "../../common/logic/economy/createBank";
import { prisma } from "../../prisma";
import { formatNumber } from "../../common/utils/formatNumber";

export const deposit = {
  data: new SlashCommandBuilder()
    .setName("dep")
    .setDescription("Deposit money from your wallet to your bank account"),
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

    const wallet = await createWallet(interaction.user.id, guildId);

    if (wallet.balance <= 0) {
      return await interaction.reply("You don't have enough money to deposit");
    }

    const bank = await createBank(interaction.user.id, guildId);

    await prisma.$transaction([
      prisma.bank.update({
        where: {
          id: bank.id,
        },
        data: {
          balance: {
            increment: wallet.balance,
          },
        },
      }),
      prisma.wallet.update({
        where: {
          id: wallet.id,
        },
        data: {
          balance: 0,
        },
      }),
    ]);

    return await interaction.reply(
      `Deposited **$${formatNumber(wallet.balance)}** to your bank account.`,
    );
  },
} satisfies Command;
