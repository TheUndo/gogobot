import {
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  type ChatInputCommandInteraction,
  type CacheType,
} from "discord.js";
import { wrongGuildForInteraction } from "../../../common/logic/responses/wrongGuildForInteraction";
import { wrongInteractionType } from "../../../common/logic/responses/wrongInteractionType";
import {
  ClanMemberRole,
  type AnyInteraction,
  type InteractionContext,
  InteractionType,
} from "../../../common/types";
import { prisma } from "../../../prisma";
import { clanInteractionContext, showClanInfo } from "./clanInfo";
import { ActionRowBuilder } from "@discordjs/builders";
import { z } from "zod";

export async function clanSettingsCommand({
  userId,
  guildId,
  interaction,
}: {
  userId: string;
  guildId: string;
  interaction: ChatInputCommandInteraction<CacheType>;
}) {
  const userClanMember = await prisma.clanMember.findFirst({
    where: {
      discordUserId: userId,
      clan: {
        discordGuildId: guildId,
      },
    },
  });

  if (!userClanMember) {
    return interaction.reply({
      content: "You are not in a clan.",
      ephemeral: true,
    });
  }

  if (userClanMember.role !== ClanMemberRole.Leader) {
    return interaction.reply({
      content: "Only the clan leader can change the settings.",
      ephemeral: true,
    });
  }

  return await interaction.showModal(
    await clanSettingsModal({
      clanId: userClanMember.clanId,
      userId,
      guildId,
    }),
  );
}

export async function clanSettingsButton(
  interactionContext: InteractionContext,
  interaction: AnyInteraction,
) {
  if (!interaction.isButton()) {
    return await interaction.reply(
      wrongInteractionType(interactionContext, interaction),
    );
  }

  if (interaction.guildId !== interactionContext.guildId) {
    return await interaction.reply(
      wrongGuildForInteraction(interactionContext, interaction),
    );
  }

  const guildId = interaction.guildId;

  if (!guildId) {
    return await interaction.reply({
      content: "This command can only be used in a server.",
      ephemeral: true,
    });
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
      content: "You are not in this clan",
      ephemeral: true,
    });
  }

  if (userClanMember.role !== ClanMemberRole.Leader) {
    return await interaction.reply({
      content: "Only the clan leader can change the settings",
      ephemeral: true,
    });
  }

  return await interaction.showModal(
    await clanSettingsModal({
      clanId: context.data.clanId,
      userId: interaction.user.id,
      guildId,
    }),
  );
}

type SettingsModalOptions = {
  clanId: string;
  userId: string;
  guildId: string;
};
async function clanSettingsModal({
  clanId,
  userId,
  guildId,
}: SettingsModalOptions) {
  const clan = await prisma.clan.findUnique({
    where: {
      id: clanId,
    },
  });

  if (!clan) {
    throw new Error("Clan not found");
  }

  const interaction = await prisma.interaction.create({
    data: {
      type: InteractionType.ClanSettingsModalSubmit,
      guildId: guildId,
      userDiscordId: userId,
      payload: JSON.stringify({
        clanId,
      } satisfies z.infer<typeof clanInteractionContext>),
    },
  });

  const modal = new ModalBuilder()
    .setTitle("Clan settings")
    .setCustomId(interaction.id)
    .addComponents(
      new ActionRowBuilder<TextInputBuilder>().addComponents(
        new TextInputBuilder()
          .setCustomId("description")
          .setLabel("Description")
          .setPlaceholder("Describe your clan")
          .setStyle(TextInputStyle.Paragraph)
          .setMaxLength(500)
          .setRequired(false)
          .setValue(clan.settingsDescription ?? ""),
      ),
      new ActionRowBuilder<TextInputBuilder>().addComponents(
        new TextInputBuilder()
          .setCustomId("color")
          .setLabel("Clan color, hex code")
          .setPlaceholder("#ffffff")
          .setStyle(TextInputStyle.Short)
          .setMaxLength(7)
          .setRequired(false)
          .setValue(
            clan.settingsColor != null
              ? `#${clan.settingsColor.toString(16)}`
              : "",
          ),
      ),
      new ActionRowBuilder<TextInputBuilder>().addComponents(
        new TextInputBuilder()
          .setCustomId("abbreviation")
          .setLabel("Clan tag (abbreviation)")
          .setPlaceholder("ABC")
          .setStyle(TextInputStyle.Short)
          .setMaxLength(4)
          .setRequired(false)
          .setValue(
            clan.settingsAbbreviation != null ? clan.settingsAbbreviation : "",
          ),
      ),
    );

  return modal;
}

export async function clanSettingsModalSubmit(
  interactionContext: InteractionContext,
  interaction: AnyInteraction,
) {
  if (!interaction.isModalSubmit()) {
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
      content: "You are not in this clan",
      ephemeral: true,
    });
  }

  if (userClanMember.role !== ClanMemberRole.Leader) {
    return await interaction.reply({
      content: "Only the clan leader can change the settings",
      ephemeral: true,
    });
  }

  const rawColor = interaction.fields.getTextInputValue("color");
  const rawDescription = interaction.fields.getTextInputValue("description");

  const color = z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^#?([0-9a-f]{6}|[0-9a-f]{3})$/)
    .transform((v) => v.replace("#", ""))
    .transform((v) => (v.length === 3 ? v.repeat(2) : v))
    .transform((v) => Number.parseInt(v, 16))
    .refine((v) => !Number.isNaN(v))
    .refine((v) => v >= 0 && v <= 0xffffff)
    .safeParse(rawColor);

  const parsedColor = color.success ? color.data : null;

  const description = z
    .string()
    .trim()
    .max(500)
    .optional()
    .nullable()
    .safeParse(rawDescription);

  if (!description.success) {
    return await interaction.reply({
      content: "Invalid description",
      ephemeral: true,
    });
  }

  const issues: string[] = [];

  const rawAbbreviation = interaction.fields.getTextInputValue("abbreviation");

  const abbreviation = z
    .string()
    .regex(/^[a-zA-Z0-9]{1,4}$/)
    .safeParse(rawAbbreviation);

  if (rawAbbreviation && !abbreviation.success) {
    issues.push("Invalid clan tag, use alphanumeric tag 1-4 characters");
  }

  await prisma.clan.update({
    where: {
      id: context.data.clanId,
    },
    data: {
      settingsColor: parsedColor,
      settingsDescription: description.data || null,
      settingsAbbreviation: abbreviation.success ? abbreviation.data : null,
    },
  });

  await interaction.message?.edit(
    await showClanInfo({
      authorId: interaction.user.id,
      guildId,
    }),
  );

  if (issues.length) {
    return await interaction.reply({
      content: [
        "Some settings were not updated because of the following issues:",
        ...issues.map((issue) => `- ${issue}`),
      ].join("\n"),
    });
  }

  return await interaction.reply({
    content: "Settings updated",
    ephemeral: true,
  });
}
