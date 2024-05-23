import { type ShopItem, ShopItemCategory } from "./shopTypes";

export enum ShopItemType {
  StonePickaxe = "STONE_PICKAXE",
  IronPickaxe = "IRON_PICKAXE",
  DiamondPickaxe = "DIAMOND_PICKAXE",
}

export const shopCatalogue: ShopItem[] = [
  {
    id: 0,
    type: ShopItemType.StonePickaxe,
    name: "Stone Pickaxe",
    price: 300_000,
    durability: 100,
    emoji: "<:Stone_Pickaxe:1233853170912989308>",
    category: ShopItemCategory.Tool,
    sellable: true,
    sellPrice: 150_000,
  },
  {
    id: 1,
    type: ShopItemType.IronPickaxe,
    name: "Iron Pickaxe",
    price: 1_000_000,
    durability: 150,
    emoji: "<:Iron_Pickaxe:1233853154932559934>",
    category: ShopItemCategory.Tool,
    sellable: true,
    sellPrice: 500_000,
  },
  {
    id: 2,
    type: ShopItemType.DiamondPickaxe,
    name: "Diamond Pickaxe",
    price: 7_500_000,
    durability: 200,
    emoji: "<:Diamond_Pickaxe:1233853120363102341>",
    category: ShopItemCategory.Tool,
    sellable: true,
    sellPrice: 3_750_000,
  },
];

export const toolIds: Record<ShopItemType, string> = {
  [ShopItemType.StonePickaxe]: "STONEPICKAXE",
  [ShopItemType.IronPickaxe]: "IRONPICKAXE",
  [ShopItemType.DiamondPickaxe]: "DIAMONDPICKAXE",
};

export const toolNames: Record<ShopItemType, string> = {
  [ShopItemType.StonePickaxe]: "Stone Pickaxe",
  [ShopItemType.IronPickaxe]: "Iron Pickaxe",
  [ShopItemType.DiamondPickaxe]: "Diamond Pickaxe",
};

export const toolDurability: Record<ShopItemType, number> = {
  [ShopItemType.StonePickaxe]: 100,
  [ShopItemType.IronPickaxe]: 150,
  [ShopItemType.DiamondPickaxe]: 200,
};

export const toolPrices: Record<ShopItemType, number> = {
  [ShopItemType.StonePickaxe]: 300_000,
  [ShopItemType.IronPickaxe]: 1_000_000,
  [ShopItemType.DiamondPickaxe]: 7_500_000,
};

export const toolEmojis: Record<ShopItemType, string> = {
  [ShopItemType.StonePickaxe]: "<:Stone_Pickaxe:1233853170912989308> ",
  [ShopItemType.IronPickaxe]: "<:Iron_Pickaxe:1233853154932559934>",
  [ShopItemType.DiamondPickaxe]: "<:Diamond_Pickaxe:1233853120363102341>",
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
