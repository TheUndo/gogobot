import { prisma } from "!/prisma";

export async function getGuildConfig(guildId: string) {
  const find = await prisma.guildConfig.findUnique({
    where: { id: guildId },
  });

  if (!find) {
    return await prisma.guildConfig.create({
      data: {
        id: guildId,
      },
    });
  }

  return find;
}
