import {
  EmbedBuilder,
  type Interaction,
  SlashCommandBuilder,
} from "discord.js";
import { Colors, type Command } from "../../types";
import { env } from "../../../core/misc/env";
import { prisma } from "../../../core/db/prisma";
import { makeCodeBlock } from "../../../gogo/scraper/debug";

export const stats = {
  data: new SlashCommandBuilder()
    .setName("stats")
    .setDescription("Shows statistics"),
  async execute(interaction: Interaction) {
    if (!interaction.isRepliable()) {
      return;
    }

    if (interaction.user.id !== env.OWNER_DISCORD_ID) {
      await interaction.reply({
        content: "Sorry, this command is only available to the bot owner.",
      });
    }

    const [subscriptions, anime, genres, names, episodes, newsCount] =
      await prisma.$transaction([
        prisma.animeSubscription.count(),
        prisma.anime.count(),
        prisma.animeGenre.count(),
        prisma.animeName.count(),
        prisma.animeEpisode.count(),
        prisma.news.count(),
      ]);

    const subscriberCount = await prisma.animeSubscription
      .groupBy({
        by: ["userDiscordId"],
      })
      .then((d) => d.length);

    await interaction.reply({
      ephemeral: true,
      embeds: [
        new EmbedBuilder()
          .setTitle("Statistics")
          .setDescription(
            makeCodeBlock(
              JSON.stringify(
                {
                  subscriptions,
                  anime,
                  genres,
                  names,
                  episodes,
                  subscriberCount,
                  newsCount,
                  subscriptionsPerSubscriber: subscriptions / subscriberCount,
                },
                null,
                2,
              ),
              "json",
            ),
          )
          .setColor(Colors.Info),
      ],
    });
  },
  private: true,
} satisfies Command;
