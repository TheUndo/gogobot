import { showAnime } from "!/bot/interactions/modals/showAnime";
import { subscribe } from "!/bot/interactions/modals/subscribe";
import { unsubscribe } from "!/bot/interactions/modals/unsubscribe";
import { ModalAction } from "!/bot/types";
import type { CacheType, ModalSubmitInteraction } from "discord.js";

/** @deprecated */
export async function modalRouter(
  interaction: ModalSubmitInteraction<CacheType>,
) {
  switch (interaction.customId) {
    case ModalAction.Subscribe:
      return await subscribe(interaction);
    case ModalAction.Unsubscribe:
      return await unsubscribe(interaction);
    case ModalAction.AnimeSearch:
      return await showAnime(interaction);
  }
}
