import {
  EmbedBuilder,
  type Interaction,
  SlashCommandBuilder,
} from "discord.js";
import { sprintf } from "sprintf-js";
import { getCommands } from "!/common/routers/commands";
import { Colors, type Command } from "!/common/types";
import { makeCommand } from "!/scraper/debug";

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
        sprintf(
          "I am an [open source](https://github.com/theundo/gogobot/) Discord bot created by <@%s>. I run on [JSC](https://docs.webkit.org)/[Bun](https://bun.sh) and I am written in [TypeScript](https://www.typescriptlang.org/).",
          "246660882803720193",
        ),
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
