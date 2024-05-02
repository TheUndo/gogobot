export enum ItemType {
  Tools = "TOOLS",
  Resources = "RESOURCES",
}

/** Tools Section */

export enum ToolTypes {
  StonePickaxe = "STONE_PICKAXE",
  IronPickaxe = "IRON_PICKAXE",
  DiamondPickaxe = "DIAMOND_PICKAXE",
}

export const toolIds: Record<ToolTypes, string> = {
  [ToolTypes.StonePickaxe]: "STONEPICKAXE",
  [ToolTypes.IronPickaxe]: "IRONPICKAXE",
  [ToolTypes.DiamondPickaxe]: "DIAMONDPICKAXE",
};

export const toolNames: Record<ToolTypes, string> = {
  [ToolTypes.StonePickaxe]: "Stone Pickaxe",
  [ToolTypes.IronPickaxe]: "Iron Pickaxe",
  [ToolTypes.DiamondPickaxe]: "Diamond Pickaxe",
};

export const toolDurability: Record<ToolTypes, number> = {
  [ToolTypes.StonePickaxe]: 100,
  [ToolTypes.IronPickaxe]: 150,
  [ToolTypes.DiamondPickaxe]: 200,
};

export const toolPrices: Record<ToolTypes, number> = {
  [ToolTypes.StonePickaxe]: 300_000,
  [ToolTypes.IronPickaxe]: 1_000_000,
  [ToolTypes.DiamondPickaxe]: 5_000_000,
};

export const toolEmojis: Record<ToolTypes, string> = {
  [ToolTypes.StonePickaxe]: "<:Stone_Pickaxe:1233853170912989308> ",
  [ToolTypes.IronPickaxe]: "<:Iron_Pickaxe:1233853154932559934>",
  [ToolTypes.DiamondPickaxe]: "<:Diamond_Pickaxe:1233853120363102341>",
};

/** Resource Section */

export enum ResourceTypes {
  Copper = "COPPER",
  Silver = "SILVER",
  Iron = "IRON",
  Gold = "GOLD",
  Emerald = "EMERALD",
  Diamond = "DIAMOND",
}

export const resourceIds: Record<ResourceTypes, string> = {
  [ResourceTypes.Copper]: "RESOURCECOPPER",
  [ResourceTypes.Silver]: "RESOURCESILVER",
  [ResourceTypes.Iron]: "RESOURCEIRON",
  [ResourceTypes.Gold]: "RESOURCEGOLD",
  [ResourceTypes.Emerald]: "RESOURCEEMERALD",
  [ResourceTypes.Diamond]: "RESOURCEDIAMOND",
};

export const resourceNames: Record<ResourceTypes, string> = {
  [ResourceTypes.Copper]: "Copper",
  [ResourceTypes.Silver]: "Silver",
  [ResourceTypes.Iron]: "Iron",
  [ResourceTypes.Gold]: "Gold",
  [ResourceTypes.Emerald]: "Emerald",
  [ResourceTypes.Diamond]: "Diamond",
};

export const resourcePrices: Record<ResourceTypes, number> = {
  [ResourceTypes.Copper]: 0,
  [ResourceTypes.Silver]: 0,
  [ResourceTypes.Iron]: 0,
  [ResourceTypes.Gold]: 0,
  [ResourceTypes.Emerald]: 0,
  [ResourceTypes.Diamond]: 0,
};

export const resourceEmojis: Record<ResourceTypes, string> = {
  [ResourceTypes.Copper]: "<:Copper:1235516426912272414>",
  [ResourceTypes.Silver]: "<:Silver:1235516425146335252>",
  [ResourceTypes.Iron]: "<:Iron:1235516433853841489>",
  [ResourceTypes.Gold]: "<:Gold:1235516431794307142>",
  [ResourceTypes.Emerald]: "<:Emerald:1235516429873184789>",
  [ResourceTypes.Diamond]: "<:Diamond:1235516428363501599>",
};
