import { SlashCommandBuilder, type Interaction } from "discord.js";
import type { Command } from "../../common/types";
import { sprintf } from "sprintf-js";

export const ping = {
  data: new SlashCommandBuilder()
    .setName("ping")
    .setDescription("Get the bot's latency"),
  async execute(interaction: Interaction) {
    if (!interaction.isRepliable()) {
      return;
    }

    await interaction.reply(
      sprintf(
        "Interaction: %dms\nWebsocket: %dms",
        Date.now() - interaction.createdTimestamp,
        interaction.client.ws.ping,
      ),
    );
  },
} satisfies Command;
