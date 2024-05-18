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
  [ToolTypes.DiamondPickaxe]: 7_500_000,
};

export const toolEmojis: Record<ToolTypes, string> = {
  [ToolTypes.StonePickaxe]: "<:Stone_Pickaxe:1233853170912989308> ",
  [ToolTypes.IronPickaxe]: "<:Iron_Pickaxe:1233853154932559934>",
  [ToolTypes.DiamondPickaxe]: "<:Diamond_Pickaxe:1233853120363102341>",
};

/** Resource Section */

export enum Resources {
  Copper = "COPPER", // 1k
  Silver = "SILVER", //10k
  Iron = "IRON", //50k
  Titanium = "TITANIUM", //75k
  Gold = "GOLD", // 100k
  Emerald = "EMERALD", // 500k
  Diamond = "DIAMOND", //1m
  Netherite = "NETHERITE", //3m
  Kryptonite = "KRYPTONITE", //5m
  RockSlide = "ROCK_FALL", //-10k
  DeadEnd = "DEAD_END", // 0
  Nothing = "NOTHING", // 0
  Ambush = "AMBUSH", // -100k
}

export const resourceIds: Record<Resources, string> = {
  [Resources.Copper]: "RESOURCECOPPER",
  [Resources.Silver]: "RESOURCESILVER",
  [Resources.Iron]: "RESOURCEIRON",
  [Resources.Gold]: "RESOURCEGOLD",
  [Resources.Emerald]: "RESOURCEEMERALD",
  [Resources.Diamond]: "RESOURCEDIAMOND",
  [Resources.Titanium]: "RESOURCETITANIUM",
  [Resources.Netherite]: "RESOURCENETHERITE",
  [Resources.Kryptonite]: "RESOURCEKRYPTONITE",
  [Resources.RockSlide]: "",
  [Resources.DeadEnd]: "",
  [Resources.Nothing]: "",
  [Resources.Ambush]: "",
};

export const resourceNames: Record<Resources, string> = {
  [Resources.Copper]: "Copper",
  [Resources.Silver]: "Silver",
  [Resources.Iron]: "Iron",
  [Resources.Gold]: "Gold",
  [Resources.Emerald]: "Emerald",
  [Resources.Diamond]: "Diamond",
  [Resources.Titanium]: "Titanium",
  [Resources.Netherite]: "Netherite",
  [Resources.Kryptonite]: "Kryptonite",
  [Resources.RockSlide]: "",
  [Resources.DeadEnd]: "",
  [Resources.Nothing]: "",
  [Resources.Ambush]: "",
};

export const resourcePrices: Record<Resources, number> = {
  [Resources.Copper]: 10_000,
  [Resources.Silver]: 40_000,
  [Resources.Iron]: 20_000,
  [Resources.Gold]: 80_000,
  [Resources.Emerald]: 300_000,
  [Resources.Diamond]: 800_000,
  [Resources.Titanium]: 60_000,
  [Resources.Netherite]: 1_000_000,
  [Resources.Kryptonite]: 3_000_000,
  [Resources.RockSlide]: 0,
  [Resources.DeadEnd]: 0,
  [Resources.Nothing]: 0,
  [Resources.Ambush]: 0,
};

export const resourceEmojis: Record<Resources, string> = {
  [Resources.Copper]: "<:Copper:1235516426912272414>",
  [Resources.Silver]: "<:Silver:1235516425146335252>",
  [Resources.Iron]: "<:Iron:1235516433853841489>",
  [Resources.Gold]: "<:Gold:1235516431794307142>",
  [Resources.Emerald]: "<:Emerald:1235516429873184789>",
  [Resources.Diamond]: "<:Diamond:1235516428363501599>",
  [Resources.Titanium]: "<:Titanium:1235577345620840519>",
  [Resources.Netherite]: "<:Netherite:1235577766208868362>",
  [Resources.Kryptonite]: "<:Kryptonite:1235612530559156335>",
  [Resources.RockSlide]: "",
  [Resources.DeadEnd]: "",
  [Resources.Nothing]: "",
  [Resources.Ambush]: "",
};
