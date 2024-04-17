import { type Interaction, SlashCommandBuilder } from "discord.js";
import { z } from "zod";
import { createBank } from "!/common/logic/economy/createBank";
import { createWallet } from "!/common/logic/economy/createWallet";
import type { Command } from "!/common/types";
import { formatNumber } from "!/common/utils/formatNumber";
import { safeParseNumber } from "!/common/utils/parseNumber";
import { prisma } from "!/prisma";

export const withdraw = {
  data: new SlashCommandBuilder()
    .setName("with")
    .setDescription("Withdraw money from your bank account")
    .addStringOption((option) =>
      option
        .setName("amount")
        .setDescription("Amount of money to withdraw type 0 for all")
        .setRequired(true),
    ),
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

    if (!interaction.isCommand()) {
      return;
    }
    const rawAmount = interaction.options.get("amount");

    const amount = z
      .preprocess(safeParseNumber, z.number().int().min(0))
      .safeParse(rawAmount?.value);

    if (!amount.success) {
      return await interaction.reply(
        "Invalid amount. Use positive integers only.",
      );
    }

    const bank = await createBank(interaction.user.id, guildId);

    if (bank.balance <= 0) {
      return await interaction.reply("You don't have enough money to withdraw");
    }
    const wallet = await createWallet(interaction.user.id, guildId);

    const toWithdraw =
      amount.data === 0 ? bank.balance : Math.min(amount.data, bank.balance);

    await prisma.$transaction([
      prisma.bank.update({
        where: {
          id: bank.id,
        },
        data: {
          balance: {
            decrement: toWithdraw,
          },
        },
      }),
      prisma.wallet.update({
        where: {
          id: wallet.id,
        },
        data: {
          balance: {
            increment: toWithdraw,
          },
        },
      }),
    ]);

    return await interaction.reply(
      `Withdrew **$${formatNumber(toWithdraw)}** from your bank.`,
    );
  },
} satisfies Command;
