import { sprintf } from "sprintf-js";
import { addCurrency } from "!/common/utils/addCurrency";
import { formatNumber } from "!/common/utils/formatNumber";

export function workTitle(reward: number) {
  if (reward < 0) {
    return sprintf(
      "You lost %s",
      addCurrency()(formatNumber(Math.abs(reward))),
    );
  }
  return sprintf("+%s", addCurrency()(formatNumber(reward)));
}
