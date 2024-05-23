import {
  Resources,
  ShopItemType,
  resourceEmojis,
  resourceIds,
  resourceNames,
  resourcePrices,
  toolDurability,
  toolEmojis,
  toolIds,
  toolNames,
  toolPrices,
} from "!/bot/interactions/commands/economy/lib/shopCatalogue";

export const items: Record<ShopItemType, ShopItem> = {
  [ShopItemType.StonePickaxe]: {
    id: toolIds.STONE_PICKAXE,
    type: ShopItemType.StonePickaxe,
    name: toolNames.STONE_PICKAXE,
    price: toolPrices.STONE_PICKAXE,
    durability: toolDurability.STONE_PICKAXE,
    emoji: toolEmojis.STONE_PICKAXE,
  },
  [ShopItemType.IronPickaxe]: {
    id: toolIds.IRON_PICKAXE,
    type: ShopItemType.IronPickaxe,
    name: toolNames.IRON_PICKAXE,
    price: toolPrices.IRON_PICKAXE,
    durability: toolDurability.IRON_PICKAXE,
    emoji: toolEmojis.IRON_PICKAXE,
  },
  [ShopItemType.DiamondPickaxe]: {
    id: toolIds.DIAMOND_PICKAXE,
    type: ShopItemType.DiamondPickaxe,
    name: toolNames.DIAMOND_PICKAXE,
    price: toolPrices.DIAMOND_PICKAXE,
    durability: toolDurability.DIAMOND_PICKAXE,
    emoji: toolEmojis.DIAMOND_PICKAXE,
  },
};

export const sellResourceItems: Record<
  Resources,
  {
    id: string;
    type: Resources;
    name: string;
    sellPrice: number;
    emoji: string;
  }
> = {
  [Resources.Copper]: {
    id: resourceIds.COPPER,
    type: Resources.Copper,
    name: resourceNames.COPPER,
    sellPrice: resourcePrices.COPPER,
    emoji: resourceEmojis.COPPER,
  },
  [Resources.Silver]: {
    id: resourceIds.SILVER,
    type: Resources.Silver,
    name: resourceNames.SILVER,
    sellPrice: resourcePrices.SILVER,
    emoji: resourceEmojis.SILVER,
  },
  [Resources.Iron]: {
    id: resourceIds.IRON,
    type: Resources.Iron,
    name: resourceNames.IRON,
    sellPrice: resourcePrices.IRON,
    emoji: resourceEmojis.IRON,
  },
  [Resources.Gold]: {
    id: resourceIds.GOLD,
    type: Resources.Gold,
    name: resourceNames.GOLD,
    sellPrice: resourcePrices.GOLD,
    emoji: resourceEmojis.GOLD,
  },
  [Resources.Emerald]: {
    id: resourceIds.EMERALD,
    type: Resources.Emerald,
    name: resourceNames.EMERALD,
    sellPrice: resourcePrices.EMERALD,
    emoji: resourceEmojis.EMERALD,
  },
  [Resources.Diamond]: {
    id: resourceIds.DIAMOND,
    type: Resources.Diamond,
    name: resourceNames.DIAMOND,
    sellPrice: resourcePrices.DIAMOND,
    emoji: resourceEmojis.DIAMOND,
  },
  [Resources.Titanium]: {
    id: resourceIds.TITANIUM,
    type: Resources.Titanium,
    name: resourceNames.TITANIUM,
    sellPrice: resourcePrices.TITANIUM,
    emoji: resourceEmojis.TITANIUM,
  },
  [Resources.Netherite]: {
    id: resourceIds.NETHERITE,
    type: Resources.Netherite,
    name: resourceNames.NETHERITE,
    sellPrice: resourcePrices.NETHERITE,
    emoji: resourceEmojis.NETHERITE,
  },
  [Resources.Kryptonite]: {
    id: resourceIds.KRYPTONITE,
    type: Resources.Kryptonite,
    name: resourceNames.KRYPTONITE,
    sellPrice: resourcePrices.KRYPTONITE,
    emoji: resourceEmojis.KRYPTONITE,
  },
  [Resources.RockSlide]: {
    id: resourceIds.ROCK_FALL,
    type: Resources.RockSlide,
    name: resourceNames.ROCK_FALL,
    sellPrice: resourcePrices.ROCK_FALL,
    emoji: resourceEmojis.ROCK_FALL,
  },
  [Resources.DeadEnd]: {
    id: resourceIds.DEAD_END,
    type: Resources.DeadEnd,
    name: resourceNames.DEAD_END,
    sellPrice: resourcePrices.DEAD_END,
    emoji: resourceEmojis.DEAD_END,
  },
  [Resources.Nothing]: {
    id: resourceIds.NOTHING,
    type: Resources.Nothing,
    name: resourceNames.NOTHING,
    sellPrice: resourcePrices.NOTHING,
    emoji: resourceEmojis.NOTHING,
  },
  [Resources.Ambush]: {
    id: resourceIds.AMBUSH,
    type: Resources.Ambush,
    name: resourceNames.AMBUSH,
    sellPrice: resourcePrices.AMBUSH,
    emoji: resourceEmojis.AMBUSH,
  },
};
