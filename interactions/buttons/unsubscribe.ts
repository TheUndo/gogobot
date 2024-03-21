import type { ButtonInteraction, CacheType } from "discord.js";
import { unsubscribeAction } from "../../common/logic/unsubscribe";

export async function unsubscribe(
  interaction: ButtonInteraction<CacheType>,
  data: string,
) {
  const animeId = Number.parseInt(data);

  if (Number.isNaN(animeId)) {
    return interaction.reply({
      content: `Invalid anime id "${data}"`,
      ephemeral: true,
    });
  }

  const response = await unsubscribeAction(animeId, interaction.user.id);

  return await interaction.reply({
    ...response,
    ephemeral: true,
  });
}
