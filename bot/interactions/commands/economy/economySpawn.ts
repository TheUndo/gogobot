import { createWallet } from "!/bot/logic/economy/createWallet";
import type { Command } from "!/bot/types";
import { addCurrency } from "!/bot/utils/addCurrency";
import { formatNumber } from "!/bot/utils/formatNumber";
import { safeParseNumber } from "!/bot/utils/parseNumber";
import { prisma } from "!/core/db/prisma";
import {
  type Interaction,
  PermissionFlagsBits,
  SlashCommandBuilder,
} from "discord.js";
import { sprintf } from "sprintf-js";
import { z } from "zod";

export const spawn = {
  data: new SlashCommandBuilder()
    .setName("spawn")
    .setDescription("Spawns money")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addStringOption((option) =>
      option
        .setName("amount")
        .setDescription("Amount of money to spawn")
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
      .preprocess(safeParseNumber, z.number().int())
      .safeParse(rawAmount?.value);

    if (!amount.success) {
      return await interaction.reply(
        "Invalid amount. Use positive integers only.",
      );
    }

    if (amount.data > 500_000_000) {
      return await interaction.reply("You can't spawn more than 500,000,000.");
    }

    const wallet = await createWallet(interaction.user.id, guildId);

    if (wallet.balance > 1_000_000_000) {
      return await interaction.reply("You have too much money.");
    }

    await prisma.wallet.update({
      where: {
        id: wallet.id,
      },
      data: {
        balance: wallet.balance + BigInt(amount.data),
      },
    });

    return await interaction.reply(
      sprintf(
        "Spawned **%s** to your wallet.",
        addCurrency()(formatNumber(amount.data)),
      ),
    );
  },
} satisfies Command;
