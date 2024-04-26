import { prisma } from "../../../core/db/prisma";

// Upsert does not work https://github.com/prisma/prisma/issues/22947

export async function createBank(userId: string, guildId: string) {
  const find = await prisma.bank.findUnique({
    where: {
      userDiscordId_guildId: {
        userDiscordId: userId,
        guildId,
      },
    },
  });

  if (find) {
    return find;
  }

  return await prisma.bank.create({
    data: {
      userDiscordId: userId,
      guildId,
    },
  });
}
