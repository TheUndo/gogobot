import {
  type Interaction,
  PermissionFlagsBits,
  SlashCommandBuilder,
} from "discord.js";
import { sprintf } from "sprintf-js";
import { z } from "zod";
import { createWallet } from "~/common/logic/economy/createWallet";
import type { Command } from "~/common/types";
import { addCurrency } from "~/common/utils/addCurrency";
import { formatNumber } from "~/common/utils/formatNumber";
import { safeParseNumber } from "~/common/utils/parseNumber";
import { prisma } from "~/prisma";

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

    const wallet = await createWallet(interaction.user.id, guildId);

    await prisma.wallet.update({
      where: {
        id: wallet.id,
      },
      data: {
        balance: wallet.balance + amount.data,
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
