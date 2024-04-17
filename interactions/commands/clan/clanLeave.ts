import { client } from "!/common/client";
import { ClanMemberRole, Colors } from "!/common/types";
import { prisma } from "!/prisma";
import { sprintf } from "sprintf-js";
import { clanDeleteChannel } from "./clanChannel";
import { clanNotification } from "./clanNotification";
import { removeClanRole } from "./clanRole";

export async function clanLeaveCommand({
  userId,
  guildId,
}: {
  userId: string;
  guildId: string;
}) {
  const userClanMember = await prisma.clanMember.findFirst({
    where: {
      discordUserId: userId,
      clan: {
        discordGuildId: guildId,
      },
    },
  });

  if (!userClanMember) {
    return {
      content: "You are not in a clan.",
      ephemeral: true,
    };
  }

  const clan = await prisma.clan.findUnique({
    where: {
      id: userClanMember.clanId,
    },
    select: {
      name: true,
      id: true,
      roleId: true,
      _count: {
        select: {
          members: true,
        },
      },
    },
  });

  if (!clan) {
    return {
      content: "Clan not found.",
      ephemeral: true,
    };
  }

  if (
    userClanMember.role === ClanMemberRole.Leader &&
    clan._count.members > 1
  ) {
    return {
      content:
        "You cannot leave the clan as the leader with other members in the clan. If you want to leave the clan, you must first transfer leadership to another member or kick everyone in the clan.",
      ephemeral: true,
    };
  }

  try {
    if (clan._count.members === 1) {
      await clanDeleteChannel(clan.id);
      await prisma.$transaction([
        prisma.clanInvitation.deleteMany({
          where: {
            clanId: clan.id,
          },
        }),
        prisma.clanBanishment.deleteMany({
          where: {
            clanId: clan.id,
          },
        }),
        prisma.clanMember.deleteMany({
          where: {
            clanId: clan.id,
          },
        }),
        prisma.clanStatistics.deleteMany({
          where: {
            clanId: clan.id,
          },
        }),
        prisma.clanAnnouncement.deleteMany({
          where: {
            clanId: clan.id,
          },
        }),
        prisma.clan.delete({
          where: {
            id: userClanMember.clanId,
          },
        }),
      ]);

      const roleId = clan.roleId;
      if (roleId) {
        await client.guilds
          .fetch(guildId)
          .then(async (guild) => guild.roles.delete(roleId))
          .catch(() => {
            console.error(`Failed to delete role ${roleId}`);
          });
      }

      return {
        content: sprintf(
          "<@%s> has __disbanded__ **%s**. <@%s> joined <t:%d:R>",
          userId,
          clan.name,
          userId,
          userClanMember.joinedAt.getTime() / 1000,
        ),
      };
    }

    await prisma.$transaction([
      prisma.clanInvitation.deleteMany({
        where: {
          userDiscordId: userId,
          clanId: userClanMember.clanId,
        },
      }),
      prisma.clanMember.delete({
        where: {
          clanId_discordUserId: {
            clanId: userClanMember.clanId,
            discordUserId: userId,
          },
        },
      }),
    ]);

    await Promise.all([
      prisma.clanlessUser
        .create({
          data: {
            guildId,
            userDiscordId: userId,
          },
        })
        .catch(() => {}),
      removeClanRole(clan.id, userId),
      clanNotification(
        clan.id,
        sprintf("<@%s> has left the clan.", userId),
        Colors.Error,
      ),
    ]);

    return {
      content: sprintf(
        "<@%s> has left **%s**. They joined <t:%d:R>",
        userId,
        clan.name,
        userClanMember.joinedAt.getTime() / 1000,
      ),
    };
  } catch (e) {
    console.error(e);
    return {
      content: "An error occurred while leaving the clan. Contact support.",
      ephemeral: true,
    };
  }
}
