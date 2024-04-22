import { getName } from "!/common/logic/discordCache/store";
import { ClanMemberRole, Colors, InteractionType } from "!/common/types";
import { addCurrency } from "!/common/utils/addCurrency";
import { capitalize } from "!/common/utils/capitalize";
import { formatNumber } from "!/common/utils/formatNumber";
import { prisma } from "!/prisma";
import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
} from "discord.js";
import * as R from "remeda";
import { sprintf } from "sprintf-js";
import { z } from "zod";
import { clanRoles } from "./clanConfig";
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
      content: mentionedId
        ? "User is not in a clan."
        : "You are not in a clan. Use `/clan list` for a list of clans.",
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
            "- %s <t:%d:d> %s",
            getName({
              userId: member.discordUserId,
              guildId: clan.discordGuildId,
            }),
            member.joinedAt.getTime() / 1000,
            addCurrency()(formatNumber(member.contributed)),
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
