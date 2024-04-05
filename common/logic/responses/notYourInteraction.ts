import type { AnyInteraction, InteractionContext } from "../../types";

export function notYourInteraction(
  _interactionContext: InteractionContext,
  _interaction: AnyInteraction,
) {
  return {
    content: "This is not your interaction",
    ephemeral: true,
  };
}
