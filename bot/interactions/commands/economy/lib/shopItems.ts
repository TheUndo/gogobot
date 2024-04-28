import {
  ToolTypes,
  toolDurability,
  toolEmojis,
  toolIds,
  toolNames,
  toolPrices,
} from "!/bot/interactions/commands/economy/lib/shopConfig";

export const buyToolItems: Record<
  ToolTypes,
  { id: string; type: ToolTypes; name: string; price: number; durability: number; emoji: string }
> = {
  [ToolTypes.StonePickaxe]: {
    id: toolIds.STONE_PICKAXE,
    type: ToolTypes.StonePickaxe,
    name: toolNames.STONE_PICKAXE,
    price: toolPrices.STONE_PICKAXE,
    durability: toolDurability.STONE_PICKAXE,
    emoji: toolEmojis.STONE_PICKAXE
  },
  [ToolTypes.IronPickaxe]: {
    id: toolIds.IRON_PICKAXE,
    type: ToolTypes.IronPickaxe,
    name: toolNames.IRON_PICKAXE,
    price: toolPrices.IRON_PICKAXE,
    durability: toolDurability.IRON_PICKAXE,
    emoji: toolEmojis.IRON_PICKAXE
  },
  [ToolTypes.DiamondPickaxe]: {
    id: toolIds.DIAMOND_PICKAXE,
    type: ToolTypes.DiamondPickaxe,
    name: toolNames.DIAMOND_PICKAXE,
    price: toolPrices.DIAMOND_PICKAXE,
    durability: toolDurability.DIAMOND_PICKAXE,
    emoji: toolEmojis.DIAMOND_PICKAXE
  },
};

export const sellResourceItems: Record<string, number> = {};
