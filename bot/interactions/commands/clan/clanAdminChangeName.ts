import { client } from "!/bot/client";
import { Colors } from "!/bot/types";
import { prisma } from "!/core/db/prisma";
import { type InteractionReplyOptions, PermissionFlagsBits } from "discord.js";
import { sprintf } from "sprintf-js";
import { updateClanChannel, upsertClanChannel } from "./clanChannel";
import { clanNotification } from "./clanNotification";
import { validateClanName } from "./clanRole";

type Options = {
  authorId: string;
  guildId: string;
  newClanName: string;
  oldClanName: string;
  reason: string;
};

export async function clanAdminChangeName({
  authorId,
  guildId,
  newClanName,
  reason,
  oldClanName,
}: Options): Promise<InteractionReplyOptions> {
  const guild = await client.guilds.fetch(guildId).catch((e) => {
    console.error(`Failed to fetch guild ${guildId}`, e);
    return null;
  });

  if (!guild) {
    return {
      ephemeral: true,
      content: "Guild not found.",
    };
  }

  const author = await guild.members.fetch(authorId).catch((e) => {
    console.error(`Failed to fetch member ${authorId}`, e);
    return null;
  });

  if (!author) {
    return {
      ephemeral: true,
      content: "Author not found.",
    };
  }

  if (!author.permissions.has(PermissionFlagsBits.Administrator)) {
    return {
      ephemeral: true,
      content: "You do not have permission to set change a clan's name.",
    };
  }

  const clan = await prisma.clan.findFirst({
    where: {
      name: oldClanName,
      discordGuildId: guildId,
    },
  });

  if (!clan) {
    return {
      ephemeral: true,
      content: "Clan not found.",
    };
  }

  const checkedName = await validateClanName(newClanName, guildId);

  if ("error" in checkedName) {
    return {
      ephemeral: true,
      content: checkedName.error,
    };
  }

  await prisma.clan.update({
    where: {
      id: clan.id,
    },
    data: {
      name: checkedName.name,
      slug: checkedName.slug,
    },
  });

  const channel = await upsertClanChannel(clan.id);

  if (channel) {
    await updateClanChannel(clan.id, channel);
  }

  await clanNotification(
    clan.id,
    sprintf(
      "The clan's name has been changed to **%s** by an administrator. Reason: %s",
      checkedName.name,
      reason,
    ),
    Colors.Info,
  );

  return {
    ephemeral: true,
    content: "Name changed.",
  };
}
