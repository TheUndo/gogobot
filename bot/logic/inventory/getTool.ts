import {
  ShopItemType,
  toolIds,
} from "!/bot/interactions/commands/economy/lib/shopCatalogue";
import { items } from "!/bot/interactions/commands/economy/lib/shopItems";
import { z } from "zod";

export async function getTool(toolId: string) {
  const toolType = Object.keys(toolIds).find(
    (key) => toolIds[z.nativeEnum(ShopItemType).parse(key)] === toolId,
  ) as ShopItemType;
  if (!toolType) {
    return;
  }
  return items[toolType];
}
