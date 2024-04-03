import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
  EmbedBuilder,
} from "discord.js";
import { z } from "zod";
import { client } from "../common/client";
import { ButtonAction, Colors, Language } from "../common/types";
import { env } from "../env";
import { prisma } from "../prisma";
import { notifyDirectly } from "./notifyDirectly";
import { domain } from "./utils";

const channels: Record<Language, string> = {
  Subbed: env.DISCORD_SUBBED_CHANNEL_ID,
  Dubbed: env.DISCORD_DUBBED_CHANNEL_ID,
  Chinese: env.DISCORD_CHINESE_CHANNEL_ID,
};

export async function announceEpisode(episodeId: string) {
  const episode = await prisma.animeEpisode.findUnique({
    where: {
      id: episodeId,
    },
    include: {
      anime: true,
    },
  });

  if (!episode) {
    throw new Error(`Could not find episode with id ${episodeId}`);
  }

  const channel =
    channels[z.nativeEnum(Language).parse(episode.anime.language)];

  await new Promise((r, reject) => {
    client.channels.fetch(channel).then(async (channel) => {
      if (
        !channel ||
        (ChannelType.GuildAnnouncement !== channel.type &&
          ChannelType.GuildText !== channel.type)
      ) {
        return reject(`Could not find channel with id ${channel}`);
      }

      const main = new EmbedBuilder()
        .setColor(Colors.Accent)
        .setTitle(`${episode.anime.nameDisplay} Episode ${episode.episode}`)
        .setDescription(
          `A new episode of **${episode.anime.nameDisplay}** is out!`,
        )
        .setThumbnail(episode.anime.cover)
        .setTimestamp();

      const subscribe = new ButtonBuilder()
        .setCustomId(`${ButtonAction.Subscribe}+${episode.anime.id}`)
        .setLabel("Subscribe")
        .setStyle(ButtonStyle.Primary)
        .setEmoji("🔔");

      const watch = new ButtonBuilder()
        .setLabel("Watch Episode")
        .setURL(new URL(episode.slug, `https://${domain.host}`).toString())
        .setStyle(ButtonStyle.Link)
        .setEmoji("▶️");

      const anime = new ButtonBuilder()
        .setLabel("Anime Info")
        .setURL(
          new URL(episode.anime.slug, `https://${domain.host}`).toString(),
        )
        .setStyle(ButtonStyle.Link);

      const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
        subscribe,
        watch,
        anime,
      );

      const message = await channel.send({
        embeds: [main],
        components: [row],
      });
      console.log("Crossposting");
      message
        .crosspost()
        .catch(() => null)
        .then(() => {
          console.log("Crossposted");
        });
      r(undefined);
    });
  }).catch(console.error);

  console.log("Episode announced");
  await notifyDirectly(episode.id);
  console.log("Everyone notified");
}
