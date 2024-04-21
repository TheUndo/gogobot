import type { CacheType, ModalSubmitInteraction } from "discord.js";
import { showAnime } from "!/interactions/modals/showAnime";
import { subscribe } from "!/interactions/modals/subscribe";
import { unsubscribe } from "!/interactions/modals/unsubscribe";
import { ModalAction } from "!/common/types";

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
