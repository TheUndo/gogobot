import { sprintf } from "sprintf-js";
import { createWallet } from "~/common/logic/economy/createWallet";
import { addCurrency } from "~/common/utils/addCurrency";
import { formatNumber } from "~/common/utils/formatNumber";
import { prisma } from "~/prisma";

type Options = {
  authorId: string;
  guildId: string;
};
export async function clanUpgradeCommand({ authorId, guildId }: Options) {
  const clan = await prisma.clan.findFirst({
    where: {
      members: {
        some: {
          discordUserId: authorId,
        },
      },
      discordGuildId: guildId,
    },
  });

  if (!clan) {
    return {
      content: "You are not in a clan",
      ephemeral: true,
    };
  }

  const wallet = await createWallet(authorId, guildId);
  const price = upgradePrice(clan.level);

  if (wallet.balance < price) {
    return {
      content: sprintf(
        "Upgrading the clan costs **%s** you need **%s** more to afford the upgrade. You can ask your clan members to help you out.",
        addCurrency()(formatNumber(price)),
        addCurrency()(formatNumber(price - wallet.balance)),
      ),
      ephemeral: false,
    };
  }

  await prisma.$transaction([
    prisma.clan.update({
      where: {
        id: clan.id,
      },
      data: {
        level: {
          increment: 1,
        },
      },
    }),
    prisma.wallet.update({
      where: {
        id: wallet.id,
      },
      data: {
        balance: {
          decrement: price,
        },
      },
    }),
  ]);

  return {
    content: sprintf(
      "🎉 <@%s> upgraded **%s** to level **%d**! All **%s** members will now receive bigger bonuses.",
      authorId,
      clan.name,
      clan.level + 1,
      clan.name,
    ),
  };
}

function upgradePrice(level: number) {
  const exact = Math.floor(1.3 ** level + level * 20_000) + 8_000;
  const precision = Math.max(exact.toString().length - 3, 1);
  return Math.round(exact / 10 ** precision) * 10 ** precision;
}
