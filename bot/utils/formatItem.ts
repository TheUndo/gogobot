import { sprintf } from "sprintf-js";

type Item = {
  name: string;
  emoji: string;
};

export function formatItem<T extends Item>(item: T) {
  return sprintf("%s|%s", item.emoji, item.name);
}
