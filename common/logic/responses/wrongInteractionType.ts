import type { AnyInteraction, InteractionContext } from "../../types";

export function wrongInteractionType(
  _interactionContext: InteractionContext,
  _interaction: AnyInteraction,
) {
  return {
    content: "The interaction type does not match the expected type.",
    ephemeral: true,
  };
}
