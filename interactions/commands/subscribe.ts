import { type Interaction, SlashCommandBuilder } from "discord.js";

import { subscribeFromQuery } from "../../common/logic/gogo/subscribeFromQuery";
import { type Command, ModalAction } from "../../common/types";
import { animeDialog } from "./utils/animeDialog";

export const subscribe = {
  data: new SlashCommandBuilder()
    .setName("subscribe")
    .setDescription(
      "Subscribe to an anime and get notified when a new episode is out",
    )
    .addStringOption((option) =>
      option.setName("anime").setDescription("Anime Name, URL or ID"),
    ),
  async execute(interaction: Interaction) {
    if (!interaction.isRepliable() || !interaction.isChatInputCommand()) {
      return;
    }

    const query = interaction.options.getString("anime");

    if (!query) {
      return await interaction.showModal(
        animeDialog
          .setCustomId(ModalAction.Subscribe)
          .setTitle("Subscribe to Anime"),
      );
    }

    return await subscribeFromQuery(interaction, query);
  },
} satisfies Command;
