import {
  ActionRowBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
} from "discord.js";
import { findAnimeFromQuery } from "../../interactions/commands/utils/findAnimeFromQuery";
import { animeIndex } from "../../search/fuse";
import {
  multipleAnimeFound,
  noAnimeFound,
} from "../../interactions/commands/utils/queryResponses";
import { SelectAction } from "../types";
import { animeInfoResponse } from "./animeInfoResponse";

export async function animeInfoFromQuery(query: string) {
  const anime = await findAnimeFromQuery(query);

  if (anime) {
    return await animeInfoResponse(anime.id);
  }

  const search = animeIndex.search(query, {
    limit: 25,
  });

  if (!search.length) {
    return {
      ephemeral: true,
      embeds: [noAnimeFound(query)],
    };
  }

  const firstAnime = search[0]?.item;

  if (search.length === 1 && firstAnime) {
    return await animeInfoResponse(firstAnime.id);
  }

  const select = new StringSelectMenuBuilder()
    .setCustomId(SelectAction.ShowAnimeInfo)
    .setPlaceholder("Choose Anime");

  for (const anime of search) {
    select.addOptions(
      new StringSelectMenuOptionBuilder()
        .setLabel(anime.item.title)
        .setValue(anime.item.id.toString()),
    );
  }

  return {
    ephemeral: true,
    embeds: [
      multipleAnimeFound(query, "").setDescription(
        "Multiple anime found, select the anime you want to display.",
      ),
    ],
    components: [
      new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(select),
    ],
  };
}
