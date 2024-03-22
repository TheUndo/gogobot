import { SlashCommandBuilder, type Interaction } from "discord.js";
import type { Command } from "../../common/types";

export const virus = {
  data: new SlashCommandBuilder()
    .setName("virus")
    .setDescription("Why antiviruses sometimes flag the website as harmful."),
  async execute(interaction: Interaction) {
    if (!interaction.isRepliable()) {
      return;
    }

    await interaction.reply(
      "Websites including Gogoanime have very poor control over the ads shown by the third party ad providers, we do our best but it's not easy. As long as you never open or download anything from a website, nothing can happen. Anti virus programs such as but not limited to: avast, mcafee, norton, avg are using fear mongering to sell their services. You're completely safe as long as you never open an application and keep your web browser up to date. The notion that you will get a virus just by visiting a website is a complete myth and is perpetrated by such anti virus companies that rely on fear and misinformed users to push their products. While in the 90's this this fear was valid, nowadays you're almost completely safe as long as you use common sense. That's why you should whitelist Gogoanime from your anti virus program or simply delete it as it's not really doing anything other than keeping you from watch anime.",
    );
  },
} satisfies Command;
