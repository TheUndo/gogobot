import { showSubscribeModal } from "!/bot/interactions/buttons/showSubscribeModal";
import { subscribe } from "!/bot/interactions/buttons/subscribe";
import { subscriptionListChangePage } from "!/bot/interactions/buttons/subscriptionListChangePage";
import { unsubscribe } from "!/bot/interactions/buttons/unsubscribe";
import { ButtonAction } from "!/bot/types";
import type { ButtonInteraction, CacheType } from "discord.js";

/** @deprecated */
export async function buttonRouter(interaction: ButtonInteraction<CacheType>) {
  const [action, data] = interaction.customId.split("+");

  if (!action || !data) {
    await interaction.reply({
      content: "Invalid button action",
      ephemeral: true,
    });
    return;
  }

  switch (action) {
    case ButtonAction.Subscribe:
      return await subscribe(interaction, data);
    case ButtonAction.Unsubscribe:
      return await unsubscribe(interaction, data);
    case ButtonAction.ShowSubscribeModal:
      return await showSubscribeModal(interaction);
    case ButtonAction.SubscriptionListChangePage:
      return await subscriptionListChangePage(interaction, data);
  }
}
