import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  type Interaction,
  SlashCommandBuilder,
} from "discord.js";
import { shuffle } from "remeda";
import * as R from "remeda";
import { sprintf } from "sprintf-js";
import { z } from "zod";
import { createWallet } from "~/common/logic/economy/createWallet";
import { guardEconomyChannel } from "~/common/logic/guildConfig/guardEconomyChannel";
import { notYourInteraction } from "~/common/logic/responses/notYourInteraction";
import {
  type AnyInteraction,
  Colors,
  type Command,
  type InteractionContext,
  InteractionType,
} from "~/common/types";
import { addCurrency } from "~/common/utils/addCurrency";
import { formatNumber } from "~/common/utils/formatNumber";
import { safeParseNumber } from "~/common/utils/parseNumber";
import { randomNumber } from "~/common/utils/randomNumber";
import { prisma } from "~/prisma";
import { WorkType, coolDowns, workCommandUses } from "./lib/workConfig";

const gamblePayloadContext = z.object({
  result: z.number(),
  outcomeLayout: z.array(z.number()),
  bet: z.number(),
  index: z.number(),
});

const colors = [
  ["🔵", "🟦"],
  ["🔴"],
  ["🟢"],
  ["🟡", "🟨", "💛"],
  ["🟦", "💙"],
  ["🟧", "🧡"],
  ["🟪", "💜"],
  ["🟩", "💚"],
  ["🟠"],
  ["🟥"],
  ["🟠"],
  ["🟣"],
];

