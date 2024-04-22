import { prisma } from "!/prisma";
import { sprintf } from "sprintf-js";

export const _userNamesCache = new Map<
  string,
  {
    readonly nickname?: string;
    readonly username: string;
    readonly userId: string;
    readonly guildId: string;
  }
>();

function key({ userId, guildId }: { userId: string; guildId: string }): string {
  return sprintf("%s:%s", userId, guildId);
}

await (async () => {
  const r = new WeakRef(
    await prisma.discordCacheUserNameCache
      .findMany({
        select: {
          userDiscordId: true,
          guildId: true,
          nickname: true,
          username: true,
        },
      })
      .then((v) =>
        v.map(
          (v) =>
            [
              { userId: v.userDiscordId, guildId: v.guildId },
              {
                nickname: v.nickname ?? undefined,
                username: v.username,
                userId: v.userDiscordId,
                guildId: v.guildId,
              },
            ] as const,
        ),
      ),
  );

  for (const [{ userId, guildId }, v] of r.deref() ?? []) {
    _userNamesCache.set(
      key({
        userId,
        guildId,
      }),
      v,
    );
  }
})();

type Options = {
  guildId?: string | null;
  userId: string;
  username: string;
  nickname?: string;
};

/** Caches username and nickname in memory, later a cron will sync this cache with db */
export function setName({
  guildId,
  userId,
  username,
  nickname,
}: Options): void {
  if (guildId) {
    _userNamesCache.set(
      key({
        userId,
        guildId,
      }),
      { username, nickname, userId, guildId },
    );
  }
}

export function getName({
  guildId,
  userId,
}: {
  guildId?: string;
  userId: string;
}): string {
  if (guildId) {
    const r = _userNamesCache.get(key({ userId, guildId }));
    if (r) {
      return r.nickname ?? r.username;
    }
  }
  return sprintf("<@%s>", userId);
}
