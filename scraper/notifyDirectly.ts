import { ActionRowBuilder, ButtonBuilder, ButtonStyle } from "discord.js";
import { prisma } from "../prisma";
import { ButtonAction, type ButtonActionFormat } from "../common/types";
import { client } from "../common/client";
import { DebugLevel, debug, makeCodeBlock } from "./debug";
import { domain } from "./utils";

export async function notifyDirectly(episodeId: string) {
  const episode = await prisma.animeEpisode.findUnique({
    where: {
      id: episodeId,
    },
    select: {
      episode: true,
      slug: true,
      anime: {
        select: {
          id: true,
          nameDisplay: true,
          subscriptions: {
            select: {
              userDiscordId: true,
            },
          },
        },
      },
    },
  });

  if (!episode) {
    throw new Error(`Could not find episode with id ${episodeId}`);
  }

  const content = `Episode ${episode.episode} of ${episode.anime.nameDisplay} has been released!`;
  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setURL(`${new URL(episode.slug, `https://${domain.host}`).toString()}`)
      .setStyle(ButtonStyle.Link)
      .setLabel("Watch Episode"),
    new ButtonBuilder()
      .setCustomId(
        `${ButtonAction.Unsubscribe}+${episode.anime.id}` satisfies ButtonActionFormat,
      )
      .setLabel("Unsubscribe")
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId(
        `${
          ButtonAction.SubscriptionListChangePage
        }+${1}` satisfies ButtonActionFormat,
      )
      .setLabel("Manage subscriptions")
      .setStyle(ButtonStyle.Secondary),
  );

  const stats: {
    userNotFound: number;
    unableToMessageUser: number;
    success: number;
  } = {
    userNotFound: 0,
    unableToMessageUser: 0,
    success: 0,
  };

  for (const subscription of episode.anime.subscriptions) {
    const user = await client.users.fetch(subscription.userDiscordId);

    if (user) {
      try {
        await user.send({
          content,
          components: [row],
        });
        stats.success++;
      } catch (e) {
        console.log(e);
        stats.unableToMessageUser++;
      }
    } else {
      stats.userNotFound++;
    }
  }

  await debug(
    DebugLevel.Info,
    makeCodeBlock(
      `${episode.anime.nameDisplay}: ${JSON.stringify(stats, null, 2)}`,
      "json",
    ),
  );
}
