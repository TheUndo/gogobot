import { prisma } from "~/prisma";

type Options = {
  authorId: string;
  guildId: string;
};

export async function clanListCommand({ authorId, guildId }: Options) {
  const [myClan, clans] = await prisma.$transaction([
    prisma.clan.findFirst({
      where: {
        members: {
          some: {
            discordUserId: authorId,
          },
        },
        discordGuildId: guildId,
      },
    }),
    prisma.clan.findMany({
      where: {
        discordGuildId: guildId,
      },
      orderBy: {
        level: "desc",
      },
      select: {
        name: true,
        _count: {
          select: {
            members: true,
          },
        },
      },
    }),
  ]);
}
