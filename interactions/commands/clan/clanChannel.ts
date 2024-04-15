import {
  ChannelType,
  PermissionFlagsBits,
  type CategoryChannel,
  type TextChannel,
} from "discord.js";
import { client } from "~/common/client";
import { prisma } from "~/prisma";
import { clanUpsertRole } from "./clanRole";

export async function upsertClanChannel(
  clanId: string,
): Promise<null | TextChannel> {
  const clan = await prisma.clan.findUnique({
    where: {
      id: clanId,
    },
    select: {
      name: true,
      discordGuildId: true,
      channelId: true,
    },
  });

  if (!clan) {
    return null;
  }

  const channelId = clan.channelId;

  const guild = await client.guilds.fetch(clan?.discordGuildId);

  if (channelId) {
    const channel = await guild.channels.fetch(channelId).catch((e) => {
      console.error(`Failed to fetch channel ${channelId}`, e);
      return null;
    });

    if (channel && channel.type === ChannelType.GuildText) {
      return channel;
    }
  }

  const parentChannel: CategoryChannel | null = await (async () => {
    const otherClan = await prisma.clan.findFirst({
      where: {
        id: {
          not: clanId,
        },
        channelId: {
          not: null,
        },
      },
    });

    if (!otherClan) {
      return null;
    }

    const channelId = otherClan.channelId;

    if (!channelId) {
      return null;
    }

    const parentChannel = await guild.channels
      .fetch(channelId)
      .catch((e) => {
        console.error(`Failed to fetch channel ${otherClan.channelId}`, e);
        return null;
      })
      .then((channel) => {
        return channel?.parent;
      });

    if (!parentChannel) {
      return null;
    }

    if (parentChannel.type !== ChannelType.GuildCategory) {
      return null;
    }

    return parentChannel;
  })();

  const result = await clanUpsertRole(clanId);

  if (!result) {
    return null;
  }

  const { role } = result;

  if (!role) {
    return null;
  }

  const createdChannel = await guild.channels
    .create({
      name: clan.name,
      type: ChannelType.GuildText,
      parent: parentChannel,
      permissionOverwrites: [
        {
          allow: [
            PermissionFlagsBits.SendMessages,
            PermissionFlagsBits.ReadMessageHistory,
            PermissionFlagsBits.ViewChannel,
          ],
          id: role.id,
        },
        {
          deny: [PermissionFlagsBits.ViewChannel],
          id: guild.roles.everyone.id,
        },
      ],
      reason: `Automatic clan creation. For clan "${clan.name}"`,
    })
    .catch((e) => {
      console.error(`Failed to create channel for clan ${clanId}`, e);
      return null;
    });

  if (!createdChannel) {
    return null;
  }

  await prisma.clan.update({
    where: {
      id: clanId,
    },
    data: {
      channelId: createdChannel.id,
    },
  });

  return createdChannel;
}

export async function clanDeleteChannel(clanId: string): Promise<void> {
  const channel = await upsertClanChannel(clanId);

  if (!channel) {
    return;
  }

  await channel.delete().catch((e) => {
    console.error(`Failed to delete channel ${channel.id}`, e);
  });
}

export async function updateClanChannel(clanId: string, channel: TextChannel) {
  const clan = await prisma.clan.findUnique({
    where: {
      id: clanId,
    },
  });

  if (!clan) {
    return;
  }

  const result = await clanUpsertRole(clanId);

  if (!result) {
    return null;
  }

  const { role, guild } = result;

  if (!role || !guild) {
    return null;
  }

  await channel
    .edit({
      name: clan.name,
      permissionOverwrites: [
        {
          allow: [
            PermissionFlagsBits.SendMessages,
            PermissionFlagsBits.ReadMessageHistory,
            PermissionFlagsBits.ViewChannel,
          ],
          id: role.id,
        },
        {
          deny: [PermissionFlagsBits.ViewChannel],
          id: guild.roles.everyone.id,
        },
      ],
    })
    .catch((e) => {
      console.error(`Failed to update channel ${channel.id}`, e);
    });
}
