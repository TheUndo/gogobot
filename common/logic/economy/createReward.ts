import { sprintf } from "sprintf-js";
import { prisma } from "../../../prisma";
import { addCurrency } from "../../utils/addCurrency";
import { formatNumber } from "../../utils/formatNumber";
import { createWallet } from "./createWallet";

const rewardTypes = {
  daily: {
    lastUsed: "lastUsedDaily",
    coolDown: 86400000,
    alreadyClaimed: (last: Date, coolDown: number) =>
      sprintf(
        "You already claimed your daily reward. Next claim <t:%s:R>",
        ((last.getTime() + coolDown) / 1000).toFixed(),
      ),
    rewardReceived: (reward: number) =>
      sprintf(
        "You claimed your daily reward of **%s**. Come back tomorrow!",
        addCurrency()(formatNumber(reward)),
      ),
    generateReward: async () => {
      return Math.floor(Math.random() * 1000) + 9500;
    },
  },
  weekly: {
    lastUsed: "lastUsedWeekly",
    coolDown: 604800000,
    alreadyClaimed: (last: Date, coolDown: number) =>
      sprintf(
        "You already claimed your weekly reward. Next claim <t:%s:R>",
        ((last.getTime() + coolDown) / 1000).toFixed(),
      ),
    rewardReceived: (reward: number) =>
      sprintf(
        "You claimed your weekly reward of **%s**. Come back next week!",
        addCurrency()(formatNumber(reward)),
      ),
    generateReward: async () => {
      return Math.floor(Math.random() * 50000) + 20000;
    },
  },
} as const;

type Options = {
  type: keyof typeof rewardTypes;
  userDiscordId: string;
  guildId: string;
};

export async function creteEconomyReward(options: Options) {
  const reward = rewardTypes[options.type];

  const wallet = await createWallet(options.userDiscordId, options.guildId);

  if (!wallet) {
    return "Failed to create wallet.";
  }

  const lastDaily = wallet[reward.lastUsed];

  if (lastDaily && lastDaily.getTime() + reward.coolDown > Date.now()) {
    return reward.alreadyClaimed(lastDaily, reward.coolDown);
  }

  const rewardAmount = await reward.generateReward();

  await prisma.wallet.update({
    where: {
      userDiscordId_guildId: {
        userDiscordId: options.userDiscordId,
        guildId: options.guildId,
      },
    },
    data: {
      balance: {
        increment: rewardAmount,
      },
      [reward.lastUsed]: new Date(),
    },
  });

  return reward.rewardReceived(rewardAmount);
}
