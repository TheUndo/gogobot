import {
  SlashCommandBuilder,
  ModalBuilder,
  ActionRowBuilder,
  TextInputBuilder,
  TextInputStyle,
  type Interaction,
} from "discord.js";
import { ModalAction, type Command } from "../../common/types";
import { animeInfoFromQuery } from "../../common/logic/animeInfoFromQuery";

export const showAnime = {
  data: new SlashCommandBuilder()
    .setName("anime")
    .setDescription("Shows information abut an anime on Gogoanime.")
    .addStringOption((option) =>
      option.setName("anime").setDescription("Anime Name, URL or ID"),
    ),
  async execute(interaction: Interaction) {
    if (!interaction.isRepliable() || !interaction.isChatInputCommand()) {
      return;
    }

    const query = interaction.options.getString("anime");

    if (!query) {
      const modal = new ModalBuilder()
        .setTitle("Anime Search")
        .setCustomId(ModalAction.AnimeSearch)
        .addComponents(
          new ActionRowBuilder<TextInputBuilder>().addComponents(
            new TextInputBuilder()
              .setCustomId("query")
              .setLabel("Anime Name, URL or ID")
              .setStyle(TextInputStyle.Short),
          ),
        );

      return await interaction.showModal(modal);
    }

    const response = await animeInfoFromQuery(query);

    return await interaction.reply(response);
  },
} satisfies Command;
