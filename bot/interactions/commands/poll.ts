import {
  ActionRowBuilder,
  EmbedBuilder,
  type Interaction,
  SlashCommandBuilder,
  StringSelectMenuBuilder,
} from "discord.js";
import { Colors, type Command, SelectAction } from "../../types";

export const poll = {
  data: new SlashCommandBuilder()
    .setName("poll")
    .setDescription("Create a poll."),
  async execute(interaction: Interaction) {
    if (!interaction.isRepliable()) {
      return;
    }

    const embed = new EmbedBuilder()
      .setTitle("Create poll")
      .setDescription("Firstly, how many options do you want to have?")
      .setColor(Colors.Accent);

    const select = new StringSelectMenuBuilder().setCustomId(
      SelectAction.PollOptionCount,
    );

    for (const [i] of [...Array(4)].entries()) {
      const count = i + 2;
      select.addOptions({
        label: count.toString(),
        value: count.toString(),
      });
    }

    const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
      select,
    );

    return await interaction.reply({
      embeds: [embed],
      ephemeral: true,
      components: [row],
    });
  },
} satisfies Command;
