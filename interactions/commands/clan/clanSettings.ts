import { ActionRowBuilder } from "@discordjs/builders";
import {
  type CacheType,
  type ChatInputCommandInteraction,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
} from "discord.js";
import { z } from "zod";
import { wrongGuildForInteraction } from "~/common/logic/responses/wrongGuildForInteraction";
import { wrongInteractionType } from "~/common/logic/responses/wrongInteractionType";
import {
  type AnyInteraction,
  ClanMemberRole,
  type InteractionContext,
  InteractionType,
} from "~/common/types";
import { prisma } from "~/prisma";
import { clanInteractionContext, showClanInfo } from "./clanInfo";
import { clanRoleUpdate, validateClanName } from "./clanRole";
import { updateClanChannel, upsertClanChannel } from "./clanChannel";

function generalSettings({
  description,
  color,
  abbreviation,
  banner,
  logo,
}: {
  description: string | null;
  color: number | null;
  abbreviation: string | null;
  banner: string | null;
  logo: string | null;
}): ActionRowBuilder<TextInputBuilder>[] {
  return [
    new ActionRowBuilder<TextInputBuilder>().addComponents(
      new TextInputBuilder()
        .setCustomId("description")
        .setLabel("Description")
        .setPlaceholder("Describe your clan")
        .setStyle(TextInputStyle.Paragraph)
        .setMaxLength(500)
        .setRequired(false)
        .setValue(description ?? ""),
    ),
    new ActionRowBuilder<TextInputBuilder>().addComponents(
      new TextInputBuilder()
        .setCustomId("color")
        .setLabel("Clan color, hex code")
        .setPlaceholder("#ffffff")
        .setStyle(TextInputStyle.Short)
        .setMaxLength(7)
        .setRequired(false)
        .setValue(color != null ? `#${color.toString(16)}` : ""),
    ),
    new ActionRowBuilder<TextInputBuilder>().addComponents(
      new TextInputBuilder()
        .setCustomId("abbreviation")
        .setLabel("Clan tag (abbreviation)")
        .setPlaceholder("ABC")
        .setStyle(TextInputStyle.Short)
        .setMaxLength(4)
        .setRequired(false)
        .setValue(abbreviation != null ? abbreviation : ""),
    ),
    new ActionRowBuilder<TextInputBuilder>().addComponents(
      new TextInputBuilder()
        .setCustomId("banner")
        .setLabel("Clan banner (URL)")
        .setPlaceholder("https://example.com/image.png")
        .setStyle(TextInputStyle.Short)
        .setRequired(false)
        .setValue(banner != null ? banner : ""),
    ),
    new ActionRowBuilder<TextInputBuilder>().addComponents(
      new TextInputBuilder()
        .setCustomId("logo")
        .setLabel("Clan logo (URL)")
        .setPlaceholder("https://example.com/logo.png")
        .setStyle(TextInputStyle.Short)
        .setRequired(false)
        .setValue(logo != null ? logo : ""),
    ),
  ];
}

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

  const clan = await prisma.clan.findUnique({
    where: {
      id: userClanMember.clanId,
    },
  });

  if (!clan) {
    return interaction.reply({
      content: "Clan not found",
      ephemeral: true,
    });
  }

  return await interaction.showModal(
    await clanSettingsModal({
      clanId: userClanMember.clanId,
      userId,
      guildId,
      fields: generalSettings({
        description: clan.settingsDescription,
        color: clan.settingsColor,
        abbreviation: clan.settingsAbbreviation,
        banner: clan.settingsBanner,
        logo: clan.settingsLogo,
      }),
    }),
  );
}

