import { ClanMemberRole, Colors } from "!/bot/types";
import { prisma } from "!/core/db/prisma";
import type { InteractionReplyOptions } from "discord.js";
import { sprintf } from "sprintf-js";
import { updateClanChannel, upsertClanChannel } from "./clanChannel";
import { clanNotification } from "./clanNotification";
import { clanRoleUpdate, validateClanName } from "./clanRole";

type Options = {
  authorId: string;
  guildId: string;
  name: string;
};

export async function clanChangeName({
  authorId,
  guildId,
  name,
}: Options): Promise<InteractionReplyOptions> {
  const clan = await prisma.clan.findFirst({
    where: {
      members: {
        some: {
          discordUserId: authorId,
        },
      },
      discordGuildId: guildId,
    },
  });

  if (!clan) {
    return {
      ephemeral: true,
      content: "You don't have a clan.",
    };
  }

  const clanMember = await prisma.clanMember.findFirst({
    where: {
      clanId: clan.id,
      discordUserId: authorId,
    },
  });

  if (!clanMember) {
    return {
      ephemeral: true,
      content: "You are not in this clan.",
    };
  }

  if (clanMember.role !== ClanMemberRole.Leader) {
    return {
      ephemeral: true,
      content: "Only the clan leader can change the name.",
    };
  }

  const validName = await validateClanName(name, guildId);

  if ("error" in validName) {
    return {
      ephemeral: true,
      content: validName.error,
    };
  }

  if (clan.lastNameChange.getTime() > Date.now() - 1000 * 60 * 60 * 24 * 2) {
    return {
      ephemeral: true,
      content: "You can only change the clan name once every 48 hours.",
    };
  }

  await prisma.clan.update({
    where: {
      id: clan.id,
    },
    data: {
      name: validName.name,
      slug: validName.slug,
    },
  });

  const channel = await upsertClanChannel(clan.id);

  if (channel) {
    await updateClanChannel(clan.id, channel);
  }

  await clanRoleUpdate(clan.id);

  const message = sprintf(
    "<@%s> changed the clan name to **%s**!",
    authorId,
    validName.name,
  );

  if (channel) {
    await clanNotification(clan.id, message, Colors.Info);

    return {
      content: "Clan name changed.",
      ephemeral: true,
    };
  }

  return {
    content: message,
  };
}
