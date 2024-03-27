import {
  type ButtonInteraction,
  type CacheType,
  EmbedBuilder,
} from "discord.js";
import { prisma } from "../../prisma";
import { createSubscription } from "../../common/logic/gogo/subscribe";

export async function subscribe(
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

  const anime = await prisma.anime.findUnique({
    where: {
      id: animeId,
    },
  });

  if (!anime) {
    return interaction.reply({
      content: `Could not find anime with id ${animeId}`,
      ephemeral: true,
    });
  }

  const response = await createSubscription(anime.id, interaction.user.id);

  return await interaction.reply({
    ...response,
    ephemeral: true,
  });
}
