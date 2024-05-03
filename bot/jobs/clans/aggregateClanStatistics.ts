import { prisma } from "../../../core/db/prisma";

/** Caches statistics about clans because it is expensive to calculate them. */
export async function aggregateClanStatistics() {
  const clans = await prisma.clan.findMany({});

  for (const clan of clans) {
    const members = await prisma.clanMember.findMany({
      where: {
        clanId: clan.id,
      },
      select: {
        clanId: true,
        discordUserId: true,
      },
    });

    const discordUserIds = members.map((m) => m.discordUserId);

    const wealth = await prisma
      .$transaction([
        prisma.bank.findMany({
          where: {
            userDiscordId: {
              in: discordUserIds,
            },
            guildId: clan.discordGuildId,
          },
          select: {
            balance: true,
          },
        }),
        prisma.wallet.findMany({
          where: {
            userDiscordId: {
              in: discordUserIds,
            },
          },
          select: {
            balance: true,
          },
        }),
      ])
      .then((accounts) => {
        return accounts.reduce((acc, account) => {
          return (
            acc + account.reduce((acc, account) => acc + account.balance, 0n)
          );
        }, 0n);
      });

    // upsert is broken on prisma sqlite
    await prisma.$transaction([
      prisma.clanStatistics.deleteMany({
        where: {
          clanId: clan.id,
        },
      }),
      prisma.clanStatistics.create({
        data: {
          guildId: clan.discordGuildId,
          clanId: clan.id,
          wealth,
        },
      }),
    ]);
  }
}
