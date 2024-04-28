import {
  ActionRowBuilder,
  type ButtonInteraction,
  type CacheType,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
} from "discord.js";
import { ModalAction } from "../../types";

export async function showSubscribeModal(
  interaction: ButtonInteraction<CacheType>,
) {
  const modal = new ModalBuilder()
    .setCustomId(ModalAction.Subscribe)
    .setTitle("Subscribe to Anime")
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
