import type { CacheType, StringSelectMenuInteraction } from "discord.js";
import { animeInfoResponse } from "../../common/logic/gogo/animeInfoResponse";

export async function showAnime(
  interaction: StringSelectMenuInteraction<CacheType>,
) {
  const [id] = interaction.values;

  if (typeof id !== "string") {
    return await interaction.reply({
      content: `Invalid anime id "${id}"`,
      ephemeral: true,
    });
  }

  const animeId = Number.parseInt(id);

  if (Number.isNaN(animeId)) {
    return await interaction.reply({
      content: `Invalid anime id "${id}"`,
      ephemeral: true,
    });
  }

  const response = await animeInfoResponse(animeId);

  return await interaction.reply(response);
}
