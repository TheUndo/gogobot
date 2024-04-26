import { createWallet } from "!/bot/logic/economy/createWallet";
import { TransactionType } from "!/bot/types";
import { addCurrency } from "!/bot/utils/addCurrency";
import { formatNumber } from "!/bot/utils/formatNumber";
import { safeParseNumber } from "!/bot/utils/parseNumber";
import { prisma } from "!/core/db/prisma";
import { sprintf } from "sprintf-js";
import { z } from "zod";

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

  if (amountToDeposit <= 0) {
    return {
      content: "Invalid amount.",
      ephemeral: true,
    };
  }

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
    prisma.transaction.create({
      data: {
        amount: amountToDeposit,
        type: TransactionType.ClanDeposit,
        clanId: clan.id,
        userDiscordId: authorId,
        guildId,
      },
    }),
    prisma.clanMember.update({
      where: {
        clanId_discordUserId: {
          clanId: clan.id,
          discordUserId: authorId,
        },
      },
      data: {
        contributed: {
          increment: amountToDeposit,
        },
        lastContribution: new Date(),
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
