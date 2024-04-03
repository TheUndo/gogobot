import type { AnyInteraction, InteractionContext } from "../../types";

export function interactionAlreadyConsumed(
  _interactionContext: InteractionContext,
  _interaction: AnyInteraction,
) {
  return {
    content: "This interaction is no longer available. Please start over.",
    ephemeral: true,
    embeds: [],
    components: [],
  };
}
