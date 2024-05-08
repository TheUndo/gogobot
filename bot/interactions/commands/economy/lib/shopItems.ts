import {
  ResourceTypes,
  ToolTypes,
  resourceEmojis,
  resourceIds,
  resourceNames,
  resourcePrices,
  toolDurability,
  toolEmojis,
  toolIds,
  toolNames,
  toolPrices,
} from "!/bot/interactions/commands/economy/lib/shopConfig";

export const buyToolItems: Record<
  ToolTypes,
  {
    id: string;
    type: ToolTypes;
    name: string;
    price: number;
    durability: number;
    emoji: string;
  }
> = {
  [ToolTypes.StonePickaxe]: {
    id: toolIds.STONE_PICKAXE,
    type: ToolTypes.StonePickaxe,
    name: toolNames.STONE_PICKAXE,
    price: toolPrices.STONE_PICKAXE,
    durability: toolDurability.STONE_PICKAXE,
    emoji: toolEmojis.STONE_PICKAXE,
  },
  [ToolTypes.IronPickaxe]: {
    id: toolIds.IRON_PICKAXE,
    type: ToolTypes.IronPickaxe,
    name: toolNames.IRON_PICKAXE,
    price: toolPrices.IRON_PICKAXE,
    durability: toolDurability.IRON_PICKAXE,
    emoji: toolEmojis.IRON_PICKAXE,
  },
  [ToolTypes.DiamondPickaxe]: {
    id: toolIds.DIAMOND_PICKAXE,
    type: ToolTypes.DiamondPickaxe,
    name: toolNames.DIAMOND_PICKAXE,
    price: toolPrices.DIAMOND_PICKAXE,
    durability: toolDurability.DIAMOND_PICKAXE,
    emoji: toolEmojis.DIAMOND_PICKAXE,
  },
};

export const sellResourceItems: Record<
  ResourceTypes,
  {
    id: string;
    name: string;
    sellPrice: number;
    emoji: string;
  }
> = {
  [ResourceTypes.Copper]: {
    id: resourceIds.COPPER,
    name: resourceNames.COPPER,
    sellPrice: resourcePrices.COPPER,
    emoji: resourceEmojis.COPPER,
  },
  [ResourceTypes.Silver]: {
    id: resourceIds.SILVER,
    name: resourceNames.SILVER,
    sellPrice: resourcePrices.SILVER,
    emoji: resourceEmojis.SILVER,
  },
  [ResourceTypes.Iron]: {
    id: resourceIds.IRON,
    name: resourceNames.IRON,
    sellPrice: resourcePrices.IRON,
    emoji: resourceEmojis.IRON,
  },
  [ResourceTypes.Gold]: {
    id: resourceIds.GOLD,
    name: resourceNames.GOLD,
    sellPrice: resourcePrices.GOLD,
    emoji: resourceEmojis.GOLD,
  },
  [ResourceTypes.Emerald]: {
    id: resourceIds.EMERALD,
    name: resourceNames.EMERALD,
    sellPrice: resourcePrices.EMERALD,
    emoji: resourceEmojis.EMERALD,
  },
  [ResourceTypes.Diamond]: {
    id: resourceIds.DIAMOND,
    name: resourceNames.DIAMOND,
    sellPrice: resourcePrices.DIAMOND,
    emoji: resourceEmojis.DIAMOND,
  },
  [ResourceTypes.Titanium]: {
    id: resourceIds.TITANIUM,
    name: resourceNames.TITANIUM,
    sellPrice: resourcePrices.TITANIUM,
    emoji: resourceEmojis.TITANIUM,
  },
  [ResourceTypes.Netherite]: {
    id: resourceIds.NETHERITE,
    name: resourceNames.NETHERITE,
    sellPrice: resourcePrices.NETHERITE,
    emoji: resourceEmojis.NETHERITE,
  },
  [ResourceTypes.Kryptonite]: {
    id: resourceIds.KRYPTONITE,
    name: resourceNames.KRYPTONITE,
    sellPrice: resourcePrices.KRYPTONITE,
    emoji: resourceEmojis.KRYPTONITE,
  },
};
