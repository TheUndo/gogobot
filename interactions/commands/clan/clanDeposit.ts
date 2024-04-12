import { sprintf } from "sprintf-js";
import { z } from "zod";
import { createWallet } from "~/common/logic/economy/createWallet";
import { addCurrency } from "~/common/utils/addCurrency";
import { formatNumber } from "~/common/utils/formatNumber";
import { safeParseNumber } from "~/common/utils/parseNumber";
import { prisma } from "~/prisma";

export const clanInteractionContext = z.object({
  clanId: z.string(),
});

type Options = {
  authorId: string;
  guildId: string;
  amount: string;
};

export async function clanDeposit({ authorId, guildId, amount }: Options) {
  const parsedAmount = safeParseNumber(amount);

  if (parsedAmount == null || parsedAmount < 0) {
    return {
      content:
        "Invalid amount. Use positive integers only. Example: `/clan deposit 50k`",
      ephemeral: true,
    };
  }

  const clan = await prisma.clan.findFirst({
    where: {
      discordGuildId: guildId,
      members: {
        some: {
          discordUserId: authorId,
        },
      },
    },
    select: {
      id: true,
      treasuryBalance: true,
    },
  });

  if (!clan) {
    return {
      content: "You're not in a clan.",
      ephemeral: true,
    };
  }

  const wallet = await createWallet(authorId, guildId);

  const amountToDeposit = parsedAmount === 0 ? wallet.balance : parsedAmount;

  if (wallet.balance < amountToDeposit) {
    return {
      content: sprintf(
        "You don't have enough money to deposit **%s**",
        addCurrency()(formatNumber(amountToDeposit)),
      ),
    };
  }

  await prisma.$transaction([
    prisma.wallet.update({
      where: {
        id: wallet.id,
      },
      data: {
        balance: {
          decrement: amountToDeposit,
        },
      },
    }),
    prisma.clan.update({
      where: {
        id: clan.id,
      },
      data: {
        treasuryBalance: {
          increment: amountToDeposit,
        },
      },
    }),
  ]);

  return {
    content: sprintf(
      "<@%s> deposited **%s** to the clan treasury.",
      authorId,
      addCurrency()(formatNumber(amountToDeposit)),
    ),
  };
}