export const gamble = {
  data: new SlashCommandBuilder()
    .setName("gamble")
    .setDescription("Gamble your money away")
    .addStringOption((option) =>
      option
        .setName("stake")
        .setDescription("Amount of money to gamble")
        .setRequired(true),
    ),
  async execute(interaction: Interaction) {
    if (!interaction.isRepliable() || !interaction.isChatInputCommand()) {
      return;
    }

    const guildId = interaction.guild?.id;

    if (!guildId) {
      return await interaction.reply(
        "This command can only be used in a server.",
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

    const wallet = await createWallet(interaction.user.id, guildId);

    const parseBet = z
      .preprocess(
        safeParseNumber,
        z
          .number()
          .int()
          .transform((v) => (v === 0 ? wallet.balance : v)),
      )
      .safeParse(interaction.options.getString("stake"));

    if (!parseBet.success) {
      return await interaction.reply({
        content:
          "Invalid bet amount. Use positive integer for example `/gamble 50k`",
        ephemeral: true,
      });
    }

    const bet = parseBet.data;

    if (bet < 1_000) {
      return await interaction.reply({
        content: "Minimum bet is 1k",
        ephemeral: true,
      });
    }

    if (bet > 100_000) {
      return await interaction.reply({
        content: "Maximum bet is 100k",
        ephemeral: true,
      });
    }

    if (wallet.balance < bet) {
      return await interaction.reply({
        content: sprintf(
          "You don't have enough money in your wallet. Your balance is %s.",
          addCurrency()(formatNumber(wallet.balance)),
        ),
        ephemeral: true,
      });
    }

    const coolDown = coolDowns.GAMBLE;

    const lastUses = await prisma.work.findMany({
      where: {
        type: WorkType.Gamble,
        createdAt: {
          gte: new Date(Date.now() - coolDown),
        },
        userDiscordId: interaction.user.id,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: workCommandUses.GAMBLE,
    });

    if (lastUses.length >= workCommandUses.GAMBLE) {
      const lastUse = lastUses.at(-1);

      if (!lastUse) {
        return await interaction.reply({
          content: "Hmm, something went wrong. Please try again later.",
        });
      }

      return await interaction.reply({
        content: sprintf(
          "The casino has kicked you out for gambling too much. Come back <t:%s:R>",
          Math.floor((lastUse.createdAt.getTime() + coolDown) / 1000),
        ),
      });
    }

    await prisma.$transaction([
      prisma.work.create({
        data: {
          userDiscordId: interaction.user.id,
          guildDiscordId: guildId,
          type: WorkType.Gamble,
        },
      }),
      prisma.interaction.updateMany({
        where: {
          type: InteractionType.Gamble,
          userDiscordId: interaction.user.id,
          guildId,
        },
        data: {
          consumedAt: new Date(),
        },
      }),
      prisma.wallet.update({
        where: {
          id: wallet.id,
        },
        data: {
          balance: {
            decrement: bet,
          },
        },
      }),
    ]);

    const possibleOutcomes = [
      -2,
      -2,
      -1,
      0,
      0,
      1,
      2,
      2,
      3,
      Math.random() > 0.75
        ? randomNumber(6, 10)
        : Math.random() > 0.98
          ? randomNumber(50, 100)
          : randomNumber(5, 8),
    ];

    const outcomeLayout = shuffle(possibleOutcomes);

    const gambleInteractions = await prisma.$transaction(
      outcomeLayout.map((result, index) =>
        prisma.interaction.create({
          data: {
            type: InteractionType.Gamble,
            userDiscordId: interaction.user.id,
            guildId,
            payload: JSON.stringify({
              result,
              outcomeLayout,
              index,
              bet,
            } satisfies z.infer<typeof gamblePayloadContext>),
          },
          select: {
            id: true,
          },
        }),
      ),
    );

    const buttons: ButtonBuilder[] = [];

    for (const [i, gambleInteraction] of gambleInteractions.entries()) {
      const emojis = colors[i] ?? [];
      const colorIdx = randomNumber(0, emojis.length - 1);
      const color = z.string().safeParse(emojis[colorIdx]);

      if (!color.success) {
        return await interaction.reply({
          content: "An error occurred. Please try again later.",
        });
      }

      buttons.push(
        new ButtonBuilder()
          .setStyle(ButtonStyle.Secondary)
          .setEmoji(color.data)
          .setCustomId(gambleInteraction.id),
      );
    }

    const embed = new EmbedBuilder()
      .setTitle("Gamble")
      .setColor(Colors.Info)
      .setDescription(
        sprintf(
          "Your stake is **%s**. Choose a button",
          addCurrency()(formatNumber(bet)),
        ),
      );

    const components = R.pipe(
      buttons,
      R.chunk(5),
      R.map((row) =>
        new ActionRowBuilder<ButtonBuilder>().addComponents(...row),
      ),
    );

    return await interaction.reply({
      embeds: [embed],
      components,
    });
  },
} satisfies Command;

export async function gambleInteractionButton(
  interactionContext: InteractionContext,
  interaction: AnyInteraction,
) {
  if (!interaction.isButton()) {
    return await interaction.reply({
      ephemeral: true,
      content: "This interaction can only be used as a button.",
    });
  }

  const guildId = interactionContext.guildId;

  if (!guildId) {
    return await interaction.reply(
      "This command can only be used in a server.",
    );
  }

  if (interactionContext.guildId !== guildId) {
    return await interaction.reply({
      ephemeral: true,
      content: "Wrong guild.",
    });
  }

  if (interaction.user.id !== interactionContext.userDiscordId) {
    return await interaction.reply(
      notYourInteraction(interactionContext, interaction),
    );
  }

  if (interactionContext.consumedAt) {
    return await interaction.reply({
      ephemeral: true,
      content:
        "Sorry, this interaction is no longer available, try running the command anew.",
    });
  }

  await prisma.interaction.updateMany({
    where: {
      type: InteractionType.Gamble,
      userDiscordId: interactionContext.userDiscordId,
      guildId: interactionContext.guildId,
    },
    data: {
      consumedAt: new Date(),
    },
  });

  const context = gamblePayloadContext.safeParse(
    JSON.parse(interactionContext.payload ?? "{}"),
  );

  if (!context.success) {
    return await interaction.reply({
      ephemeral: true,
      content: "An error occurred. Please try again later.",
    });
  }

  const { result, outcomeLayout, bet, index } = context.data;

  const buttons: ButtonBuilder[] = [];

  for (const [i, outcome] of outcomeLayout.entries()) {
    buttons.push(
      new ButtonBuilder()
        .setLabel(addCurrency()(formatNumber(outcome * bet)))
        .setStyle(index === i ? ButtonStyle.Primary : ButtonStyle.Secondary)
        .setCustomId(`noop${i}`)
        .setDisabled(true),
    );
  }

  const embed = new EmbedBuilder()
    .setTitle("Gamble")
    .setColor(result >= 1 ? Colors.Success : Colors.Error)
    .setDescription(
      sprintf(
        "You bet **%s** %s **%s**",
        addCurrency()(formatNumber(bet)),
        result >= 1 ? "and won" : result === 0 ? "and got" : "and lost",
        addCurrency()(formatNumber(Math.abs(result * bet))),
      ),
    );

  const components = R.pipe(
    buttons,
    R.chunk(5),
    R.map((row) => new ActionRowBuilder<ButtonBuilder>().addComponents(...row)),
  );

  await prisma.wallet.update({
    where: {
      userDiscordId_guildId: {
        userDiscordId: interactionContext.userDiscordId,
        guildId,
      },
    },
    data: {
      balance: {
        increment: Math.floor(result * bet),
      },
    },
  });

  return await interaction.update({
    embeds: [embed],
    components,
  });
}
