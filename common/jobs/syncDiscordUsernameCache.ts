import { prisma } from "!/prisma";
import { _userNamesCache } from "../logic/discordCache/store";
import * as R from "remeda";

export async function syncDiscordUsernameCache(): Promise<void> {
  const chunked = R.chunk([..._userNamesCache], 100);

  for (const chunk of chunked) {
    await prisma.$transaction([
      prisma.discordCacheUserNameCache.deleteMany({
        where: {
          userDiscordId: {
            in: chunk.map(([, v]) => v.userId),
          },
        },
      }),
      prisma.discordCacheUserNameCache.createMany({
        data: chunk.map(([, v]) => ({
          userDiscordId: v.userId,
          guildId: v.guildId,
          nickname: v.nickname,
          username: v.username,
        })),
      }),
    ]);
    await new Promise((r) => setTimeout(r, 1000));
  }
}
