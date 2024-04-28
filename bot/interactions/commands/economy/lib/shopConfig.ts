export enum itemTypes {
  Tools = "TOOLS",
  Resources = "RESOURCES",
}

//Tools Section

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
  [ToolTypes.StonePickaxe]: 100_000,
  [ToolTypes.IronPickaxe]: 500_000,
  [ToolTypes.DiamondPickaxe]: 2_000_000,
};

export const toolEmojis: Record<ToolTypes, string> = {
  [ToolTypes.StonePickaxe]: "<:Stone_Pickaxe:1233853170912989308> ",
  [ToolTypes.IronPickaxe]: "<:Iron_Pickaxe:1233853154932559934>",
  [ToolTypes.DiamondPickaxe]: "<:Diamond_Pickaxe:1233853120363102341>",
}

// Resource Section
