import { notYourInteraction } from "!/bot/logic/responses/notYourInteraction";
import { wrongInteractionType } from "!/bot/logic/responses/wrongInteractionType";
import {
  type AnyInteraction,
  Colors,
  type InteractionContext,
  InteractionType,
} from "!/bot/types";
import { wrapTag } from "!/bot/utils/wrapTag";
import { prisma } from "!/core/db/prisma";
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

type Options = {
  authorId: string;
  guildId: string;
  page: number;
};

const clanListPageContext = z.object({
  page: z.number(),
});

const pageSize = 10;

export async function clanListChangePage(
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

  const guildId = interaction.guildId;

  if (!guildId) {
    return await interaction.reply(
      "This interaction can only be used in a server.",
    );
  }

  const context = clanListPageContext.safeParse(
    JSON.parse(interactionContext.payload ?? "{}"),
  );

  if (!context.success) {
    return await interaction.reply(
      "An error occurred. Please try again later.",
    );
  }

  return await interaction.update(
    await clanListCommand({
      authorId: interaction.user.id,
      guildId,
      page: context.data.page,
    }),
  );
}

export async function clanListCommand({ authorId, guildId, page }: Options) {
  const [myClan, clans, size] = await prisma.$transaction([
    prisma.clan.findFirst({
      where: {
        members: {
          some: {
            discordUserId: authorId,
          },
        },
        discordGuildId: guildId,
      },
    }),
    prisma.clan.findMany({
      where: {
        discordGuildId: guildId,
      },
      orderBy: {
        level: "desc",
      },
      select: {
        id: true,
        name: true,
        settingsAbbreviation: true,
        level: true,
        _count: {
          select: {
            members: true,
          },
        },
      },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.clan.count({
      where: {
        discordGuildId: guildId,
      },
    }),
  ]);

  const pages = Math.ceil(size / pageSize);

  const embed = new EmbedBuilder().setColor(Colors.Info);

  if (page === 1) {
    embed.setTitle("Clans");
  } else {
    embed.setTitle(sprintf("Clans Page %d/%d", page, pages));
  }

  if (clans.length) {
    const list = clans.map((clan) => {
      const isMyClan = myClan && myClan.id === clan.id ? " (Your Clan)" : "";
      if (clan.settingsAbbreviation) {
        return sprintf(
          "- **%s** %s lvl. **%d** • %d/50%s",
          clan.name,
          wrapTag(clan.settingsAbbreviation),
          clan.level,
          clan._count.members,
          isMyClan,
        );
      }

      return sprintf(
        "- **%s** lvl. **%d** • %d/50%s",
        clan.name,
        clan.level,
        clan._count.members,
        isMyClan,
      );
    });

    embed.setDescription(list.join("\n"));
  } else {
    embed.setDescription("No clans found.");
  }

  const [previousPageInteraction, nextPageInteraction] =
    await prisma.$transaction([
      prisma.interaction.create({
        data: {
          type: InteractionType.ClanListChangePage,
          userDiscordId: authorId,
          guildId,
          payload: JSON.stringify({ page: page - 1 } satisfies z.infer<
            typeof clanListPageContext
          >),
        },
      }),
      prisma.interaction.create({
        data: {
          type: InteractionType.ClanListChangePage,
          userDiscordId: authorId,
          guildId,
          payload: JSON.stringify({ page: page + 1 } satisfies z.infer<
            typeof clanListPageContext
          >),
        },
      }),
    ]);

  const buttons = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setEmoji("⬅️")
      .setDisabled(page === 1)
      .setStyle(ButtonStyle.Secondary)
      .setCustomId(previousPageInteraction.id),
    new ButtonBuilder()
      .setEmoji("➡️")
      .setDisabled(page === pages)
      .setStyle(ButtonStyle.Secondary)
      .setCustomId(nextPageInteraction.id),
  );

  if (!myClan) {
    const joinClanInteraction = await prisma.interaction.create({
      data: {
        type: InteractionType.ClanJoin,
        userDiscordId: authorId,
        guildId,
      },
    });

    const select = new StringSelectMenuBuilder()
      .setCustomId(joinClanInteraction.id)
      .setPlaceholder("Join a clan")
      .addOptions(
        clans.map((clan) => {
          return new StringSelectMenuOptionBuilder()
            .setLabel(clan.name)
            .setValue(clan.id);
        }),
      );

    return {
      embeds: [embed],
      components: [
        new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(select),
        buttons,
      ],
    };
  }

  return {
    embeds: [embed],
    components: [buttons],
  };
}
