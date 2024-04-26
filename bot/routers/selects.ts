import { SelectAction } from "!/bot/types";
import { showAnime } from "!/bot/interactions/selects/showAnime";
import { subscribe } from "!/bot/interactions/selects/subscribe";
import { unsubscribe } from "!/bot/interactions/selects/unsubscribe";
import { unsubscribeFromSubscriptions } from "!/bot/interactions/selects/unsubscribeFromSubscriptions";
import type { AnySelectMenuInteraction, CacheType } from "discord.js";

/** @deprecated */
export async function selectRouter(
  interaction: AnySelectMenuInteraction<CacheType>,
) {
  switch (interaction.customId) {
    case SelectAction.Subscribe: {
      if (interaction.isStringSelectMenu()) {
        return await subscribe(interaction);
      }
      break;
    }
    case SelectAction.UnsubscribeFromSubscriptions: {
      if (interaction.isStringSelectMenu()) {
        return await unsubscribeFromSubscriptions(interaction);
      }
      break;
    }
    case SelectAction.Unsubscribe: {
      if (interaction.isStringSelectMenu()) {
        return await unsubscribe(interaction);
      }
      break;
    }
    case SelectAction.ShowAnimeInfo: {
      if (interaction.isStringSelectMenu()) {
        return await showAnime(interaction);
      }
      break;
    }
  }
}
