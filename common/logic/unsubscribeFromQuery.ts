import {
  StringSelectMenuBuilder,
  type CacheType,
  type ChatInputCommandInteraction,
  type ModalSubmitInteraction,
  StringSelectMenuOptionBuilder,
  ActionRowBuilder,
} from "discord.js";
import { findAnimeFromQuery } from "../../interactions/commands/utils/findAnimeFromQuery";
import { prisma } from "../../prisma";
import Fuse from "fuse.js";
import {
  multipleAnimeFound,
  noAnimeFound,
} from "../../interactions/commands/utils/queryResponses";
import { SelectAction } from "../types";
import { unsubscribeAction } from "./unsubscribe";

/** Flow to search for anime from query, can be invoked by command or deferred by modal */
export async function unsubscribeFromQuery(
  interaction:
    | ChatInputCommandInteraction<CacheType>
    | ModalSubmitInteraction<CacheType>,
  query: string,
) {
  const animeFromUrlOrId = await findAnimeFromQuery(query);

  if (animeFromUrlOrId) {
  }

  const subscriptions = await prisma.animeSubscription
    .findMany({
      where: {
        userDiscordId: interaction.user.id,
      },
      select: {
        anime: {
          select: {
            id: true,
            nameDisplay: true,
            names: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    })
    .then((anime) =>
      anime.map((a) => {
        return {
          id: a.anime.id,
          title: a.anime.nameDisplay,
          names: a.anime.names.map((n) => n.name),
        };
      }),
    );

  const userSubscriptionIndex = new Fuse(subscriptions, {
    keys: ["title", "names"],
  });

  const search = userSubscriptionIndex.search(query, {
    limit: 25,
  });

  if (!search.length) {
    return await interaction.reply({
      ephemeral: true,
      embeds: [noAnimeFound(query)],
    });
  }

  const firstAnime = search[0]?.item;

  if (search.length === 1 && firstAnime) {
    const response = await unsubscribeAction(
      firstAnime.id,
      interaction.user.id,
    );

    return await interaction.reply({
      ...response,
      ephemeral: interaction.ephemeral ?? false,
    });
  }

  const select = new StringSelectMenuBuilder()
    .setCustomId(SelectAction.Unsubscribe)
    .setPlaceholder("Choose Anime");

  for (const anime of search) {
    select.addOptions(
      new StringSelectMenuOptionBuilder()
        .setLabel(anime.item.title)
        .setValue(anime.item.id.toString()),
    );
  }

  await interaction.reply({
    ephemeral: true,
    embeds: [multipleAnimeFound(query, "unsubscribe")],
    components: [
      new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(select),
    ],
  });
}
