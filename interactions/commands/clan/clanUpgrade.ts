import { sprintf } from "sprintf-js";
import { z } from "zod";
import { ClanMemberRole } from "~/common/types";
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
      content: "You are not in a clan.",
      ephemeral: true,
    };
  }

  const clanMember = await prisma.clanMember.findFirst({
    where: {
      clanId: clan.id,
      discordUserId: authorId,
    },
  });

  if (!clanMember) {
    return {
      content: "You are not in a clan.",
      ephemeral: true,
    };
  }

  if (
    ![
      ClanMemberRole.Leader,
      ClanMemberRole.Officer,
      ClanMemberRole.Senior,
    ].includes(z.nativeEnum(ClanMemberRole).parse(clanMember.role))
  ) {
    return {
      content:
        "You must be a clan leader, officer, or senior to upgrade the clan.",
      ephemeral: true,
    };
  }

  const price = upgradePrice(clan.level);

  if (clan.treasuryBalance < price) {
    return {
      content: sprintf(
        "Upgrading the clan costs **%s**. Your clan **%s**, needs **%s** more in its clan treasury to afford the upgrade. Deposit money to the treasury with `/clan deposit`.",
        addCurrency()(formatNumber(price)),
        clan.name,
        addCurrency()(formatNumber(price - clan.treasuryBalance)),
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
        treasuryBalance: {
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
