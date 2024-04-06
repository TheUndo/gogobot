import { z } from "zod";

import { ActionRowBuilder, ButtonBuilder, ButtonStyle } from "discord.js";
import { sprintf } from "sprintf-js";
import { getUserClan } from "~/common/logic/economy/getUserClan";
import { wrongGuildForInteraction } from "~/common/logic/responses/wrongGuildForInteraction";
import { wrongInteractionType } from "~/common/logic/responses/wrongInteractionType";
import {
  type AnyInteraction,
  ClanJoinSetting,
  ClanMemberRole,
  type InteractionContext,
  InteractionType,
} from "~/common/types";
import { prisma } from "~/prisma";
import { debugPrint } from "~/scraper/logger";
import { clanInteractionContext } from "./clanInfo";
import { ensureClanRole } from "./clanUtils";

export async function clanJoin(
  interactionContext: InteractionContext,
  interaction: AnyInteraction,
) {
  if (!interaction.isButton() && !interaction.isStringSelectMenu()) {
    return await interaction.reply(
      wrongInteractionType(interactionContext, interaction),
    );
  }

  if (!("guildId" in interaction)) {
    debugPrint("No guildId in interaction");
    return;
  }

  if (interaction.guildId !== interactionContext.guildId) {
    return await interaction.reply(
      wrongGuildForInteraction(interactionContext, interaction),
    );
  }

  const guildId = z.string().parse(interaction.guildId);
  const clanContext = clanInteractionContext.safeParse(
    JSON.parse(interactionContext.payload ?? "{}"),
  );

  const selectedClanId = interaction.isStringSelectMenu()
    ? interaction.values[0] ?? null
    : null;

  const clanId =
    selectedClanId ?? (clanContext.success ? clanContext.data.clanId : null);

  if (!clanId) {
    return await interaction.reply({
      content: "Invalid interaction context",
      ephemeral: true,
    });
  }

  const userClan = await getUserClan(interaction.user.id, guildId);

  const clanToJoin = await prisma.clan.findUnique({
    where: {
      id: clanId,
    },
    select: {
      id: true,
      name: true,
      settingsJoin: true,
      members: {
        select: {
          role: true,
          id: true,
          discordUserId: true,
        },
      },
      _count: {
        select: {
          members: true,
        },
      },
    },
  });

  if (!clanToJoin) {
    return await interaction.reply({
      content: `Clan not found: ${clanId}`,
      ephemeral: true,
    });
  }

  if (userClan?.id === clanToJoin.id) {
    return await interaction.reply({
      content: "You are already in this clan",
      ephemeral: true,
    });
  }

  if (userClan) {
    return await interaction.reply({
      content: "You are already in a different clan.",
      ephemeral: true,
    });
  }

  if (clanToJoin._count.members >= 50) {
    return await interaction.reply({
      content: "This clan is full. Try again later.",
      ephemeral: true,
    });
  }

  const banned = await prisma.clanBanishment.findFirst({
    where: {
      clanId: clanToJoin.id,
      userDiscordId: interaction.user.id,
    },
    select: {
      id: true,
    },
  });

  if (banned) {
    return await interaction.reply({
      content: "You are banned from this clan. You can only join if invited.",
      ephemeral: true,
    });
  }

  if (clanToJoin.settingsJoin === ClanJoinSetting.Closed) {
    return await interaction.reply({
      content: "This clan is closed for new members",
      ephemeral: true,
    });
  }

  if (clanToJoin.settingsJoin === ClanJoinSetting.Approval) {
    const invitation = await prisma.clanInvitation.findFirst({
      where: {
        userDiscordId: interaction.user.id,
        clanId: clanToJoin.id,
        invitedByDiscordId: {
          in: clanToJoin.members
            .filter((m) =>
              [
                ClanMemberRole.Leader,
                ClanMemberRole.Officer,
                ClanMemberRole.Senior,
              ].includes(z.nativeEnum(ClanMemberRole).parse(m.role)),
            )
            .map((m) => m.discordUserId),
        },
      },
    });

    if (!invitation) {
      const context: z.infer<typeof clanInteractionContext> = {
        clanId: clanToJoin.id,
      };

      const [requestJoinInteraction, rejectJoinInteraction, clanLeader] =
        await prisma.$transaction([
          prisma.interaction.create({
            data: {
              type: InteractionType.ClanRequestJoinApprove,
              userDiscordId: interaction.user.id,
              guildId,
              payload: JSON.stringify(context),
            },
          }),
          prisma.interaction.create({
            data: {
              type: InteractionType.ClanRequestJoinReject,
              userDiscordId: interaction.user.id,
              guildId,
              payload: JSON.stringify(context),
            },
          }),
          prisma.clanMember.findFirst({
            where: {
              clanId: clanToJoin.id,
              role: ClanMemberRole.Leader,
            },
          }),
        ]);

      if (!clanLeader) {
        return await interaction.reply({
          content: "Clan leader not found",
          ephemeral: true,
        });
      }

      return await interaction.reply({
        content: sprintf(
          "Hi <@%s>, the user <@%s> wants to join your clan. Do you approve?",
          clanLeader.discordUserId,
          interaction.user.id,
        ),
        components: [
          new ActionRowBuilder<ButtonBuilder>().addComponents([
            new ButtonBuilder()
              .setCustomId(requestJoinInteraction.id)
              .setLabel("Approve")
              .setStyle(ButtonStyle.Success),
            new ButtonBuilder()
              .setCustomId(rejectJoinInteraction.id)
              .setLabel("Reject")
              .setStyle(ButtonStyle.Danger),
          ]),
        ],
      });
    }
  }

  await prisma.$transaction([
    prisma.clanMember.create({
      data: {
        guildId,
        discordUserId: interaction.user.id,
        clanId: clanToJoin.id,
        role: ClanMemberRole.Member,
      },
    }),
    prisma.clanInvitation.deleteMany({
      where: {
        userDiscordId: interaction.user.id,
        clanId: clanToJoin.id,
      },
    }),
  ]);

  void ensureClanRole(clanToJoin.id);

  return await interaction.reply({
    content: sprintf("You have joined **%s**. Welcome!", clanToJoin.name),
  });
}

