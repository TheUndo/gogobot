import { getGuildConfig } from "!/bot/logic/guildConfig/getGuildConfig";
import { prisma } from "!/core/db/prisma";
import {
  type Interaction,
  PermissionFlagsBits,
  SlashCommandBuilder,
} from "discord.js";
import { sprintf } from "sprintf-js";
import type { Command } from "../../types";

export const economyChannel = {
  data: new SlashCommandBuilder()
    .setName("economy-channel")
    .setDescription("Change the economy channel")
    .setDMPermission(false)
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
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

    const config = await getGuildConfig(guildId);

    await prisma.guildConfig.update({
      where: {
        id: config.id,
      },
      data: {
        economyChannelId: interaction.channelId,
      },
    });

    return await interaction.reply({
      content: sprintf("Economy channel set to <#%s>", interaction.channelId),
      ephemeral: true,
    });
  },
} satisfies Command;
