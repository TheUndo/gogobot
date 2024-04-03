import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
} from "discord.js";
import { sprintf } from "sprintf-js";
import { z } from "zod";
import { client } from "~/common/client";
import { createWallet } from "~/common/logic/economy/createWallet";
import { getUserClan } from "~/common/logic/economy/getUserClan";
import { interactionAlreadyConsumed } from "~/common/logic/responses/interactionAlreadyConsumed";
import { notYourInteraction } from "~/common/logic/responses/notYourInteraction";
import { wrongGuildForInteraction } from "~/common/logic/responses/wrongGuildForInteraction";
import { wrongInteractionType } from "~/common/logic/responses/wrongInteractionType";
import {
  type AnyInteraction,
  ClanJoinSetting,
  ClanMemberRole,
  Colors,
  type InteractionContext,
  InteractionType,
} from "~/common/types";
import { addCurrency } from "~/common/utils/addCurrency";
import { formatNumber } from "~/common/utils/formatNumber";
import { slugify } from "~/common/utils/slugify";
import { prisma } from "~/prisma";

const CLAN_CREATE_PRICE = 500_000;

type Options = {
  userId: string;
  guildId: string;
};

export async function createGuildWizardStep1({ userId, guildId }: Options) {
  const clan = await getUserClan(userId, guildId);

  if (clan) {
    return {
      content: "You are already a member of a clan.",
      ephemeral: true,
    };
  }

  const embed = new EmbedBuilder()
    .setColor(Colors.Info)
    .setTitle("Clan Creation Wizard")
    .setDescription(
      [
        "Welcome to the clan creation wizard!",
        "A clan is a small community of players that can chat, share resources, and participate in events together.",
        sprintf(
          "Creating a clan costs **%s**",
          addCurrency()(formatNumber(CLAN_CREATE_PRICE)),
        ),
        "Are you sure you want to proceed?",
      ].join("\n\n"),
    );

  const [_, interactionCreate, interactionCancel] = await prisma.$transaction([
    prisma.interaction.updateMany({
      where: {
        userDiscordId: userId,
        guildId,
        consumedAt: null,
        type: {
          in: [
            InteractionType.ClanCreate,
            InteractionType.ClanCreateWizardCancel,
            InteractionType.ClanCreatePromptName,
          ],
        },
      },
      data: {
        consumedAt: new Date(),
      },
    }),
    prisma.interaction.create({
      data: {
        userDiscordId: userId,
        guildId,
        type: InteractionType.ClanCreate,
      },
    }),
    prisma.interaction.create({
      data: {
        userDiscordId: userId,
        guildId,
        type: InteractionType.ClanCreateWizardCancel,
      },
    }),
  ]);

  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId(interactionCreate.id)
      .setLabel("Proceed")
      .setStyle(ButtonStyle.Success),
    new ButtonBuilder()
      .setCustomId(interactionCancel.id)
      .setLabel("Cancel")
      .setStyle(ButtonStyle.Danger),
  );

  return {
    embeds: [embed],
    components: [row],
  };
}

const clanCreateNamePromptPayloadSchema = z.object({
  wizardMessageId: z.string(),
});

export async function createGuildWizardStep2(
  interactionContext: InteractionContext,
  interaction: AnyInteraction,
) {
  if (!interaction.isButton()) {
    return await interaction.reply(
      wrongInteractionType(interactionContext, interaction),
    );
  }

  if (interactionContext.userDiscordId !== interaction.user.id) {
    return await interaction.reply(
      notYourInteraction(interactionContext, interaction),
    );
  }

  if (interaction.guildId !== interactionContext.guildId) {
    return await interaction.reply(
      wrongGuildForInteraction(interactionContext, interaction),
    );
  }

  if (interactionContext.consumedAt) {
    return await interaction.update(
      interactionAlreadyConsumed(interactionContext, interaction),
    );
  }

  const [_, modalInteraction] = await prisma.$transaction([
    prisma.interaction.updateMany({
      where: {
        AND: [
          {
            type: {
              in: [
                InteractionType.ClanCreate,
                InteractionType.ClanCreateWizardCancel,
                InteractionType.ClanCreatePromptName,
              ],
            },
          },
          {
            NOT: {
              id: interactionContext.id,
            },
          },
          {
            userDiscordId: interactionContext.userDiscordId,
            guildId: interactionContext.guildId,
          },
        ],
      },
      data: {
        consumedAt: new Date(),
      },
    }),
    prisma.interaction.create({
      data: {
        guildId: interactionContext.guildId,
        userDiscordId: interactionContext.userDiscordId,
        type: InteractionType.ClanCreatePromptName,
        channelId: interaction.channelId,
        payload: JSON.stringify({
          wizardMessageId: interaction.message.id,
        } satisfies z.infer<typeof clanCreateNamePromptPayloadSchema>),
      },
    }),
  ]);

  const modal = new ModalBuilder()
    .setCustomId(modalInteraction.id)
    .setTitle("Clan Name")
    .addComponents(
      new ActionRowBuilder<TextInputBuilder>().addComponents(
        new TextInputBuilder()
          .setCustomId("name")
          .setLabel("Clan Name")
          .setMaxLength(32)
          .setRequired(true)
          .setStyle(TextInputStyle.Short),
      ),
    );

  return await interaction.showModal(modal);
}

