import { type Interaction, SlashCommandBuilder } from "discord.js";
import type { Command } from "../../common/types";

export const adblock = {
  data: new SlashCommandBuilder()
    .setName("adblock")
    .setDescription("Information about usage of adblock"),
  async execute(interaction: Interaction) {
    if (!interaction.isRepliable()) {
      return;
    }

    await interaction.reply(
      "__**GoGoAnime Admin's messge for adblock users**__\nhttps://cdn.discordapp.com/attachments/726421062392217721/826027037285285909/Screenshot_20210322-164203_Discord.jpg?ex=660a8020&is=65f80b20&hm=14bae07c932b0de7285b0514652173f434704a81e52c157a50907d30cd4ec72f&",
    );
  },
} satisfies Command;
