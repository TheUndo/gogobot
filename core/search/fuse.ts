import Fuse from "fuse.js";
import { prisma } from "../db/prisma";

const ongoingAnime = prisma.anime
  .findMany({
    where: {
      status: {
        in: ["Ongoing", "Upcoming"],
      },
    },
    select: {
      id: true,
      nameDisplay: true,
      names: {
        select: {
          name: true,
        },
      },
    },
  })
  .then((anime) =>
    anime.map((a) => {
      return {
        id: a.id,
        title: a.nameDisplay,
        names: a.names.map((n) => n.name),
      };
    }),
  );

const allAnime = prisma.anime
  .findMany({
    select: {
      id: true,
      nameDisplay: true,
      names: {
        select: {
          name: true,
        },
      },
    },
  })
  .then((anime) =>
    anime.map((a) => {
      return {
        id: a.id,
        title: a.nameDisplay,
        names: a.names.map((n) => n.name),
      };
    }),
  );

export const ongoingIndex = ongoingAnime.then(
  (ongoingAnime) =>
    new Fuse(ongoingAnime, {
      keys: ["title", "names"],
    }),
);

export const animeIndex = allAnime.then(
  (allAnime) =>
    new Fuse(allAnime, {
      keys: ["title", "names"],
    }),
);
