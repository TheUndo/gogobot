import { createBank } from "!/bot/logic/economy/createBank";
import { createWallet } from "!/bot/logic/economy/createWallet";
import type { Command } from "!/bot/types";
import { BigIntMath } from "!/bot/utils/bigIntMath";
import { formatNumber } from "!/bot/utils/formatNumber";
import { safeParseNumber } from "!/bot/utils/parseNumber";
import { prisma } from "!/core/db/prisma";
import { type Interaction, SlashCommandBuilder } from "discord.js";
import { z } from "zod";

export const withdraw = {
  data: new SlashCommandBuilder()
    .setName("with")
    .setDescription("Withdraw money from your bank account")
    .addStringOption((option) =>
      option
        .setName("amount")
        .setDescription(
          "Amount of money to withdraw type 0 or all for everything",
        )
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
      .preprocess(safeParseNumber, z.bigint().min(0n))
      .safeParse(rawAmount?.value);

    if (!amount.success) {
      return await interaction.reply(
        "Invalid amount. Use positive integers only.",
      );
    }

    const bank = await createBank(interaction.user.id, guildId);

    if (bank.balance <= 0n) {
      return await interaction.reply(
        "You don't have enough money to withdraw this amount.",
      );
    }
    const wallet = await createWallet(interaction.user.id, guildId);

    const toWithdraw =
      amount.data === 0n
        ? bank.balance
        : BigIntMath.min(amount.data, bank.balance);

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
