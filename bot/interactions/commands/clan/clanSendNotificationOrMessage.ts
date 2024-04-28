import type { Colors } from "!/bot/types";
import { prisma } from "!/core/db/prisma";
import { upsertClanChannel } from "./clanChannel";
import { clanNotification } from "./clanNotification";

export async function clanSendNotificationOrMessage(
  clanId: string,
  content: string,
  color: Colors,
) {
  const clan = await prisma.clan.findUnique({
    where: {
      id: clanId,
    },
  });
  const channel = clan ? await upsertClanChannel(clan.id) : null;

  if (channel && clan) {
    const { ok } = await clanNotification(clan.id, content, color);

    if (ok) {
      return {
        ephemeral: true,
        content,
      };
    }
  }

  return {
    content,
  };
}
