import { sprintf } from "sprintf-js";
import { ClanMemberRole } from "!/common/types";
import { prisma } from "!/prisma";
import { clanRoles } from "./clan";

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

  if (demotingMember.role !== ClanMemberRole.Leader) {
    return {
      content: "Only the clan leader can promote members.",
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

    return {
      content: sprintf(
        "<@%s> has been demoted to %s in **%s**.",
        mentionedId,
        clanRoles[ClanMemberRole.Member],
        clan.name,
      ),
    };
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

    return {
      content: sprintf(
        "<@%s> has been demoted to %s in **%s**.",
        mentionedId,
        clanRoles[ClanMemberRole.Senior],
        clan.name,
      ),
      ephemeral: true,
    };
  }

  return {
    content: "This member cannot be demoted.",
    ephemeral: true,
  };
}
