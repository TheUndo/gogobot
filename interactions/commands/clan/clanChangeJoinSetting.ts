import { notYourInteraction } from "!/common/logic/responses/notYourInteraction";
import { wrongGuildForInteraction } from "!/common/logic/responses/wrongGuildForInteraction";
import { wrongInteractionType } from "!/common/logic/responses/wrongInteractionType";
import {
  type AnyInteraction,
  ClanJoinSetting,
  ClanMemberRole,
  Colors,
  type InteractionContext,
} from "!/common/types";
import { prisma } from "!/prisma";
import { sprintf } from "sprintf-js";
import { z } from "zod";
import { joinSettings } from "./clanConfig";
import { clanInteractionContext, showClanInfo } from "./clanInfo";
import { clanNotification } from "./clanNotification";

export async function clanChangeJoinSetting(
  interactionContext: InteractionContext,
  interaction: AnyInteraction,
) {
  if (!interaction.isStringSelectMenu()) {
    return await interaction.reply(
      wrongInteractionType(interactionContext, interaction),
    );
  }

  const context = clanInteractionContext.safeParse(
    JSON.parse(interactionContext.payload ?? "{}"),
  );

  if (!context.success) {
    return await interaction.reply({
      content: "Invalid interaction context",
      ephemeral: true,
    });
  }

  if (interaction.user.id !== interactionContext.userDiscordId) {
    return await interaction.reply(
      notYourInteraction(interactionContext, interaction),
    );
  }

  const guildId = interactionContext.guildId;

  if (!guildId) {
    return await interaction.reply({
      content: "This command can only be used in a server.",
      ephemeral: true,
    });
  }

  if (guildId !== interactionContext.guildId) {
    return await interaction.reply(
      wrongGuildForInteraction(interactionContext, interaction),
    );
  }

  const clan = await prisma.clan.findUnique({
    where: {
      id: context.data.clanId,
    },
  });

  if (!clan) {
    return await interaction.reply({
      content: "Clan not found.",
      ephemeral: true,
    });
  }

  const userClanMember = await prisma.clanMember.findUnique({
    where: {
      clanId_discordUserId: {
        discordUserId: interaction.user.id,
        clanId: clan.id,
      },
    },
  });

  if (!userClanMember) {
    return await interaction.reply({
      content: "You are not in this clan.",
      ephemeral: true,
    });
  }

  if (
    ![ClanMemberRole.Leader, ClanMemberRole.CoLeader].includes(
      z.nativeEnum(ClanMemberRole).parse(userClanMember.role),
    )
  ) {
    return await interaction.reply({
      content:
        "Only the clan leader and co-leaders can change availability settings.",
      ephemeral: true,
    });
  }

  const value = z.nativeEnum(ClanJoinSetting).safeParse(interaction.values[0]);

  if (!value.success) {
    return await interaction.reply({
      content: "Invalid value",
      ephemeral: true,
    });
  }

  await prisma.clan.update({
    where: {
      id: clan.id,
    },
    data: {
      settingsJoin: value.data,
    },
  });

  await clanNotification(
    clan.id,
    sprintf(
      "<@%s> has changed the clan's join setting to **%s**",
      interaction.user.id,
      joinSettings[value.data],
    ),
    Colors.Info,
  );

  return await interaction.update(
    await showClanInfo({
      authorId: interaction.user.id,
      clanId: clan.id,
    }),
  );
}
