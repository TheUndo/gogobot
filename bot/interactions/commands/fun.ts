import type { Command } from "!/bot/types";
import {
  EmbedBuilder,
  type Interaction,
  SlashCommandBuilder,
} from "discord.js";

export const fun = {
  data: new SlashCommandBuilder()
    .setName("fun")
    .setDescription("Try it out to find out")
    .addSubcommand((subCommand) =>
      subCommand
        .setName("hug")
        .setDescription("Hug your friends")
        .addUserOption((option) =>
          option
            .setRequired(true)
            .setName("user")
            .setDescription("User to hug"),
        ),
    )
    .addSubcommand((subCommand) =>
      subCommand
        .setName("kiss")
        .setDescription("Kiss your friends")
        .addUserOption((option) =>
          option
            .setRequired(true)
            .setName("user")
            .setDescription("User to kiss"),
        ),
    )
    .addSubcommand((subCommand) =>
      subCommand
        .setName("pat")
        .setDescription("Pat your friends")
        .addUserOption((option) =>
          option
            .setRequired(true)
            .setName("user")
            .setDescription("User to pat"),
        ),
    )
    .addSubcommand((subCommand) =>
      subCommand
        .setName("diss")
        .setDescription("Diss your friends")
        .addUserOption((option) =>
          option
            .setRequired(true)
            .setName("user")
            .setDescription("User to diss"),
        ),
    ),
  async execute(interaction: Interaction) {
    if (!interaction.isRepliable() || !interaction.isChatInputCommand()) {
      return;
    }
    const query = interaction.options.getSubcommand();
    const id = interaction.options.getUser("user");

    if (query === "hug") {
      const embed = new EmbedBuilder()
        .setDescription("***HUGGIES!!***")
        .setImage(
          "https://i.pinimg.com/originals/96/de/2f/96de2ffb76bbc84446461e9a7afa95cb.gif",
        );
      return await interaction.reply({
        content: `### ${interaction.user.displayName} hugs ${id}`,
        embeds: [embed],
      });
    }
    if (query === "kiss") {
      const embed = new EmbedBuilder()
        .setDescription("***KISSIES!!!***")
        .setImage(
          "https://i.pinimg.com/originals/b9/ef/3a/b9ef3a0b2d9ed41e467ed18d8afa8a3a.gif",
        );
      return await interaction.reply({
        content: `### ${interaction.user.displayName} kisses ${id}`,
        embeds: [embed],
      });
    }
    if (query === "pat") {
      const embed = new EmbedBuilder()
        .setDescription("***Pat Pat!***")
        .setImage(
          "https://64.media.tumblr.com/6289c42ea805f475698f02207da0a377/tumblr_p14hcsxPsb1tm1dgio1_500.gif",
        );
      return await interaction.reply({
        content: `### ${interaction.user.displayName} pats ${id}`,
        embeds: [embed],
      });
    }
    if (query === "diss") {
      return await interaction.reply(`**Suggondese Nutz!!! BEETCHH ${id} **`);
    }

    return await interaction.reply({
      ephemeral: true,
      content: "Invalid option",
    });
  },
} satisfies Command;
