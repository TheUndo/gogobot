import { addCurrency } from "!/bot/utils/addCurrency";
import { formatNumber } from "!/bot/utils/formatNumber";
import { sprintf } from "sprintf-js";

export function workTitle(reward: number) {
  if (reward < 0) {
    return sprintf(
      "You lost %s",
      addCurrency()(formatNumber(Math.abs(reward))),
    );
  }
  return sprintf("+%s", addCurrency()(formatNumber(reward)));
}
