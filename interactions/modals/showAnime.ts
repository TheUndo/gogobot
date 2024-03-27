import type { CacheType, ModalSubmitInteraction } from "discord.js";
import { subscribeFromQuery } from "../../common/logic/gogo/subscribeFromQuery";
import { animeInfoFromQuery } from "../../common/logic/gogo/animeInfoFromQuery";

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
