import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
} from "discord.js";
import * as R from "remeda";
import { sprintf } from "sprintf-js";
import { z } from "zod";
import { ClanMemberRole, Colors, InteractionType } from "../../../common/types";
import { capitalize } from "../../../common/utils/capitalize";
import { prisma } from "../../../prisma";
import { clanRoles } from "./clan";
import type { clanInteractionContext } from "./clanInfo";

type Options = {
  authorId: string;
  mentionedId?: string;
  guildId: string;
};

export async function clanMembersCommand({
  authorId,
  mentionedId,
  guildId,
}: Options) {
  const userId = mentionedId ?? authorId;

  const clan = await prisma.clan.findFirst({
    where: {
      discordGuildId: guildId,
      members: {
        some: {
          discordUserId: userId,
        },
      },
    },
    select: {
      id: true,
    },
  });

  if (!clan) {
    return {
      content: "User is not in a clan",
      ephemeral: true,
    };
  }

  return await showClanMembers({
    authorId,
    clanId: clan.id,
  });
}

export async function showClanMembers({
  authorId,
  clanId,
}: {
  authorId: string;
  clanId: string;
}) {
  const clan = await prisma.clan.findUnique({
    where: {
      id: clanId,
    },
    include: {
      members: true,
    },
  });

  if (!clan) {
    return {
      content: "Clan not found",
      embeds: [],
    };
  }

  const embed = new EmbedBuilder().setTitle(
    sprintf("Members of %s", clan.name),
  );

  if (clan.members.length === 0) {
    embed.setDescription("This clan has no members");
  }

  const grouped = R.pipe(
    clan.members,
    R.groupBy((v) => v.role),
    R.toPairs,
    R.map(([role, members]) => {
      return {
        order: Object.keys(clanRoles).indexOf(role),
        role,
        members,
      };
    }),
    R.sortBy((v) => v.order),
    R.map(({ members, role }) => {
      const list = members
        .sort((a, b) => a.joinedAt.getTime() - b.joinedAt.getTime())
        .map((member) => {
          return sprintf(
            "- <@%s> <t:%d:d>",
            member.discordUserId,
            member.joinedAt.getTime() / 1000,
          );
        });

      if (list.length === 0) {
        return "";
      }

      return sprintf(
        "**%s%s**%s\n%s",
        capitalize(clanRoles[z.nativeEnum(ClanMemberRole).parse(role)]),
        list.length > 1 ? "s" : "",
        list.length > 1 ? ` (${list.length})` : "",
        list.join("\n"),
      );
    }),
    R.join("\n\n"),
  );

  embed.setDescription(grouped);
  embed.setColor(clan.settingsColor ?? Colors.Info);

  const context: z.infer<typeof clanInteractionContext> = {
    clanId,
  };

  const infoInteraction = await prisma.interaction.create({
    data: {
      type: InteractionType.ClanShowInfo,
      guildId: clan.discordGuildId,
      userDiscordId: authorId,
      payload: JSON.stringify(context),
    },
  });

  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setEmoji("⬅️")
      .setStyle(ButtonStyle.Secondary)
      .setCustomId(infoInteraction.id)
      .setLabel("Clan info"),
  );

  return {
    content: "",
    embeds: [embed],
    components: [row],
  };
}
