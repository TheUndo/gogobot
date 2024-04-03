import type { AnyInteraction, InteractionContext } from "../../types";

export function wrongGuildForInteraction(
  _interactionContext: InteractionContext,
  _interaction: AnyInteraction,
) {
  return {
    content: "This interaction is not available in this guild.",
    ephemeral: true,
  };
}
