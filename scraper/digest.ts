import { prisma } from "../prisma";
import { DebugLevel, debug, makeCodeBlock } from "./debug";

const [subscriptions, anime, genres, names, episodes] =
  await prisma.$transaction([
    prisma.animeSubscription.count(),
    prisma.anime.count(),
    prisma.animeGenre.count(),
    prisma.animeName.count(),
    prisma.animeEpisode.count(),
  ]);

await debug(
  DebugLevel.Info,
  makeCodeBlock(
    JSON.stringify(
      {
        subscriptions,
        anime,
        genres,
        names,
        episodes,
      },
      null,
      2,
    ),
    "json",
  ),
);

console.log("Done. Idle.");

setInterval(() => {}, 1 << 30);
