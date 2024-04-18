import type { Command } from "!/common/types";
import { type Interaction, SlashCommandBuilder } from "discord.js";
import { z } from "zod";
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
        .addUserOption((option) =>
          option
            .setName("user")
            .setDescription("The user whose clan you want to see")
            .setRequired(true),
        )
        .addStringOption((option) =>
          option
            .setName("your color")
            .setDescription("The color YOU want to play as")
            .setChoices(
              { name: "red", value: "red" },
              { name: "yellow", value: "yellow" },
            ),
        )
        .addStringOption((option) =>
          option
            .setName("time")
            .setDescription("The amount of time each player has to make a move")
            .setChoices(
              { name: "5 seconds", value: "5" },
              { name: "30 seconds", value: "30" },
              { name: "1 minute", value: "60" },
              { name: "5 minutes", value: (60 * 5).toString() },
              { name: "10 minutes", value: (60 * 10).toString() },
              { name: "30 minutes", value: (60 * 30).toString() },
            ),
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
      case "start":
        return await interaction.reply(
          await connect4start({
            guildId,
            channelId: interaction.channelId,
            authorId: interaction.user.id,
            mentionedId: z
              .string()
              .parse(interaction.options.getUser("user")?.id),
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
