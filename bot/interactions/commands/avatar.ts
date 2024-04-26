import {
  EmbedBuilder,
  type Interaction,
  SlashCommandBuilder,
} from "discord.js";
import { Colors, type Command } from "../../types";

export const avatar = {
  data: new SlashCommandBuilder()
    .setName("avatar")
    .setDescription("To see the profile picture of the mentioned user")
    .addUserOption((option) =>
      option.setName("mention").setDescription("Mention the user"),
    ),
  async execute(interaction: Interaction) {
    if (!interaction.isRepliable() || !interaction.isChatInputCommand()) {
      return;
    }

    const mention = interaction.options.getUser("mention");
    const user = mention ?? interaction.user;
    const embed = new EmbedBuilder()
      .setColor(Colors.Info)
      .setImage(
        (() => {
          const url = new URL(user.displayAvatarURL());
          url.searchParams.set("size", "512");
          return url.toString();
        })(),
      )
      .setDescription(
        mention
          ? "**You are weird for zooming into other person's pfp!**"
          : "**Your Beautiful Face! You narcissist!**",
      );

    return await interaction.reply({ embeds: [embed] });
  },
} satisfies Command;
