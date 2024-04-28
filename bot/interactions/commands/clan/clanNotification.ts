import type { Colors } from "!/bot/types";
import { prisma } from "!/core/db/prisma";
import { EmbedBuilder } from "discord.js";
import { sprintf } from "sprintf-js";
import { upsertClanChannel } from "./clanChannel";

export async function clanNotification(
  clanId: string,
  message: string,
  color: Colors,
): Promise<{ ok: boolean }> {
  const clan = await prisma.clan.findUnique({
    where: { id: clanId },
  });

  if (!clan) {
    return {
      ok: false,
    };
  }

  const channel = await upsertClanChannel(clan.id);

  if (!channel) {
    return {
      ok: false,
    };
  }

  const embed = new EmbedBuilder()
    .setColor(color)
    .setDescription(message)
    .setFooter({
      text: sprintf("%s notification", clan.name),
      iconURL: clan.settingsLogo ?? undefined,
    });

  return await channel
    .send({ embeds: [embed] })
    .catch((e) => {
      console.error("Error sending clan notification", e);
      return {
        ok: false,
      };
    })
    .then(() => {
      return {
        ok: true,
      };
    });
}
