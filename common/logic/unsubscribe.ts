import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
} from "discord.js";
import { ButtonAction, Colors, type ButtonActionFormat } from "../types";
import { prisma } from "../../prisma";
import { domain } from "../../scraper/utils";

/**
 * Causes db side effects db creation, checks for existing subscription
 * @returns Message payload - use as interaction.reply or .send
 * */
export async function unsubscribeAction(animeId: number, userId: string) {
  const checkSubscription = await prisma.animeSubscription.findFirst({
    where: {
      animeId,
      userDiscordId: userId,
    },
    select: {
      id: true,
    },
  });

  const checkAnime = await prisma.anime.findUnique({
    where: {
      id: animeId,
    },
  });

  if (!checkAnime) {
    return {
      embeds: [
        new EmbedBuilder()
          .setTitle("Not found")
          .setDescription(`Could not find anime with id **${animeId}**.`)
          .setColor(Colors.Error),
      ],
    };
  }

  const subscribe = new ButtonBuilder()
    .setCustomId(
      `${ButtonAction.Subscribe}+${animeId}` satisfies ButtonActionFormat,
    )
    .setLabel("Re-subscribe")
    .setStyle(ButtonStyle.Secondary);

  const embed = new EmbedBuilder();

  if (!checkSubscription) {
    return {
      embeds: [
        embed
          .setTitle("Not subscribed")
          .setDescription(
            `You are not subscribed to **${checkAnime.nameDisplay}**.`,
          )
          .setColor(Colors.Warning),
      ],
      components: [
        new ActionRowBuilder<ButtonBuilder>().addComponents(
          subscribe.setLabel("Subscribe"),
        ),
      ],
    };
  }

  await prisma.animeSubscription.delete({
    where: {
      id: checkSubscription.id,
    },
  });

  return {
    embeds: [
      new EmbedBuilder()
        .setTitle("Unsubscribed")
        .setDescription(
          `You have unsubscribed from **${checkAnime.nameDisplay}**. I will no longer notify you about new episodes.`,
        )
        .setColor(Colors.Info),
    ],
    components: [
      new ActionRowBuilder<ButtonBuilder>().addComponents(subscribe),
    ],
  };
}
