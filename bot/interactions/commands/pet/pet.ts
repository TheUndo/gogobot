import type { Command } from "!/bot/types";
import { type Interaction, SlashCommandBuilder } from "discord.js";
import { z } from "zod";
import { createNewPet } from "./actions/createNewPet";
import { showPetInfo } from "./actions/showPetInfo";
import { petTypeNames } from "./lib/petConfig";

enum SubCommand {
  Info = "info",
  Create = "create",
}

export const pet = {
  data: new SlashCommandBuilder()
    .setName("pet")
    .setDescription("Your pet")
    .setDMPermission(false)
    .addSubcommand((subcommand) =>
      subcommand
        .setName(SubCommand.Info)
        .setDescription("Get info about your pet"),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName(SubCommand.Create)
        .setDescription("Create a pet")
        .addStringOption((option) =>
          option
            .setName("name")
            .setDescription("Name of your pet")
            .setRequired(true),
        )
        .addStringOption((option) =>
          option
            .setName("type")
            .setDescription("Pet type")
            .setRequired(true)
            .addChoices(
              ...Object.entries(petTypeNames).map(([key, value]) => ({
                name: value,
                value: key,
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
      return await interaction.reply("Pets are only available in servers.");
    }

    const subCommand = z
      .nativeEnum(SubCommand)
      .safeParse(interaction.options.getSubcommand());

    if (!subCommand.success) {
      return await interaction.reply("Invalid subcommand");
    }

    switch (subCommand.data) {
      case SubCommand.Create:
        return await createNewPet(interaction);
      case SubCommand.Info:
        return await showPetInfo(interaction);
    }
  },
} satisfies Command;
