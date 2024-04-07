import {
  type Interaction,
  SlashCommandBuilder,
  EmbedBuilder,
} from "discord.js";
import { Colors, type Command } from "~/common/types";
import { prisma } from "~/prisma";
import { WorkType, coolDowns, workCommands, workNames } from "./lib/workConfig";
import { z } from "zod";
import { sprintf } from "sprintf-js";
import { getCommands } from "~/common/routers/commands";
import { makeCommand } from "~/scraper/debug";

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

async function createWorkEmbed({ guildId, userId }: Options) {
  const embed = new EmbedBuilder().setTitle("Work");

  const lastUsed = await prisma.$transaction(
    Object.entries(coolDowns).map(([type]) => {
      return prisma.work.findFirst({
        where: {
          type,
          userDiscordId: userId,
          guildDiscordId: guildId,
        },
        orderBy: {
          createdAt: "desc",
        },
      });
    }),
  );

  type Availability = {
    type: WorkType;
    lastUsed: Date | null;
  };

  const { available, unavailable } = (() => {
    const available: Availability[] = [];
    const unavailable: Availability[] = [];

    for (const [rawType, cooldown] of Object.entries(coolDowns)) {
      const type = z.nativeEnum(WorkType).parse(rawType);
      const last = lastUsed.find((work) => work?.type === type);

      if (!last || last.createdAt.getTime() + cooldown < Date.now()) {
        available.push({ type, lastUsed: null });
      } else {
        unavailable.push({ type, lastUsed: last.createdAt });
      }
    }

    return { available, unavailable };
  })();

  const commands = getCommands();

  const makeListItem = (item: Availability) => {
    if (item.lastUsed) {
      return sprintf(
        "- ~~%s~~ <t:%d:R>",
        workNames[item.type],
        Math.floor((item.lastUsed.getTime() + coolDowns[item.type]) / 1000),
      );
    }

    const command = commands.get(workCommands[item.type]);
    if (!command) {
      return sprintf("- %s", workNames[item.type]);
    }

    return sprintf("- %s", makeCommand(workCommands[item.type], command.id));
  };

  const sortItems = (a: Availability, b: Availability) => {
    if (!a.lastUsed || !b.lastUsed) {
      return 0;
    }
    return b.lastUsed.getTime() - a.lastUsed.getTime();
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
          description: unavailable.sort(sortItems).map(makeListItem).join("\n"),
        })
      : null,
  ]
    .filter(Boolean)
    .join("\n");

  return embed
    .setDescription(parts)
    .setColor(available.length ? Colors.Success : Colors.Info);
}
