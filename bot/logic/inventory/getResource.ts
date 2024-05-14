import {
  resourceIds,
  Resources,
} from "!/bot/interactions/commands/economy/lib/shopConfig";
import { sellResourceItems } from "!/bot/interactions/commands/economy/lib/shopItems";
import { z } from "zod";

export async function getResource(resourceId: string) {
  const resourceType = Object.keys(resourceIds).find(
    (key) => resourceIds[z.nativeEnum(Resources).parse(key)] === resourceId,
  ) as Resources;
  if (!resourceType) {
    return;
  }
  return sellResourceItems[resourceType];
}