export async function clanCreateCancelWizard(
  interactionContext: InteractionContext,
  interaction: AnyInteraction,
) {
  if (!interaction.isButton()) {
    return await interaction.reply(
      wrongInteractionType(interactionContext, interaction),
    );
  }

  if (interactionContext.userDiscordId !== interaction.user.id) {
    return await interaction.reply(
      notYourInteraction(interactionContext, interaction),
    );
  }

  if (interaction.guildId !== interactionContext.guildId) {
    return await interaction.reply(
      wrongGuildForInteraction(interactionContext, interaction),
    );
  }

  if (interactionContext.consumedAt) {
    return await interaction.update(
      interactionAlreadyConsumed(interactionContext, interaction),
    );
  }

  await prisma.interaction.updateMany({
    where: {
      userDiscordId: interactionContext.userDiscordId,
      guildId: interactionContext.guildId,
      consumedAt: null,
      type: {
        in: [
          InteractionType.ClanCreate,
          InteractionType.ClanCreateWizardCancel,
          InteractionType.ClanCreatePromptName,
        ],
      },
    },
    data: {
      consumedAt: new Date(),
    },
  });

  return await interaction.update({
    content: "",
    embeds: [
      new EmbedBuilder()
        .setTitle("Clan Creation Wizard")
        .setColor(Colors.Error)
        .setDescription("Clan creation wizard has been cancelled"),
    ],
    components: [],
  });
}

