import { notYourInteraction } from "!/common/logic/responses/notYourInteraction";
import { wrongGuildForInteraction } from "!/common/logic/responses/wrongGuildForInteraction";
import { wrongInteractionType } from "!/common/logic/responses/wrongInteractionType";
import {
  type AnyInteraction,
  ClanJoinSetting,
  ClanMemberRole,
  Colors,
  type InteractionContext,
  InteractionType,
} from "!/common/types";
import { addCurrency } from "!/common/utils/addCurrency";
import { formatNumber } from "!/common/utils/formatNumber";
import { wrapTag } from "!/common/utils/wrapTag";
import { prisma } from "!/prisma";
import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
} from "discord.js";
import { sprintf } from "sprintf-js";
import { z } from "zod";
import { joinSettings } from "./clanConfig";
import { showClanMembers } from "./clanMembers";
import { getName } from "!/common/logic/discordCache/store";

export const clanInteractionContext = z.object({
  clanId: z.string(),
});

type Options = {
  authorId: string;
  mentionedId?: string;
  guildId: string;
};

export async function showClanInfoCommand({
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

  return await showClanInfo({
    authorId,
    clanId: clan.id,
  });
}

export async function showClanInfo({
  clanId,
  authorId,
}: {
  clanId: string;
  authorId: string;
}) {
  const clan = await prisma.clan.findFirst({
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
      ephemeral: true,
    };
  }

  const where = {
    guildId: clan.discordGuildId,
    userDiscordId: {
      in: clan.members.map((member) => member.discordUserId),
    },
  };

  const _sum = {
    balance: true,
  } as const;

  const treasuryBalance = clan.treasuryBalance;

  const wealth = await prisma
    .$transaction([
      prisma.wallet.aggregate({
        where,
        _sum,
      }),
      prisma.bank.aggregate({
        where,
        _sum,
      }),
    ])
    .then((results) =>
      results.reduce((acc, { _sum }) => acc + (_sum.balance ?? 0), 0),
    )
    .then((d) => d + treasuryBalance);

  const embed = new EmbedBuilder();

  const content = sprintf("# %s", clan.name);

  const leader = clan.members.find(
    (member) => member.role === ClanMemberRole.Leader,
  );

  if (!leader) {
    return {
      content: "Clan leader not found",
      ephemeral: true,
    };
  }

  const settingsJoin = z
    .nativeEnum(ClanJoinSetting)
    .safeParse(clan.settingsJoin);

  if (!settingsJoin.success) {
    return {
      content: "Invalid join setting",
      ephemeral: true,
    };
  }

  if (clan.settingsDescription?.trim()) {
    embed.setDescription(clan.settingsDescription);
  }

  embed.addFields(
    {
      name: "Members",
      value: sprintf("%d/50", clan.members.length),
      inline: true,
    },
    {
      name: "Level",
      value: sprintf("%d", clan.level),
      inline: true,
    },
    {
      name: "Leader",
      value: getName({
        userId: leader.discordUserId,
        guildId: clan.discordGuildId,
      }),
      inline: true,
    },
    {
      name: "Treasury",
      value: sprintf("%s", addCurrency()(formatNumber(treasuryBalance))),
      inline: true,
    },
    {
      name: "Total wealth",
      value: sprintf("%s", addCurrency()(formatNumber(wealth))),
      inline: true,
    },
    {
      name: "Created",
      value: sprintf(
        "<t:%d:d> • <t:%d:R>",
        clan.createdAt.getTime() / 1e3,
        clan.createdAt.getTime() / 1e3,
      ),
      inline: true,
    },
  );

  if (clan.settingsAbbreviation) {
    embed.addFields({
      name: "Tag",
      value: wrapTag(clan.settingsAbbreviation),
      inline: true,
    });
  }

  if (clan.settingsBanner) {
    embed.setImage(clan.settingsBanner);
  }

  if (clan.settingsLogo) {
    embed.setThumbnail(clan.settingsLogo);
  }

  const context: z.infer<typeof clanInteractionContext> = {
    clanId: clan.id,
  };

  const [
    promptSettingsInteraction,
    joinClanInteraction,
    changeJoinSettingInteraction,
    membersInteraction,
  ] = await prisma.$transaction([
    prisma.interaction.create({
      data: {
        type: InteractionType.ClanPromptSettings,
        userDiscordId: authorId,
        guildId: clan.discordGuildId,
        payload: JSON.stringify(context),
      },
    }),
    prisma.interaction.create({
      data: {
        type: InteractionType.ClanJoin,
        userDiscordId: authorId,
        guildId: clan.discordGuildId,
        payload: JSON.stringify(context),
      },
    }),
    prisma.interaction.create({
      data: {
        type: InteractionType.ClanChangeJoinSettingSelect,
        userDiscordId: authorId,
        guildId: clan.discordGuildId,
        payload: JSON.stringify(context),
      },
    }),
    prisma.interaction.create({
      data: {
        type: InteractionType.ClanShowMemberList,
        userDiscordId: authorId,
        guildId: clan.discordGuildId,
        payload: JSON.stringify(context),
      },
    }),
  ]);

  const authorMember = await prisma.clanMember.findFirst({
    where: {
      discordUserId: authorId,
      clanId: clan.id,
    },
  });

  const authorIsCoLeaderOrLeader =
    authorMember &&
    [ClanMemberRole.Leader, ClanMemberRole.CoLeader].includes(
      z.nativeEnum(ClanMemberRole).parse(authorMember.role),
    );

  if (!authorIsCoLeaderOrLeader) {
    embed.addFields({
      name: "Availability",
      value: joinSettings[settingsJoin.data],
      inline: true,
    });
  }

  const firstRow = new ActionRowBuilder<StringSelectMenuBuilder>();
  const secondRow = new ActionRowBuilder<ButtonBuilder>();

  if (authorMember?.clanId === clan.id && authorIsCoLeaderOrLeader) {
    firstRow.addComponents(
      new StringSelectMenuBuilder()
        .setCustomId(changeJoinSettingInteraction.id)
        .setPlaceholder("Change join setting")
        .addOptions(
          new StringSelectMenuOptionBuilder()
            .setDefault(settingsJoin.data === ClanJoinSetting.Open)
            .setLabel(joinSettings[ClanJoinSetting.Open])
            .setValue(ClanJoinSetting.Open),
          new StringSelectMenuOptionBuilder()
            .setDefault(settingsJoin.data === ClanJoinSetting.Approval)
            .setLabel(joinSettings[ClanJoinSetting.Approval])
            .setValue(ClanJoinSetting.Approval),
          new StringSelectMenuOptionBuilder()
            .setDefault(settingsJoin.data === ClanJoinSetting.Closed)
            .setLabel(joinSettings[ClanJoinSetting.Closed])
            .setValue(ClanJoinSetting.Closed),
        ),
    );
    secondRow.addComponents(
      new ButtonBuilder()
        .setCustomId(promptSettingsInteraction.id)
        .setEmoji("⚙️")
        .setStyle(ButtonStyle.Secondary),
    );
  }

  secondRow.addComponents(
    new ButtonBuilder()
      .setCustomId(joinClanInteraction.id)
      .setLabel(
        settingsJoin.data === ClanJoinSetting.Approval
          ? "Request to join"
          : "Join",
      )
      .setStyle(
        settingsJoin.data === ClanJoinSetting.Open
          ? ButtonStyle.Primary
          : ButtonStyle.Secondary,
      )
      .setDisabled(settingsJoin.data === ClanJoinSetting.Closed),
    new ButtonBuilder()
      .setCustomId(membersInteraction.id)
      .setLabel("Members")
      .setStyle(ButtonStyle.Secondary),
  );

  embed.setColor(clan.settingsColor ?? Colors.Info);

  return {
    content,
    components: [firstRow, secondRow].filter((v) => v.components.length > 0),
    embeds: [embed],
  };
}

export async function clanInfoButton(
  interactionContext: InteractionContext,
  interaction: AnyInteraction,
) {
  if (!interaction.isButton()) {
    return await interaction.reply(
      wrongInteractionType(interactionContext, interaction),
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

  if (interaction.user.id !== interactionContext.userDiscordId) {
    return await interaction.reply(
      notYourInteraction(interactionContext, interaction),
    );
  }

  const context = clanInteractionContext.safeParse(
    JSON.parse(interactionContext.payload ?? "{}"),
  );

  if (!context.success) {
    return await interaction.reply({
      content: "Invalid context",
      ephemeral: true,
    });
  }

  return await interaction.update(
    await showClanInfo({
      authorId: interaction.user.id,
      clanId: context.data.clanId,
    }),
  );
}

export async function clanMembersButton(
  interactionContext: InteractionContext,
  interaction: AnyInteraction,
) {
  if (!interaction.isButton()) {
    return await interaction.reply(
      wrongInteractionType(interactionContext, interaction),
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

  if (interaction.user.id !== interactionContext.userDiscordId) {
    return await interaction.reply(
      notYourInteraction(interactionContext, interaction),
    );
  }

  const context = clanInteractionContext.safeParse(
    JSON.parse(interactionContext.payload ?? "{}"),
  );

  if (!context.success) {
    return await interaction.reply({
      content: "Invalid context",
      ephemeral: true,
    });
  }

  return await interaction.update(
    await showClanMembers({
      authorId: interaction.user.id,
      clanId: context.data.clanId,
    }),
  );
}
