import { client } from "!/bot/client";
import { ClanMemberRole, Colors } from "!/bot/types";
import { prisma } from "!/core/db/prisma";
import { type InteractionReplyOptions, PermissionFlagsBits } from "discord.js";
import { sprintf } from "sprintf-js";
import { updateClanChannel, upsertClanChannel } from "./clanChannel";
import { clanNotification } from "./clanNotification";
import { clanUpsertRole } from "./clanRole";

type Options = {
  authorId: string;
  guildId: string;
  clanName: string;
  newLeaderId: string;
};

export async function clanAdminChangeLeader({
  authorId,
  guildId,
  clanName,
  newLeaderId,
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

  const newClanLeader = await prisma.clanMember.findUnique({
    where: {
      clanId_discordUserId: {
        clanId: clan.id,
        discordUserId: newLeaderId,
      },
    },
    select: {
      id: true,
      role: true,
    },
  });

  if (!newClanLeader) {
    return {
      ephemeral: true,
      content: "User is not a member of the clan.",
    };
  }

  if (newClanLeader.role === ClanMemberRole.Leader) {
    return {
      ephemeral: true,
      content: "User is already the leader of the clan.",
    };
  }

  await prisma.$transaction([
    prisma.clanMember.updateMany({
      where: {
        clanId: clan.id,
        role: ClanMemberRole.Leader,
      },
      data: {
        role: ClanMemberRole.CoLeader,
      },
    }),
    prisma.clanMember.update({
      where: {
        id: newClanLeader.id,
      },
      data: {
        role: ClanMemberRole.Leader,
      },
    }),
  ]);

  const channel = await upsertClanChannel(clan.id);
  await clanUpsertRole(clan.id);
  if (channel) {
    await updateClanChannel(clan.id, channel);
  }

  await clanNotification(
    clan.id,
    sprintf(
      "The clan's leader has been changed to <@%s> by an administrator.",
      newLeaderId,
    ),
    Colors.Info,
  );

  return {
    ephemeral: true,
    content: "Leader changed.",
  };
}
