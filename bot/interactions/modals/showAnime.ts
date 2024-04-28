import type { CacheType, ModalSubmitInteraction } from "discord.js";
import { animeInfoFromQuery } from "../../../gogo/logic/animeInfoFromQuery";

export async function showAnime(
  interaction: ModalSubmitInteraction<CacheType>,
) {
  const query = interaction.fields.getField("query").value;

  if (!query) {
    return interaction.reply({
      content: "Invalid query",
      ephemeral: true,
    });
  }

  return await interaction.reply(await animeInfoFromQuery(query));
}
