import { prisma } from "../../../prisma";

export async function createWallet(userId: string, guildId: string) {
  return await prisma.wallet.upsert({
    where: {
      userDiscordId_guildId: {
        userDiscordId: userId,
        guildId,
      },
    },
    update: {},
    create: {
      userDiscordId: userId,
      guildId,
    },
  });
}
