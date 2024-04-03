import type { AnyInteraction, InteractionContext } from "../../types";

export function notYourInteraction(
  _interactionContext: InteractionContext,
  _interaction: AnyInteraction,
) {
  return "This is not your interaction";
}
