import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
} from "discord.js";
import { sprintf } from "sprintf-js";
import { z } from "zod";
import { notYourInteraction } from "../../../common/logic/responses/notYourInteraction";
import { wrongInteractionType } from "../../../common/logic/responses/wrongInteractionType";
import {
  type AnyInteraction,
  ClanMemberRole,
  Colors,
  type InteractionContext,
  InteractionType,
} from "../../../common/types";
import { prisma } from "../../../prisma";
import { clanRoles } from "./clan";

type Options = {
  authorId: string;
  mentionedId: string;
  guildId: string;
};

const clanLeadershipTransferContext = z.object({
  clanId: z.string(),
  oldLeaderUserId: z.string(),
  newLeaderUserId: z.string(),
});

export async function clanPromote({ authorId, mentionedId, guildId }: Options) {
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
      content: "You are not in a clan",
      ephemeral: true,
    };
  }

  const promotingMember = await prisma.clanMember.findUnique({
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

  if (!promotingMember) {
    return {
      content: "You are not in the clan.",
      ephemeral: true,
    };
  }

  if (promotingMember.role !== ClanMemberRole.Leader) {
    return {
      content: "Only the clan leader can promote members.",
      ephemeral: true,
    };
  }

  const memberToPromote = await prisma.clanMember.findUnique({
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

  if (!memberToPromote) {
    return {
      content: `<@${mentionedId}> is not in the clan.`,
      ephemeral: true,
    };
  }

  if (memberToPromote.discordUserId === promotingMember.discordUserId) {
    return {
      content: "You cannot promote yourself.",
      ephemeral: true,
    };
  }

  if (memberToPromote.role === ClanMemberRole.Member) {
    await prisma.clanMember.update({
      where: {
        clanId_discordUserId: {
          clanId: clan.id,
          discordUserId: memberToPromote.discordUserId,
        },
      },
      data: {
        role: ClanMemberRole.Senior,
      },
    });

    return {
      content: sprintf(
        "<@%s> has been promoted to %s in **%s**!",
        mentionedId,
        clanRoles[ClanMemberRole.Senior],
        clan.name,
      ),
    };
  }

  if (memberToPromote.role === ClanMemberRole.Senior) {
    await prisma.clanMember.update({
      where: {
        clanId_discordUserId: {
          clanId: clan.id,
          discordUserId: memberToPromote.discordUserId,
        },
      },
      data: {
        role: ClanMemberRole.Officer,
      },
    });

    return {
      content: sprintf(
        "<@%s> has been promoted to %s in **%s**. Officers can kick and invite members.",
        mentionedId,
        clanRoles[ClanMemberRole.Officer],
        clan.name,
      ),
      ephemeral: false,
    };
  }

  const context: z.infer<typeof clanLeadershipTransferContext> = {
    clanId: clan.id,
    oldLeaderUserId: authorId,
    newLeaderUserId: mentionedId,
  };

  const [transferLeadershipInteraction, cancelLeadershipTransferInteraction] =
    await prisma.$transaction([
      prisma.interaction.create({
        data: {
          type: InteractionType.ClanTransferLeadership,
          guildId,
          userDiscordId: authorId,
          payload: JSON.stringify(context),
        },
      }),
      prisma.interaction.create({
        data: {
          type: InteractionType.ClanCancelLeadershipTransfer,
          guildId,
          userDiscordId: authorId,
          payload: JSON.stringify(context),
        },
      }),
    ]);

  return {
    embeds: [
      new EmbedBuilder()
        .setTitle("Warning")
        .setColor(Colors.Warning)
        .setDescription(
          sprintf(
            "You are about to transfer leadership of **%s** to <@%s>. Are you sure you want to do this? This action cannot be undone.",
            clan.name,
            memberToPromote.discordUserId,
          ),
        ),
    ],
    components: [
      new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
          .setCustomId(transferLeadershipInteraction.id)
          .setLabel("Confirm")
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId(cancelLeadershipTransferInteraction.id)
          .setLabel("Cancel")
          .setStyle(ButtonStyle.Danger),
      ),
    ],
  };
}

export async function clanTransferLeadershipConfirm(
  interactionContext: InteractionContext,
  interaction: AnyInteraction,
) {
  if (!interaction.isButton()) {
    return await interaction.reply(
      wrongInteractionType(interactionContext, interaction),
    );
  }

  if (interaction.user.id !== interactionContext.userDiscordId) {
    return await interaction.reply(
      notYourInteraction(interactionContext, interaction),
    );
  }

  const context = clanLeadershipTransferContext.safeParse(
    JSON.parse(interactionContext.payload ?? "{}"),
  );

  if (!context.success) {
    return await interaction.reply({
      content: "Invalid interaction context.",
      ephemeral: true,
    });
  }

  if (interactionContext.consumedAt) {
    return await interaction.reply({
      content:
        "This interaction has already been consumed. Use the command again.",
      ephemeral: true,
    });
  }

  const clan = await prisma.clan.findUnique({
    where: {
      id: context.data.clanId,
    },
    select: {
      name: true,
    },
  });

  if (!clan) {
    return await interaction.reply({
      content: "Clan not found",
      ephemeral: true,
    });
  }

  const userClanMember = await prisma.clanMember.findFirst({
    where: {
      discordUserId: interaction.user.id,
      clan: {
        id: context.data.clanId,
      },
    },
  });

  if (!userClanMember) {
    return await interaction.reply({
      content: "You are not in this clan.",
      ephemeral: true,
    });
  }

  if (userClanMember.role !== ClanMemberRole.Leader) {
    return await interaction.reply({
      content: "Only the clan leader can transfer leadership.",
      ephemeral: true,
    });
  }

  const memberToPromote = await prisma.clanMember.findUnique({
    where: {
      clanId_discordUserId: {
        clanId: context.data.clanId,
        discordUserId: context.data.newLeaderUserId,
      },
    },
    select: {
      role: true,
    },
  });

  if (!memberToPromote) {
    return await interaction.reply({
      content: "Member not found",
      ephemeral: true,
    });
  }

  if (memberToPromote.role !== ClanMemberRole.Officer) {
    return await interaction.reply({
      content: "Only an officer can be promoted to leader.",
      ephemeral: true,
    });
  }

  await prisma.$transaction([
    prisma.clanMember.update({
      where: {
        clanId_discordUserId: {
          clanId: context.data.clanId,
          discordUserId: context.data.oldLeaderUserId,
        },
      },
      data: {
        role: ClanMemberRole.Officer,
      },
    }),
    prisma.clanMember.update({
      where: {
        clanId_discordUserId: {
          clanId: context.data.clanId,
          discordUserId: context.data.newLeaderUserId,
        },
      },
      data: {
        role: ClanMemberRole.Leader,
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

  return await interaction.reply({
    content: sprintf(
      "<@%s> has been promoted to leader of **%s** by <@%s>!",
      context.data.newLeaderUserId,
      clan.name,
      context.data.oldLeaderUserId,
    ),
  });
}

export async function clanCancelLeadershipTransfer(
  interactionContext: InteractionContext,
  interaction: AnyInteraction,
) {
  if (!interaction.isButton()) {
    return await interaction.reply(
      wrongInteractionType(interactionContext, interaction),
    );
  }

  if (interaction.user.id !== interactionContext.userDiscordId) {
    return await interaction.reply(
      notYourInteraction(interactionContext, interaction),
    );
  }

  const context = clanLeadershipTransferContext.safeParse(
    JSON.parse(interactionContext.payload ?? "{}"),
  );

  if (!context.success) {
    return await interaction.reply({
      content: "Invalid interaction context.",
      ephemeral: true,
    });
  }

  if (interactionContext.consumedAt) {
    return await interaction.reply({
      content: "This interaction has already been consumed.",
      ephemeral: true,
    });
  }

  const clan = await prisma.clan.findUnique({
    where: {
      id: context.data.clanId,
    },
    select: {
      name: true,
    },
  });

  if (!clan) {
    return await interaction.reply({
      content: "Clan not found",
      ephemeral: true,
    });
  }

  await prisma.interaction.update({
    where: {
      id: interactionContext.id,
    },
    data: {
      consumedAt: new Date(),
    },
  });

  return await interaction.update({
    content: "",
    components: [],
    embeds: [
      new EmbedBuilder()
        .setTitle("Leadership transfer canceled")
        .setColor(Colors.Error)
        .setDescription(
          sprintf(
            "The leadership transfer of **%s** has been canceled",
            clan.name,
          ),
        ),
    ],
  });
}