export async function clanRequestJoinApprove(
  interactionContext: InteractionContext,
  interaction: AnyInteraction,
) {
  if (!interaction.isButton()) {
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

  if (interactionContext.consumedAt) {
    return await interaction.reply({
      content: "This interaction has already been consumed",
      ephemeral: true,
    });
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
      content: "Clan not found",
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
      content: "You are not in this clan",
      ephemeral: true,
    });
  }

  if (
    ![ClanMemberRole.Leader, ClanMemberRole.Officer].includes(
      z.nativeEnum(ClanMemberRole).parse(userClanMember.role),
    )
  ) {
    return await interaction.reply({
      content: "Only officers and leaders can approve join requests",
      ephemeral: true,
    });
  }

  const memberToJoin = await prisma.clanMember.findUnique({
    where: {
      clanId_discordUserId: {
        clanId: context.data.clanId,
        discordUserId: interactionContext.userDiscordId,
      },
    },
  });

  if (memberToJoin) {
    if (memberToJoin.clanId === clan.id) {
      return await interaction.reply({
        content: "User is already in the clan",
        ephemeral: true,
      });
    }
    return await interaction.reply({
      content: "User is already in a different clan",
      ephemeral: true,
    });
  }

  await prisma.$transaction([
    prisma.clanMember.create({
      data: {
        guildId,
        discordUserId: interactionContext.userDiscordId,
        clanId: clan.id,
        role: ClanMemberRole.Member,
      },
    }),
    prisma.clanInvitation.deleteMany({
      where: {
        userDiscordId: interactionContext.userDiscordId,
        clanId: clan.id,
      },
    }),
    prisma.clanBanishment.deleteMany({
      where: {
        userDiscordId: interactionContext.userDiscordId,
        clanId: clan.id,
      },
    }),
    prisma.interaction.update({
      where: {
        id: interactionContext.id,
      },
      data: {
        consumedAt: new Date(),
      },
    }),
  ]);

  return await interaction.update({
    content: sprintf(
      "Join request approved by <@%s>. <@%s> has joined **%s**",
      interaction.user.id,
      interactionContext.userDiscordId,
      clan.name,
    ),
    components: [],
    embeds: [],
  });
}

export async function clanRequestJoinReject(
  interactionContext: InteractionContext,
  interaction: AnyInteraction,
) {
  if (!interaction.isButton()) {
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

  if (interactionContext.consumedAt) {
    return await interaction.reply({
      content: "This interaction has already been consumed",
      ephemeral: true,
    });
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
      content: "Clan not found",
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
      content: "You are not in this clan",
      ephemeral: true,
    });
  }

  if (
    ![ClanMemberRole.Leader, ClanMemberRole.Officer].includes(
      z.nativeEnum(ClanMemberRole).parse(userClanMember.role),
    )
  ) {
    return await interaction.reply({
      content: "Only officers and leaders can reject join requests",
      ephemeral: true,
    });
  }

  await prisma.$transaction([
    prisma.clanInvitation.deleteMany({
      where: {
        userDiscordId: interactionContext.userDiscordId,
        clanId: clan.id,
      },
    }),
    prisma.clanBanishment.create({
      data: {
        banishedByDiscordId: interaction.user.id,
        userDiscordId: interactionContext.userDiscordId,
        clanId: clan.id,
      },
    }),
    prisma.interaction.update({
      where: {
        id: interactionContext.id,
      },
      data: {
        consumedAt: new Date(),
      },
    }),
  ]);

  return await interaction.update({
    content: sprintf(
      "<@%s> request to join **%s** was rejected by <@%s>",
      interactionContext.userDiscordId,
      clan.name,
      interaction.user.id,
    ),
    components: [],
    embeds: [],
  });
}
