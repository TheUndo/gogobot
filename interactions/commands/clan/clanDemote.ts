import { ClanMemberRole } from "!/common/types";
import { prisma } from "!/prisma";
import { sprintf } from "sprintf-js";
import { clanRoles } from "./clanConfig";
import { z } from "zod";
import { clanSendNotificationOrMessage } from "./clanSendNotificationOrMessage";

type Options = {
  authorId: string;
  mentionedId: string;
  guildId: string;
};

export async function clanDemote({ authorId, mentionedId, guildId }: Options) {
  const clan = await prisma.clan.findFirst({
    where: {
      discordGuildId: guildId,
      members: {
        some: {
          discordUserId: authorId,
        },
      },
    },
    select: {
      name: true,
      id: true,
    },
  });

  if (!clan) {
    return {
      content: "You are not in a clan.",
      ephemeral: true,
    };
  }

  const demotingMember = await prisma.clanMember.findUnique({
    where: {
      clanId_discordUserId: {
        clanId: clan.id,
        discordUserId: authorId,
      },
    },
    select: {
      discordUserId: true,
      role: true,
    },
  });

  if (!demotingMember) {
    return {
      content: "You are not in the clan.",
      ephemeral: true,
    };
  }

  if (
    ![ClanMemberRole.Leader, ClanMemberRole.CoLeader].includes(
      z.nativeEnum(ClanMemberRole).parse(demotingMember.role),
    )
  ) {
    return {
      content: "Only the clan leader and co-leaders can demote members.",
      ephemeral: true,
    };
  }

  const memberToDemote = await prisma.clanMember.findUnique({
    where: {
      clanId_discordUserId: {
        clanId: clan.id,
        discordUserId: mentionedId,
      },
    },
    select: {
      role: true,
      discordUserId: true,
    },
  });

  if (!memberToDemote) {
    return {
      content: `<@${mentionedId}> is not in the clan.`,
      ephemeral: true,
    };
  }

  if (memberToDemote.discordUserId === demotingMember.discordUserId) {
    return {
      content: "You cannot demote yourself.",
      ephemeral: true,
    };
  }

  if (memberToDemote.role === ClanMemberRole.Member) {
    return {
      content: "This member is already a member.",
      ephemeral: true,
    };
  }

  if (memberToDemote.role === ClanMemberRole.Leader) {
    return {
      content: "You cannot demote the clan leader.",
      ephemeral: true,
    };
  }

  if (memberToDemote.role === ClanMemberRole.Senior) {
    await prisma.clanMember.update({
      where: {
        clanId_discordUserId: {
          clanId: clan.id,
          discordUserId: memberToDemote.discordUserId,
        },
      },
      data: {
        role: ClanMemberRole.Member,
      },
    });

    return await clanSendNotificationOrMessage(
      clan.id,
      sprintf(
        "<@%s> has been demoted to %s in **%s**.",
        mentionedId,
        clanRoles[ClanMemberRole.Member],
        clan.name,
      ),
    );
  }

  if (memberToDemote.role === ClanMemberRole.Officer) {
    await prisma.clanMember.update({
      where: {
        clanId_discordUserId: {
          clanId: clan.id,
          discordUserId: memberToDemote.discordUserId,
        },
      },
      data: {
        role: ClanMemberRole.Senior,
      },
    });

    return await clanSendNotificationOrMessage(
      clan.id,
      sprintf(
        "<@%s> has been demoted to %s in **%s**.",
        mentionedId,
        clanRoles[ClanMemberRole.Senior],
        clan.name,
      ),
    );
  }

  if (memberToDemote.role === ClanMemberRole.CoLeader) {
    if (demotingMember.role !== ClanMemberRole.Leader) {
      return {
        content: "Only the clan leader can demote co-leaders.",
        ephemeral: true,
      };
    }

    await prisma.clanMember.update({
      where: {
        clanId_discordUserId: {
          clanId: clan.id,
          discordUserId: memberToDemote.discordUserId,
        },
      },
      data: {
        role: ClanMemberRole.Officer,
      },
    });

    return await clanSendNotificationOrMessage(
      clan.id,
      sprintf(
        "<@%s> has been demoted to %s in **%s**.",
        mentionedId,
        clanRoles[ClanMemberRole.Officer],
        clan.name,
      ),
    );
  }

  return {
    content: "This member cannot be demoted.",
    ephemeral: true,
  };
}
