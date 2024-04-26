import { createBank } from "!/bot/logic/economy/createBank";
import { createWallet } from "!/bot/logic/economy/createWallet";
import type { Command } from "!/bot/types";
import { formatNumber } from "!/bot/utils/formatNumber";
import { safeParseNumber } from "!/bot/utils/parseNumber";
import { prisma } from "!/core/db/prisma";
import { type Interaction, SlashCommandBuilder } from "discord.js";
import { z } from "zod";

export const deposit = {
  data: new SlashCommandBuilder()
    .setName("dep")
    .setDescription("Deposit money from your wallet to your bank account")
    .addStringOption((option) =>
      option
        .setName("amount")
        .setDescription(
          "Amount of money to deposit type 0 or all for everything",
        ),
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

    const wallet = await createWallet(interaction.user.id, guildId);

    const bank = await createBank(interaction.user.id, guildId);

    const toDeposit =
      amount.data === 0
        ? wallet.balance
        : Math.min(amount.data, wallet.balance);

    if (toDeposit <= 0) {
      return await interaction.reply(
        "You don't have enough money to deposit this amount.",
      );
    }

    await prisma.$transaction([
      prisma.bank.update({
        where: {
          id: bank.id,
        },
        data: {
          balance: {
            increment: toDeposit,
          },
        },
      }),
      prisma.wallet.update({
        where: {
          id: wallet.id,
        },
        data: {
          balance: {
            decrement: toDeposit,
          },
        },
      }),
    ]);

    return await interaction.reply(
      `Deposited **$${formatNumber(toDeposit)}** to your bank account.`,
    );
  },
} satisfies Command;
