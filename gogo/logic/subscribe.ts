import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
} from "discord.js";
import { prisma } from "../../core/db/prisma";
import { domain } from "../scraper/utils";
import { client } from "../../bot/client";
import { activeGuildId } from "../../bot/routers/userJoin";
import { ButtonAction, type ButtonActionFormat, Colors } from "../../bot/types";

/**
 * Causes db side effects db creation, checks for existing subscription
 * @returns Message payload - use as interaction.reply or .send
 * */
export async function createSubscription(animeId: number, userId: string) {
  const checkSubscription = await prisma.animeSubscription.findFirst({
    where: {
      animeId,
      userDiscordId: userId,
    },
    select: {
      anime: {
        select: {
          nameDisplay: true,
          slug: true,
        },
      },
    },
  });

  const unsubscribe = new ButtonBuilder()
    .setCustomId(
      `${ButtonAction.Unsubscribe}+${animeId}` satisfies ButtonActionFormat,
    )
    .setLabel("Unsubscribe")
    .setStyle(ButtonStyle.Secondary);

  const info = (slug: string) =>
    new ButtonBuilder()
      .setLabel("Anime Info")
      .setURL(new URL(slug, `https://${domain.host}`).toString())
      .setStyle(ButtonStyle.Link);

  const embed = new EmbedBuilder();

  if (checkSubscription) {
    return {
      embeds: [
        embed
          .setTitle("Already subscribed")
          .setDescription(
            `You are already subscribed to **${checkSubscription.anime.nameDisplay}**.`,
          )
          .setColor(Colors.Warning),
      ],
      components: [
        new ActionRowBuilder<ButtonBuilder>().addComponents(
          unsubscribe,
          info(checkSubscription.anime.slug),
        ),
      ],
    };
  }

  const subscription = await prisma.animeSubscription.create({
    data: {
      animeId,
      userDiscordId: userId,
    },
    select: {
      anime: {
        select: {
          nameDisplay: true,
        },
      },
    },
  });

  const checkMember = await client.guilds
    .fetch(activeGuildId)
    .then((d) => d.members.fetch(userId))
    .catch(() => null);

  if (!checkMember) {
    return {
      content: "discord.gg/gogo",
      embeds: [
        new EmbedBuilder()
          .setTitle("You're not in the Gogoanime server")
          .setDescription(
            `You have been subscribed to **${subscription.anime.nameDisplay}**. __However__, since you are not a member of the Gogoanime Discord server I am unable to notify you. Please join the server to receive notifications (as soon as you join notifications will start working).`,
          )
          .setColor(Colors.Error),
      ],
    };
  }

  return {
    embeds: [
      new EmbedBuilder()
        .setTitle("✅ Subscribed")
        .setDescription(
          `You are now subscribed to **${subscription.anime.nameDisplay}**. I will notify you when a new episode is released. Make sure I can DM you (settings)!`,
        )
        .setColor(Colors.Success),
    ],
    components: [
      new ActionRowBuilder<ButtonBuilder>().addComponents(unsubscribe),
    ],
  };
}
