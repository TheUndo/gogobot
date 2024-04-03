import { URL } from "node:url";
import * as cheerio from "cheerio";
import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
  EmbedBuilder,
} from "discord.js";
import { z } from "zod";
import { client } from "../common/client";
import { Colors, NewsCategory } from "../common/types";
import { env } from "../env";
import { prisma } from "../prisma";

const newsDomain = env.NEWS_DOMAIN;

const categories: Record<NewsCategory, URL> = {
  [NewsCategory.Announcement]: new URL("/news/announcement", newsDomain),
  [NewsCategory.Trailer]: new URL("/news/trailers", newsDomain),
  [NewsCategory.News]: new URL("/news.html", newsDomain),
  [NewsCategory.WhatToWatch]: new URL("/news/what-to-watch", newsDomain),
  [NewsCategory.Reviews]: new URL("/news/reviews", newsDomain),
};

const colors: Record<NewsCategory, number> = {
  [NewsCategory.Announcement]: 0xf23f3f,
  [NewsCategory.Trailer]: 0xb03ff2,
  [NewsCategory.News]: Colors.Info,
  [NewsCategory.WhatToWatch]: 0xeb943d,
  [NewsCategory.Reviews]: 0x60d17e,
};

const categoryLabels: Record<NewsCategory, string> = {
  [NewsCategory.Announcement]: "Announcements",
  [NewsCategory.Trailer]: "Trailers",
  [NewsCategory.News]: "News",
  [NewsCategory.WhatToWatch]: "What to Watch",
  [NewsCategory.Reviews]: "Reviews",
};

for (const [rawType, url] of Object.entries(categories)) {
  const type = z.nativeEnum(NewsCategory).parse(rawType);
  const response = await fetch(url.toString()).then((r) => r.text());
  const $ = cheerio.load(response);

  const news: {
    title: string;
    slug: string;
    cover: string;
  }[] = [];

  $("ul > li.news-items").each(function () {
    const item = $(this);
    const href = item.find("a").attr("href");
    const slug = new URL(z.string().parse(href), newsDomain).pathname;
    const title = item.find("h4").text().trim();
    const cover = z.string().parse(item.find("img").attr("data-original"));
    news.push({ title, slug, cover });
  });

  for (const { slug, cover, title } of news) {
    console.log(`Scraping ${type} ${slug}`);
    const createdAt = new Date();
    const result = await prisma.news.upsert({
      where: {
        slug,
      },
      update: {
        cover,
        title,
      },
      create: {
        cover,
        title,
        slug,
        type,
        createdAt,
      },
    });

    if (result.createdAt.toString() === createdAt.toString()) {
      await client.channels
        .fetch(env.DISCORD_NEWS_CHANNEL_ID)
        .then((channel) => {
          if (
            !channel ||
            (ChannelType.GuildAnnouncement !== channel.type &&
              ChannelType.GuildText !== channel.type)
          ) {
            throw `Could not find channel with id ${channel}`;
          }

          const articleUrl = new URL(slug, newsDomain).toString();

          const message = channel.send({
            embeds: [
              new EmbedBuilder()
                .setTitle(title)
                .setImage(cover)
                .setColor(colors[type])
                .setTimestamp()
                .setURL(articleUrl)
                .setFooter({
                  text: `Category: ${categoryLabels[type]}`,
                }),
            ],
            components: [
              new ActionRowBuilder<ButtonBuilder>().setComponents(
                new ButtonBuilder()
                  .setLabel("Read Article")
                  .setStyle(ButtonStyle.Link)
                  .setURL(articleUrl),
                new ButtonBuilder()
                  .setStyle(ButtonStyle.Link)
                  .setLabel(categoryLabels[type])
                  .setURL(url.toString()),
              ),
            ],
          });

          message.then((message) => {
            message.crosspost().catch(() => null);
          });

          return message;
        });
    }
  }
}

console.log("Done. Idle.");
