import { EmbedBuilder } from "discord.js";
import { sprintf } from "sprintf-js";
import type { Colors } from "!/common/types";
import { prisma } from "!/prisma";
import { upsertClanChannel } from "./clanChannel";

export async function clanNotification(
  clanId: string,
  message: string,
  color: Colors,
) {
  const clan = await prisma.clan.findUnique({
    where: { id: clanId },
  });

  if (!clan) {
    return;
  }

  const channel = await upsertClanChannel(clan.id);

  if (!channel) {
    return;
  }

  const embed = new EmbedBuilder()
    .setColor(color)
    .setDescription(message)
    .setFooter({
      text: sprintf("%s notification", clan.name),
      iconURL: clan.settingsLogo ?? undefined,
    });

  await channel.send({ embeds: [embed] }).catch((e) => {
    console.error("Error sending clan notification", e);
  });
}
