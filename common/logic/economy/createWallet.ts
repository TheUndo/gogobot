import { prisma } from "!/prisma";

// Upsert does not work https://github.com/prisma/prisma/issues/22947

export async function createWallet(userId: string, guildId: string) {
  const find = await prisma.wallet.findUnique({
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

  return await prisma.wallet.create({
    data: {
      userDiscordId: userId,
      guildId,
    },
  });
}
