import { sprintf } from "sprintf-js";
import { z } from "zod";
import { ClanMemberRole } from "~/common/types";
import { prisma } from "~/prisma";
import { removeClanRole } from "./clanUtils";

type Options = {
  authorId: string;
  mentionedId: string;
  guildId: string;
};

export async function clanKick({ authorId, mentionedId, guildId }: Options) {
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
      members: {
        where: {
          discordUserId: {
            in: [authorId, mentionedId],
          },
        },
        select: {
          role: true,
          discordUserId: true,
        },
      },
    },
  });

  if (!clan) {
    return {
      content: "You are not in a clan",
      ephemeral: true,
    };
  }

  const kickingMember = clan.members.find((v) => v.discordUserId === authorId);

  if (!kickingMember) {
    return {
      content: "You are not in the clan",
      ephemeral: true,
    };
  }

  const memberToKick = clan.members.find(
    (v) => v.discordUserId === mentionedId,
  );

  if (!memberToKick) {
    return {
      content: sprintf("User <@%s> is not in the clan", mentionedId),
      ephemeral: true,
    };
  }

  if (
    ![ClanMemberRole.Leader, ClanMemberRole.Officer].includes(
      z.nativeEnum(ClanMemberRole).parse(kickingMember.role),
    )
  ) {
    return {
      content: "You are not a leader or officer of the clan",
      ephemeral: true,
    };
  }

  if (memberToKick.role === ClanMemberRole.Leader) {
    return {
      content: "You cannot kick the leader",
      ephemeral: true,
    };
  }

  if (
    memberToKick.role === ClanMemberRole.Officer &&
    kickingMember.role === ClanMemberRole.Officer
  ) {
    if (kickingMember.role === ClanMemberRole.Officer) {
      return {
        content: "Officers cannot kick other officers",
        ephemeral: true,
      };
    }
  }

  await prisma.$transaction([
    prisma.clanMember.delete({
      where: {
        clanId_discordUserId: {
          clanId: clan.id,
          discordUserId: mentionedId,
        },
      },
    }),
    prisma.clanInvitation.deleteMany({
      where: {
        userDiscordId: mentionedId,
        clanId: clan.id,
      },
    }),
    prisma.clanBanishment.create({
      data: {
        clanId: clan.id,
        userDiscordId: mentionedId,
        banishedByDiscordId: authorId,
      },
    }),
  ]);

  await prisma.clanlessUser
    .create({
      data: {
        guildId,
        userDiscordId: mentionedId,
      },
    })
    .catch(() => {});

  await removeClanRole(clan.id, mentionedId);

  return {
    content: sprintf(
      "<@%s> has been kicked out of **%s** by <@%s>",
      mentionedId,
      clan.name,
      kickingMember.discordUserId,
    ),
  };
}
