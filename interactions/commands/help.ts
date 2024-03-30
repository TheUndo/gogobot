import {
  SlashCommandBuilder,
  type Interaction,
  EmbedBuilder,
} from "discord.js";
import { Colors, type Command } from "../../common/types";
import { makeCommand } from "../../scraper/debug";
import { getCommands } from "../../common/routers/commands";

export const help = {
  data: new SlashCommandBuilder()
    .setName("help")
    .setDescription("Get help with the bot"),
  async execute(interaction: Interaction) {
    if (!interaction.isRepliable()) {
      return;
    }

    await interaction.reply({
      embeds: [helpEmbed()],
      ephemeral: true,
    });
  },
} satisfies Command;

function helpEmbed() {
  const commands = getCommands();
  const embed = new EmbedBuilder()
    .setTitle("Help")
    .setDescription(
      [
        "I am the official Gogoanime Robot. I keep track of new anime and notify subscribers when a new episode is out. I also have a few other commands that you can use. Here are the commands that I have:",
        [...commands.entries()]
          .filter(([, command]) => !command.private)
          .map(([name, command]) => {
            return `- ${makeCommand(name, command.id)}`;
          })
          .join("\n"),
      ].join("\n\n"),
    )
    .setColor(Colors.Accent);

  return embed;
}
