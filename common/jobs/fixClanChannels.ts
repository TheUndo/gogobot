import {
  updateClanChannel,
  upsertClanChannel,
} from "~/interactions/commands/clan/clanChannel";
import { prisma } from "~/prisma";

export async function fixClanChannels() {
  const clans = await prisma.clan.findMany();

  for (const clan of clans) {
    await upsertClanChannel(clan.id).then((channel) => {
      if (!channel) {
        return;
      }
      return updateClanChannel(clan.id, channel);
    });
  }
}
