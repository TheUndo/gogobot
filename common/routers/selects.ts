import type { AnySelectMenuInteraction, CacheType } from "discord.js";
import { showAnime } from "!/interactions/selects/showAnime";
import { subscribe } from "!/interactions/selects/subscribe";
import { unsubscribe } from "!/interactions/selects/unsubscribe";
import { unsubscribeFromSubscriptions } from "!/interactions/selects/unsubscribeFromSubscriptions";
import { SelectAction } from "!/common/types";

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
