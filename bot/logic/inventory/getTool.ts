import {
  ToolTypes,
  toolIds,
} from "!/bot/interactions/commands/economy/lib/shopConfig";
import { buyToolItems } from "!/bot/interactions/commands/economy/lib/shopItems";
import { z } from "zod";

export async function getTool(toolId: string) {
  const toolType = Object.keys(toolIds).find(
    (key) => toolIds[z.nativeEnum(ToolTypes).parse(key)] === toolId,
  ) as ToolTypes;
  if (!toolType) {
    return;
  }
  return buyToolItems[toolType];
}
