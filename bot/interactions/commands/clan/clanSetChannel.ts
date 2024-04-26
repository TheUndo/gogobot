import { client } from "!/bot/client";
import { prisma } from "!/core/db/prisma";
import { PermissionFlagsBits } from "discord.js";
import { updateClanChannel, upsertClanChannel } from "./clanChannel";

export async function clanSetChannel(
  authorId: string,
  guildId: string,
  clanName: string,
  channelId: string,
) {
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
      content:
        "You do not have permission to set clan channel. Please ask an administrator to do it for you.",
    };
  }

  const clan = await prisma.clan.findFirst({
    where: {
      name: clanName,
      discordGuildId: guildId,
    },
  });

  if (!clan) {
    return {
      ephemeral: true,
      content: "Clan not found.",
    };
  }

  const channel = await guild.channels.fetch(channelId).catch((e) => {
    console.error(`Failed to fetch channel ${channelId}`, e);
    return null;
  });

  if (!channel) {
    return {
      ephemeral: true,
      content: "Channel not found.",
    };
  }

  await prisma.clan.update({
    where: {
      id: clan.id,
    },
    data: {
      channelId,
    },
  });

  const upsertedChannel = await upsertClanChannel(clan.id);

  if (!upsertedChannel) {
    return {
      ephemeral: true,
      content: "Failed to upsert channel. Contact developers.",
    };
  }

  await updateClanChannel(clan.id, upsertedChannel);

  return {
    content: `Channel for ${clanName} has been set to <#${channelId}>.`,
    ephemeral: true,
  };
}