export async function clanCreateNamePrompt(
  interactionContext: InteractionContext,
  interaction: AnyInteraction,
) {
  const guildId = interaction.guildId;

  if (!guildId) {
    return await interaction.reply(
      wrongInteractionType(interactionContext, interaction),
    );
  }

  if (!interaction.isModalSubmit()) {
    return await interaction.reply(
      wrongInteractionType(interactionContext, interaction),
    );
  }

  if (interactionContext.userDiscordId !== interaction.user.id) {
    return await interaction.reply(
      notYourInteraction(interactionContext, interaction),
    );
  }

  if (interaction.guildId !== interactionContext.guildId) {
    return await interaction.reply(
      wrongGuildForInteraction(interactionContext, interaction),
    );
  }

  const payload = clanCreateNamePromptPayloadSchema.safeParse(
    JSON.parse(interactionContext.payload ?? "{}"),
  );

  if (!payload.success) {
    return await interaction.reply({
      content: "505: Invalid payload",
      ephemeral: true,
    });
  }

  const channelId = z.string().safeParse(interactionContext.channelId);

  if (!channelId.success) {
    return await interaction.reply({
      content: "505: Invalid channel",
      ephemeral: true,
    });
  }

  if (interactionContext.consumedAt) {
    const alreadyConsumed = interactionAlreadyConsumed(
      interactionContext,
      interaction,
    );

    return await interaction.reply(alreadyConsumed);
  }

  const channel = await client.channels.fetch(channelId.data);

  if (!channel) {
    return await interaction.reply({
      content: "505: Invalid channel",
      ephemeral: true,
    });
  }

  if (!channel.isTextBased()) {
    return await interaction.reply({
      content: "505: Invalid channel",
      ephemeral: true,
    });
  }

  const alreadyMember = await getUserClan(interaction.user.id, guildId);

  if (alreadyMember) {
    return {
      content: "You are already a member of a clan.",
      ephemeral: true,
    };
  }

  const message = await channel.messages.fetch(payload.data.wizardMessageId);

  if (!message) {
    return await interaction.reply({
      content: "505: Invalid message",
      ephemeral: true,
    });
  }

  const wallet = await createWallet(interaction.user.id, guildId);

  if (wallet.balance < CLAN_CREATE_PRICE) {
    return await interaction.reply({
      content: sprintf(
        "Insufficient funds. Creating a clan costs **%s**, you have **%s** in your wallet, you need **%s** more to afford it.",
        addCurrency()(formatNumber(CLAN_CREATE_PRICE)),
        addCurrency()(formatNumber(wallet.balance)),
        addCurrency()(formatNumber(CLAN_CREATE_PRICE - wallet.balance)),
      ),
      ephemeral: true,
    });
  }

  const name = z
    .string()
    .trim()
    .transform((v) => v.trim().replace(/[\n\s]+/g, " "))
    .refine((v) => v.length > 0 && v.length <= 32)
    .safeParse(interaction.fields.getField("name").value);

  if (!name.success) {
    return await interaction.reply({
      content: "Invalid clan name",
      ephemeral: true,
    });
  }

  const slug = slugify(name.data);

  if (!slug.length) {
    return await interaction.reply({
      content:
        "This clan name is invalid because it only contains non-alphanumeric characters. Try again.",
      ephemeral: true,
    });
  }

  if (/[<>@#*_~`|]/.test(name.data)) {
    return await interaction.reply({
      content:
        "Clan name has <, >, @, #, *, _, ~, ` or | characters, which are not allowed.",
      ephemeral: true,
    });
  }

  const existingClan = await prisma.clan.findUnique({
    where: {
      slug_discordGuildId: {
        slug,
        discordGuildId: guildId,
      },
    },
    select: {
      name: true,
    },
  });

  if (existingClan) {
    return await interaction.reply({
      content: sprintf(
        "A clan with the name **%s** (%s) already exists. Try again.",
        existingClan.name,
        slug,
      ),
      ephemeral: true,
    });
  }

  const [_, clan] = await prisma.$transaction([
    prisma.wallet.update({
      where: {
        id: wallet.id,
      },
      data: {
        balance: {
          decrement: CLAN_CREATE_PRICE,
        },
      },
    }),
    prisma.clan.create({
      data: {
        name: name.data,
        discordGuildId: guildId,
        slug,
        settingsJoin: ClanJoinSetting.Open,
      },
    }),
    prisma.clanMember.create({
      data: {
        guildId,
        discordUserId: interaction.user.id,
        role: ClanMemberRole.Leader,
        clan: {
          connect: {
            slug_discordGuildId: {
              slug,
              discordGuildId: guildId,
            },
          },
        },
      },
    }),
    prisma.interaction.updateMany({
      where: {
        userDiscordId: interactionContext.userDiscordId,
        guildId: interactionContext.guildId,
        consumedAt: null,
        type: {
          in: [
            InteractionType.ClanCreate,
            InteractionType.ClanCreateWizardCancel,
            InteractionType.ClanCreatePromptName,
          ],
        },
      },
      data: {
        consumedAt: new Date(),
      },
    }),
  ]);

  const suggestedAbbreviation = name.data.slice(0, 4).trim();
  const validAbbreviation = /^[A-Za-z0-9]+$/.test(suggestedAbbreviation);

  const checkAbbreviationUsed = validAbbreviation
    ? await prisma.clan.findFirst({
        where: {
          settingsAbbreviation: suggestedAbbreviation,
          discordGuildId: guildId,
        },
      })
    : null;

  if (
    validAbbreviation &&
    !checkAbbreviationUsed &&
    suggestedAbbreviation.length < name.data.length
  ) {
    await prisma.clan.update({
      where: {
        id: clan.id,
      },
      data: {
        settingsAbbreviation: suggestedAbbreviation,
      },
    });
  }

  await message
    .edit({
      content: "",
      components: [],
      embeds: [
        new EmbedBuilder()
          .setTitle("Clan Created")
          .setDescription(
            sprintf("Awesome, **%s** clan has now been created!", name.data),
          )
          .setColor(Colors.Success),
      ],
    })
    .catch(() => null);

  return await interaction.reply({
    content: "Success!",
    ephemeral: true,
  });
}
