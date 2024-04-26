import {
  ActionRowBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
} from "discord.js";

export const animeDialog = new ModalBuilder().addComponents(
  new ActionRowBuilder<TextInputBuilder>().addComponents(
    new TextInputBuilder()
      .setCustomId("query")
      .setLabel("Anime Name, URL or ID")
      .setStyle(TextInputStyle.Short),
  ),
);
