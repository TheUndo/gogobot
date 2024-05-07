import { sprintf } from "sprintf-js";

type itemOption = {
  name: string;
  emoji: string;
};

export async function formatItem(item: itemOption) {
  return sprintf("%s|%s", item.emoji, item.name);
}
