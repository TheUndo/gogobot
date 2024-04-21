import { ModalAction } from "!/common/types";
import { showAnime } from "!/interactions/modals/showAnime";
import { subscribe } from "!/interactions/modals/subscribe";
import { unsubscribe } from "!/interactions/modals/unsubscribe";
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
