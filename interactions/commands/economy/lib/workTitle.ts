import { sprintf } from "sprintf-js";

export function workTitle(reward: number) {
  if (reward < 0) {
    return sprintf("You lost $%s", Math.abs(reward));
  }
  return sprintf("+$%s", reward);
}
