import type { CacheType, StringSelectMenuInteraction } from "discord.js";
import { prisma } from "../../prisma";
import { createSubScriptionList } from "../commands/subscriptions";

export async function unsubscribeFromSubscriptions(
  interaction: StringSelectMenuInteraction<CacheType>,
) {
  const [rawAnimeId, rawPage] = interaction.values[0]?.split("+") ?? [];
  const animeId = Number.parseInt(rawAnimeId ?? "");
  const page = Number.parseInt(rawPage ?? "");

  if (Number.isNaN(animeId)) {
    return await interaction.reply("Invalid anime id");
  }

  if (Number.isNaN(page)) {
    return await interaction.reply("Invalid page number");
  }

  const subscription = await prisma.animeSubscription.findUnique({
    where: {
      animeId_userDiscordId: {
        animeId,
        userDiscordId: interaction.user.id,
      },
    },
    select: {
      anime: {
        select: {
          nameDisplay: true,
        },
      },
    },
  });

  if (!subscription) {
    return await interaction.reply({
      content: "You are not subscribed to this anime",
      ephemeral: true,
    });
  }

  await prisma.animeSubscription.delete({
    where: {
      animeId_userDiscordId: {
        animeId,
        userDiscordId: interaction.user.id,
      },
    },
  });

  return await interaction.update(
    await createSubScriptionList(interaction.user.id, page),
  );
}
