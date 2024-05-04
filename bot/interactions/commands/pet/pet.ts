import type { Command } from "!/bot/types";
import { type Interaction, SlashCommandBuilder } from "discord.js";
import { PetType } from "./petConfig";

enum SubCommands {
  Create = "create",
  Status = "status",
  Feed = "feed",
  Rename = "rename",
  Kill = "kill",
}

export const clan = {
  data: new SlashCommandBuilder()
    .setName("pet")
    .setDescription("Your pet")
    .setDMPermission(false)
    .addSubcommand((subCommand) =>
      subCommand
        .setName(SubCommands.Create)
        .setDescription("Crete a new pet")
        .addStringOption((option) =>
          option.setChoices(
            ...Object.values(PetType).map((type) => ({
              name: type,
              value: type,
            })),
          ),
        ),
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
    }
  },
} satisfies Command;
