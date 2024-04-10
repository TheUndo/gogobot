import {
  type Interaction,
  SlashCommandBuilder,
  PermissionFlagsBits,
} from "discord.js";
import type { Command } from "../../common/types";
import { getGuildConfig } from "~/common/logic/guildConfig/getGuildConfig";
import { prisma } from "~/prisma";
import { sprintf } from "sprintf-js";

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
