import {
  SlashCommandBuilder,
  type Interaction,
  EmbedBuilder,
} from "discord.js";
import { Colors, type Command } from "../../../common/types";
import { createWallet } from "../../../common/logic/economy/createWallet";
import { createBank } from "../../../common/logic/economy/createBank";
import { formatNumber } from "../../../common/utils/formatNumber";
import { makePossessive } from "../../../common/utils/makePossessive";
import { addCurrency } from "../../../common/utils/addCurrency";
import { sprintf } from "sprintf-js";

export const balance = {
  data: new SlashCommandBuilder()
    .setName("bal")
    .setDescription("View the balance of your accounts")
    .addUserOption((option) =>
      option.setName("user").setDescription("User to view the balance of"),
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
      return await interaction.reply(
        "This interaction can only be used as a command.",
      );
    }

    const selectedUser = interaction.options.get("user")?.user;
    const userId = selectedUser?.id ?? interaction.user.id;

    const [wallet, bank] = await Promise.all([
      createWallet(userId, guildId),
      createBank(userId, guildId),
    ]);

    const makeDollars = addCurrency();
    const walletBalance = makeDollars(formatNumber(wallet.balance));
    const bankBalance = makeDollars(formatNumber(bank.balance));

    if (selectedUser && interaction.user.id !== selectedUser.id) {
      const embed = new EmbedBuilder()
        .setColor(Colors.Info)
        .setTitle(
          sprintf("%s balance", makePossessive(selectedUser.displayName)),
        )
        .addFields([
          {
            name: "Wallet",
            value: walletBalance,
            inline: true,
          },
          {
            name: "Bank",
            value: bankBalance,
            inline: true,
          },
        ]);

      if (selectedUser.bot) {
        embed.setDescription(
          sprintf("Looks like %s is a robot :robot:", selectedUser.displayName),
        );
      }

      return await interaction.reply({
        embeds: [embed],
      });
    }

    return await interaction.reply(
      sprintf("**Wallet**: %s\n**Bank**: %s",
        walletBalance,
        bankBalance,
      ),
    );
  },
} satisfies Command;
