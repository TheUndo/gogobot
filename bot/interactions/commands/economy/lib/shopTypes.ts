import type { ShopItemType } from "./shopCatalogue";

export type ShopItemBase<
  TCategory extends ShopItemCategory,
  TSellable extends boolean,
> = {
  category: TCategory;
  id: number;
  type: ShopItemType;
  name: string;
  price: number;
  emoji: string;
} & (TSellable extends true
  ? { sellable: true; sellPrice: number }
  : { sellable?: false });

export type ShopItemTool = ShopItemBase<ShopItemCategory.Tool, true> & {
  durability: number;
};

export type ShopItemResource = ShopItemBase<ShopItemCategory.Resource, true>;

export type ShopItemFood = ShopItemBase<ShopItemCategory.Food, false> & {
  health: number;
};

export type ShopItem = ShopItemTool | ShopItemResource | ShopItemFood;

export enum ShopItemCategory {
  Tool = "TOOL",
  Resource = "RESOURCE",
  Food = "FOOD",
}