export async function clanChangeNameCommand({
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
      content: "Only the clan leader can change the clan's name.",
      ephemeral: true,
    });
  }

  const clan = await prisma.clan.findUnique({
    where: {
      id: userClanMember.clanId,
    },
  });

  if (!clan) {
    return interaction.reply({
      content: "Clan not found",
      ephemeral: true,
    });
  }

  return await interaction.showModal(
    await clanSettingsModal({
      clanId: userClanMember.clanId,
      userId,
      guildId,
      fields: [
        new ActionRowBuilder<TextInputBuilder>().addComponents(
          new TextInputBuilder()
            .setCustomId("name")
            .setLabel("Name")
            .setPlaceholder("Clan name")
            .setStyle(TextInputStyle.Short)
            .setMaxLength(32)
            .setMinLength(1)
            .setRequired(true)
            .setValue(clan.name),
        ),
      ],
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

  return await interaction.showModal(
    await clanSettingsModal({
      clanId: context.data.clanId,
      userId: interaction.user.id,
      guildId,
      fields: generalSettings({
        description: clan.settingsDescription,
        color: clan.settingsColor,
        abbreviation: clan.settingsAbbreviation,
        banner: clan.settingsBanner,
        logo: clan.settingsLogo,
      }),
    }),
  );
}

type SettingsModalOptions = {
  clanId: string;
  userId: string;
  guildId: string;
  fields: ActionRowBuilder<TextInputBuilder>[];
};
async function clanSettingsModal({
  clanId,
  userId,
  guildId,
  fields,
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
    .addComponents(...fields);

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

  const rawColor = interaction.fields.fields.find(
    (v) => v.customId === "color",
  )?.value;
  const rawDescription = interaction.fields.fields.find(
    (v) => v.customId === "description",
  )?.value;

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
    .optional()
    .safeParse(rawColor);

  const parsedColor = color.success ? color.data : null;

  const description = z
    .string()
    .trim()
    .max(500)
    .or(z.literal(""))
    .optional()
    .transform((v) => v || null)
    .safeParse(rawDescription);

  if (!description.success) {
    return await interaction.reply({
      content: "Invalid description",
      ephemeral: true,
    });
  }

  const issues: string[] = [];

  const rawAbbreviation = interaction.fields.fields.find(
    (v) => v.customId === "abbreviation",
  )?.value;

  const abbreviation = z
    .string()
    .regex(/^[a-zA-Z0-9]{1,4}$/)
    .or(z.literal(""))
    .optional()
    .transform((v) => v || null)
    .safeParse(rawAbbreviation);

  if (rawAbbreviation && !abbreviation.success) {
    issues.push("Invalid clan tag, use alphanumeric tag 1-4 characters");
  }

  const rawBanner = interaction.fields.fields.find(
    (v) => v.customId === "banner",
  )?.value;

  const banner = z
    .string()
    .url()
    .or(z.literal(""))
    .optional()
    .transform((v) => v || null)
    .safeParse(rawBanner);

  if (rawBanner && !banner.success) {
    issues.push("Invalid banner URL");
  }

  const rawLogo = interaction.fields.fields.find(
    (v) => v.customId === "logo",
  )?.value;

  const logo = z
    .string()
    .url()
    .or(z.literal(""))
    .optional()
    .transform((v) => v || null)
    .safeParse(rawLogo);

  if (rawLogo && !logo.success) {
    issues.push("Invalid logo URL");
  }

  const rawName = interaction.fields.fields.find(
    (v) => v.customId === "name",
  )?.value;

  const currentClan = await prisma.clan.findUnique({
    where: {
      id: context.data.clanId,
    },
  });

  if (!currentClan) {
    return await interaction.reply({
      content: "Clan not found",
      ephemeral: true,
    });
  }

  if (rawName && rawName !== currentClan.name) {
    if (
      currentClan.lastNameChange.getTime() + 1000 * 60 * 60 * 48 >
      new Date().getTime()
    ) {
      issues.push("You can only change the clan name once every 48 hours");
    } else {
      const result = await validateClanName(rawName, guildId);

      if ("error" in result) {
        issues.push(result.error);
      } else {
        const { slug, name } = result;
        await prisma.clan.update({
          where: {
            id: context.data.clanId,
          },
          data: {
            name,
            slug,
            lastNameChange: new Date(),
          },
        });
      }
    }
  }

  await prisma.clan.update({
    where: {
      id: context.data.clanId,
    },
    data: {
      settingsColor: parsedColor,
      settingsDescription: description.data,
      settingsAbbreviation: abbreviation.success
        ? abbreviation.data
        : undefined,
      settingsBanner: banner.success ? banner.data : undefined,
      settingsLogo: logo.success ? logo.data : undefined,
    },
  });

  await interaction.message?.edit(
    await showClanInfo({
      authorId: interaction.user.id,
      clanId: context.data.clanId,
    }),
  );

  await clanRoleUpdate(context.data.clanId);
  await upsertClanChannel(context.data.clanId).then((channel) =>
    channel ? updateClanChannel(context.data.clanId, channel) : undefined,
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
