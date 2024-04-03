import { ActionRowBuilder, ButtonBuilder, ButtonStyle } from "discord.js";
import { sprintf } from "sprintf-js";
import { z } from "zod";
import {
  type AnyInteraction,
  ClanMemberRole,
  type InteractionContext,
  InteractionType,
} from "~/common/types";
import { prisma } from "~/prisma";

const clanInvitationContext = z.object({
  clanId: z.string(),
  inviteeId: z.string(),
  inviterId: z.string(),
});

export async function clanInvite({
  userId,
  inviteeId,
  guildId,
}: {
  userId: string;
  inviteeId: string;
  guildId: string;
}) {
  const clan = await prisma.clan.findFirst({
    where: {
      members: {
        some: {
          role: {
            in: [ClanMemberRole.Leader, ClanMemberRole.Officer],
          },
          discordUserId: userId,
        },
      },
      discordGuildId: guildId,
    },
  });

  if (!clan) {
    return {
      ephemeral: true,
      content: "You are not a leader or officer of a clan.",
    };
  }

  const existingInvitation = await prisma.clanInvitation.findFirst({
    where: {
      clanId: clan.id,
      userDiscordId: inviteeId,
    },
  });

  if (
    existingInvitation &&
    existingInvitation.createdAt.getTime() > Date.now() - 1000 * 60 * 60 * 48
  ) {
    return {
      ephemeral: true,
      content: sprintf(
        "User has already been invited in the last 48 hours. You can invite again <t:%s:R>",
        existingInvitation.createdAt.getTime() / 1000,
      ),
    };
  }

  const invitationContext: z.infer<typeof clanInvitationContext> = {
    clanId: clan.id,
    inviteeId,
    inviterId: userId,
  };

  const [interactionJoin, interactionRejectInvitation] =
    await prisma.$transaction([
      prisma.interaction.create({
        data: {
          type: InteractionType.ClanJoin,
          guildId,
          userDiscordId: userId,
          payload: JSON.stringify(invitationContext),
        },
      }),
      prisma.interaction.create({
        data: {
          type: InteractionType.ClanRejectInvitation,
          guildId,
          userDiscordId: userId,
          payload: JSON.stringify(invitationContext),
        },
      }),
      prisma.clanInvitation.create({
        data: {
          clanId: clan.id,
          userDiscordId: inviteeId,
          invitedByDiscordId: userId,
        },
      }),
      prisma.clanBanishment.deleteMany({
        where: {
          clanId: clan.id,
          userDiscordId: inviteeId,
        },
      }),
    ]);

  return {
    content: sprintf(
      "<@%s> you have been invited to join **%s**.",
      inviteeId,
      clan.name,
    ),
    components: [
      new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
          .setLabel("Accept")
          .setStyle(ButtonStyle.Success)
          .setCustomId(interactionJoin.id),
        new ButtonBuilder()
          .setLabel("Reject")
          .setStyle(ButtonStyle.Danger)
          .setCustomId(interactionRejectInvitation.id),
      ),
    ],
  };
}

export async function clanInviteReject(
  interactionContext: InteractionContext,
  interaction: AnyInteraction,
) {
  const context = clanInvitationContext.safeParse(
    JSON.parse(interactionContext.payload ?? "{}"),
  );

  if (!context.success) {
    return await interaction.reply({
      content: "Invalid interaction context",
      ephemeral: true,
    });
  }

  if (context.data.inviterId === interaction.user.id) {
    return await interaction.reply({
      content: "You can't reject your own invitation",
      ephemeral: true,
    });
  }

  if (interaction.user.id !== context.data.inviteeId) {
    return await interaction.reply({
      content: "You are not the invitee",
      ephemeral: true,
    });
  }

  await prisma.clanInvitation.deleteMany({
    where: {
      userDiscordId: context.data.inviteeId,
      clanId: context.data.clanId,
    },
  });

  if (interaction.isButton()) {
    return await interaction.update({
      content: "Invitation rejected",
      components: [],
      embeds: [],
    });
  }

  return await interaction.reply({
    content: "Invitation rejected",
    ephemeral: true,
  });
}
