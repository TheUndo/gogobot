import type { Command } from "!/bot/types";
import { type Interaction, SlashCommandBuilder } from "discord.js";
import { z } from "zod";
import { connect4clockTimes } from "./connect4config";
import { connect4start } from "./connect4start";

export const connect4 = {
  data: new SlashCommandBuilder()
    .setName("connect4")
    .setDescription("Connect 4 mini game")
    .setDMPermission(false)
    .addSubcommand((subCommand) =>
      subCommand
        .setName("challenge")
        .setDescription("Challenge a person")
        .addStringOption((option) =>
          option
            .setName("your_color")
            .setDescription("The color YOU want to play as")
            .setChoices(
              { name: "red (first move)", value: "red" },
              { name: "yellow", value: "yellow" },
            )
            .setRequired(true),
        )
        .addUserOption((option) =>
          option
            .setName("opponent")
            .setDescription("The user whose clan you want to challenge"),
        )
        .addStringOption((option) =>
          option
            .setName("time")
            .setDescription("The amount of time each player has to make a move")
            .setChoices(...connect4clockTimes),
        )
        .addStringOption((option) =>
          option
            .setName("wager")
            .setDescription("The amount of money you want to wager"),
        ),
    )
    .addSubcommand((subCommand) =>
      subCommand.setName("end").setDescription("End your current game"),
    ),
  async execute(interaction: Interaction) {
    if (!interaction.isRepliable() || !interaction.isChatInputCommand()) {
      return;
    }

    const guildId = interaction.guildId;

    if (!guildId) {
      return await interaction.reply("Clans are only available in servers.");
    }

    const subcommand = interaction.options.getSubcommand();

    switch (subcommand) {
      case "challenge":
        return await interaction.reply(
          await connect4start({
            mentionedIsBot: interaction.options.getUser("user")?.bot === true,
            guildId,
            channelId: interaction.channelId,
            authorId: interaction.user.id,
            mentionedId: interaction.options.getUser("opponent")?.id,
            challengerColor: z
              .string()
              .parse(interaction.options.getString("your_color")),
            clockTime: z
              .string()
              .parse(
                interaction.options.getString("time") ?? (60 * 5).toString(),
              ),
          }),
        );

      default:
        return await interaction.reply({
          ephemeral: true,
          content: "Unknown sub command",
        });
    }
  },
} satisfies Command;
