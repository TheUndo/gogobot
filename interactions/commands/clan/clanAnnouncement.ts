import {
  ActionRowBuilder,
  ModalBuilder,
  TextInputBuilder,
} from "@discordjs/builders";
import { TextInputStyle } from "discord.js";
import { sprintf } from "sprintf-js";
import { z } from "zod";
import { notYourInteraction } from "~/common/logic/responses/notYourInteraction";
import {
  type AnyInteraction,
  ClanMemberRole,
  type InteractionContext,
  InteractionType,
} from "~/common/types";
import { prisma } from "~/prisma";
import { upsertClanChannel } from "./clanChannel";
import { clanUpsertRole } from "./clanRole";

const announcementContext = z.object({
  clanId: z.string(),
  authorDiscordId: z.string(),
});

const coolDown = 1000 * 60 * 60 * 12;

export async function clanAnnouncementCommand(
  guildId: string,
  authorId: string,
): Promise<{ content: string; ephemeral?: boolean } | { modal: ModalBuilder }> {
  const clan = await prisma.clan.findFirst({
    where: {
      discordGuildId: guildId,
      members: {
        some: {
          discordUserId: authorId,
        },
      },
    },
  });

  if (!clan) {
    return {
      content: "You are not in a clan.",
      ephemeral: true,
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
      content: "You are not in a clan.",
      ephemeral: true,
    };
  }

  if (clanMember.role !== ClanMemberRole.Leader) {
    return {
      content: "You must be a clan leader to make a clan announcement.",
      ephemeral: true,
    };
  }

  const lastAnnouncement = await prisma.clanAnnouncement.findFirst({
    where: {
      clanId: clan.id,
      createdAt: {
        gte: new Date(Date.now() - coolDown),
      },
    },
  });

  if (lastAnnouncement) {
    return {
      content: sprintf(
        "You can make a clan announcement <t:%d:R>.",
        Math.round((lastAnnouncement.createdAt.getTime() + coolDown) / 1000),
      ),
    };
  }

  const context: z.infer<typeof announcementContext> = {
    clanId: clan.id,
    authorDiscordId: authorId,
  };

  const interaction = await prisma.interaction.create({
    data: {
      userDiscordId: authorId,
      guildId,
      type: InteractionType.ClanMakeAnnouncement,
      payload: JSON.stringify(context),
    },
  });

  const modal = new ModalBuilder()
    .setTitle("Clan Announcement")
    .setCustomId(interaction.id)
    .addComponents(
      new ActionRowBuilder<TextInputBuilder>().addComponents(
        new TextInputBuilder()
          .setCustomId("message")
          .setLabel("Message")
          .setPlaceholder("Enter your message here.")
          .setRequired(true)
          .setStyle(TextInputStyle.Paragraph)
          .setMaxLength(900)
          .setMinLength(20),
      ),
    );

  return { modal };
}

export async function clanAnnouncementModalSubmission(
  interactionContext: InteractionContext,
  interaction: AnyInteraction,
) {
  if (interaction.user.id !== interactionContext.userDiscordId) {
    return await interaction.reply(
      notYourInteraction(interactionContext, interaction),
    );
  }

  if (!interaction.isModalSubmit()) {
    return await interaction.reply({
      content: "This interaction can only be used as a modal submission.",
      ephemeral: true,
    });
  }

  const guildId = interactionContext.guildId;

  if (!guildId) {
    return await interaction.reply({
      content: "This interaction can only be used in a server.",
      ephemeral: true,
    });
  }

  const context = announcementContext.safeParse(
    JSON.parse(interactionContext.payload ?? "{}"),
  );

  if (!context.success) {
    return await interaction.reply({
      content: "Invalid context. Contact developers.",
      ephemeral: true,
    });
  }

  const rawMessage = interaction.fields.getField("message").value;

  const message = z.string().min(20).max(900).safeParse(rawMessage);

  if (!message.success) {
    return await interaction.reply({
      content: "Invalid message. Must be between 20 and 900 characters.",
      ephemeral: true,
    });
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

  const clanMember = await prisma.clanMember.findFirst({
    where: {
      clanId: clan.id,
      discordUserId: context.data.authorDiscordId,
    },
  });

  if (!clanMember) {
    return await interaction.reply({
      content: "You are not in a clan.",
      ephemeral: true,
    });
  }

  if (clanMember.role !== ClanMemberRole.Leader) {
    return await interaction.reply({
      content: "You must be a clan leader to make a clan announcement.",
      ephemeral: true,
    });
  }

  const result = await clanUpsertRole(clan.id);

  if (!result) {
    return await interaction.reply({
      content: "Failed to upsert role. Contact developers.",
      ephemeral: true,
    });
  }

  const { role } = result;

  if (!role) {
    return await interaction.reply({
      content: "Role not found. Contact developers.",
      ephemeral: true,
    });
  }

  const channel = await upsertClanChannel(clan.id);

  if (!channel) {
    return await interaction.reply({
      content: "Failed to upsert channel. Contact developers.",
      ephemeral: true,
    });
  }

  const composedMessage = [
    message.data,
    sprintf(
      "*<@&%s> clan announcement from <@%s>*",
      role.id,
      context.data.authorDiscordId,
    ),
  ].join("\n\n");

  const sentMessage = await channel
    .send({
      content: composedMessage,
      allowedMentions: {
        users: [],
        roles: [role.id],
      },
    })
    .catch((e) => {
      console.error("Failed to send message", e);
      return null;
    });

  if (!sentMessage) {
    return await interaction.reply({
      content: "Failed to send message. Contact developers.",
      ephemeral: true,
    });
  }

  await prisma.clanAnnouncement.create({
    data: {
      clanId: clan.id,
      message: message.data,
      authorDiscordId: context.data.authorDiscordId,
    },
  });

  return await interaction.reply({
    content: "Clan announcement posted.",
    ephemeral: true,
  });
}
