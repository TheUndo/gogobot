import { prisma } from "../../../prisma";

export async function createBank(userId: string, guildId: string) {
  return await prisma.bank.upsert({
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
