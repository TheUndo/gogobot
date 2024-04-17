import type { Command } from "!/common/types";
import { type Interaction, SlashCommandBuilder } from "discord.js";
import { sprintf } from "sprintf-js";

export const ping = {
  data: new SlashCommandBuilder()
    .setName("ping")
    .setDescription("Get the bot's latency"),
  async execute(interaction: Interaction) {
    if (!interaction.isRepliable()) {
      return;
    }

    return await interaction.reply(
      sprintf(
        "Interaction: %dms\nWebsocket: %dms",
        Date.now() - interaction.createdTimestamp,
        interaction.client.ws.ping,
      ),
    );
  },
} satisfies Command;
