import { guardEconomyChannel } from "!/bot/logic/guildConfig/guardEconomyChannel";
import { getCommands } from "!/bot/routers/commands";
import { Colors, type Command } from "!/bot/types";
import { prisma } from "!/core/db/prisma";
import { makeCommand } from "!/gogo/scraper/debug";
import {
  EmbedBuilder,
  type Interaction,
  SlashCommandBuilder,
} from "discord.js";
import { sprintf } from "sprintf-js";
import { z } from "zod";
import {
  WorkType,
  coolDowns,
  workCommandUses,
  workCommands,
  workNames,
} from "./lib/workConfig";

export const work = {
  data: new SlashCommandBuilder()
    .setName("work")
    .setDescription("Show work status"),
  async execute(interaction: Interaction) {
    if (!interaction.isRepliable()) {
      return;
    }

    const guildId = interaction.guild?.id;

    if (!guildId) {
      return await interaction.reply(
        "This command can only be used in a server.",
      );
    }

    if (!interaction.isCommand()) {
      return await interaction.reply(
        "This interaction can only be used as a command.",
      );
    }

    const guard = await guardEconomyChannel(
      guildId,
      interaction.channelId,
      interaction.user.id,
    );

    if (guard) {
      return await interaction.reply({
        ephemeral: true,
        ...guard,
      });
    }

    const userId = interaction.user.id;

    return await interaction.reply({
      embeds: [await createWorkEmbed({ guildId, userId })],
    });
  },
} satisfies Command;

type Options = {
  guildId: string;
  userId: string;
};

const fixedDate: WorkType[] = [WorkType.Daily];

async function createWorkEmbed({ guildId, userId }: Options) {
  const embed = new EmbedBuilder();

  const coolDownWorkTypes = Object.entries(coolDowns).map(([rawType]) =>
    z.nativeEnum(WorkType).parse(rawType),
  );

  const lastUsed = await prisma.$transaction([
    ...coolDownWorkTypes
      .filter((type) => !fixedDate.includes(type))
      .map((type) => {
        return prisma.work.findMany({
          where: {
            type,
            userDiscordId: userId,
            guildDiscordId: guildId,
            createdAt: {
              gte: new Date(Date.now() - coolDowns[type]),
            },
          },
          orderBy: {
            createdAt: "desc",
          },
          take: workCommandUses[type],
        });
      }),
    prisma.work.findMany({
      where: {
        type: WorkType.Daily,
        createdAt: {
          gte: new Date(
            Math.floor(Date.now() / (1000 * 60 * 60 * 24)) *
              60 *
              60 *
              24 *
              1000,
          ),
        },
      },
    }),
  ]);

  type Availability = {
    type: WorkType;
    lastUsed: Date | null;
    usesLeft: number;
  };

  const { available, unavailable } = (() => {
    const available: Availability[] = [];
    const unavailable: Availability[] = [];

    for (const type of coolDownWorkTypes) {
      const usesOfType = lastUsed.flat(1).filter((d) => d.type === type);
      const last = usesOfType.at(-1) ?? null;
      const usesLeft = workCommandUses[type] - usesOfType.length;
      if (usesLeft > 0 || !last) {
        available.push({ type, lastUsed: null, usesLeft });
      } else {
        unavailable.push({ type, lastUsed: last.createdAt, usesLeft });
      }
    }

    return { available, unavailable };
  })();

  const commands = getCommands();

  const availableIn = (type: WorkType, lastUsed: Date) => {
    if (fixedDate.includes(type)) {
      return Math.ceil(Date.now() / (1000 * 60 * 60 * 24)) * 60 * 60 * 24;
    }

    return Math.floor((lastUsed.getTime() + coolDowns[type]) / 1000);
  };

  const makeListItem = (item: Availability) => {
    if (item.lastUsed) {
      return sprintf(
        "- ~~%s~~ <t:%d:R>",
        workNames[item.type],
        availableIn(item.type, item.lastUsed),
      );
    }

    const usesLeftMessage =
      item.usesLeft > 1
        ? sprintf(" (%d/%d)", item.usesLeft, workCommandUses[item.type])
        : "";

    const command = commands.get(workCommands[item.type]);
    if (!command) {
      return sprintf("- %s%s", workNames[item.type], usesLeftMessage);
    }

    return sprintf(
      "- %s%s",
      makeCommand(workCommands[item.type], command.id),
      usesLeftMessage,
    );
  };

  function makePart({
    title,
    description,
  }: { title: string; description: string }) {
    return [sprintf("**%s**", title), description].join("\n");
  }

  const parts = [
    available.length > 0
      ? makePart({
          title: "Available",
          description: available.map(makeListItem).join("\n"),
        })
      : null,
    unavailable.length > 0
      ? makePart({
          title: "Used",
          description: unavailable
            .sort((a, b) => {
              if (!a.lastUsed || !b.lastUsed) {
                return 0;
              }

              return (
                availableIn(a.type, a.lastUsed) -
                availableIn(b.type, b.lastUsed)
              );
            })
            .map(makeListItem)
            .join("\n"),
        })
      : null,
  ]
    .filter(Boolean)
    .join("\n");

  return embed
    .setDescription(parts)
    .setColor(available.length ? Colors.Success : Colors.Info);
}
