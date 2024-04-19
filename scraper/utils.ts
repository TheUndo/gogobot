import fs from "node:fs/promises";
import * as cheerio from "cheerio";
import { Language } from "../common/types";
import { prisma } from "../prisma";
import { ongoingIndex } from "../search/fuse";
import { DebugLevel, debug, makeCodeBlock } from "./debug";

export const domain = await (async () => {
  const cache = await fs.readFile("domain.txt", "utf-8").catch(() => null);
  if (cache) {
    return cache;
  }
  return "https://anitaku.to";
})().then(async (domain) => {
  const response = await fetch(domain);
  const resolved = (() => {
    const url = new URL(response.url);
    return `https://${url.host}`;
  })();
  await fs.writeFile("domain.txt", resolved);
  return new URL(resolved);
});

export const apiDomain = await fetch(domain.toString())
  .then((d) => d.text())
  .then((d) => {
    const parsed = /ase_url_cdn_api\s*=\s*['"](.*)['"]/.exec(d)?.[1];

    if (!parsed) {
      throw new Error("Could not find the API domain");
    }

    return new URL(parsed);
  });

type Options<T> = {
  type: number;
  page: number;
  onNewEpisode?(episodeId: string): Promise<T>;
};

export async function scrapePage<T>({ type, page, onNewEpisode }: Options<T>) {
  const url = new URL(
    `/ajax/page-recent-release.html?page=${page}&type=${type}`,
    `https://${apiDomain.host}`,
  );

  const html = await fetch(url.toString()).then((r) => r.text());

  const $ = cheerio.load(html);

  const episodes: {
    slug: string;
    episode: number;
    animeName: string;
  }[] = [];

  $("ul li").each(function () {
    const slug = $(this).find("a").attr("href");
    const episode = Number.parseFloat(
      $(this)
        .find(".episode")
        .text()
        .trim()
        .replace(/[^\d.]/g, ""),
    );
    const animeName = $(this).find("a").attr("title");

    if (slug && episode != null && !Number.isNaN(episode) && animeName) {
      episodes.push({ slug, episode, animeName });
    }
  });

  for (const episode of episodes) {
    const referenceAnime = await (async () => {
      const reference = await prisma.anime.findFirst({
        where: {
          nameDisplay: episode.animeName,
        },
        select: {
          id: true,
        },
      });

      if (!reference) {
        console.log(`Could not find anime with name ${episode.animeName}`);

        console.log(`Scraping ${episode.slug} to find anime slug`);
        const slug = await scrapeEpisode(episode.slug);
        if (!slug) {
          await debug(
            DebugLevel.Error,
            makeCodeBlock(
              `Could not find anime slug for episode ${episode.slug}`,
            ),
          );
          return null;
        }
        console.log(`Scraping ${slug} to find anime`);
        const anime = await scrapeAnime(slug);
        console.log(`Scraped ${slug}`);

        return anime ?? null;
      }
      return reference;
    })();

    if (!referenceAnime) {
      console.error(`Could not find anime with name ${episode.animeName}`);
      await debug(
        DebugLevel.Error,
        makeCodeBlock(
          `Could not find anime with name ${episode.animeName} for episode ${episode.slug}`,
        ),
      );
      continue;
    }

    await prisma.anime.update({
      where: {
        id: referenceAnime.id,
      },
      data: {
        language: getLanguage(type),
      },
    });

    const existingEpisode = await prisma.animeEpisode.findUnique({
      where: {
        slug: episode.slug,
      },
    });

    const createdEpisode = await prisma.animeEpisode
      .upsert({
        where: {
          slug: episode.slug,
        },
        update: {
          episode: episode.episode,
          anime: {
            connect: {
              id: referenceAnime.id,
            },
          },
        },
        create: {
          episode: episode.episode,
          anime: {
            connect: {
              id: referenceAnime.id,
            },
          },
          slug: episode.slug,
        },
      })
      .catch(() => {
        console.error(`Failed to add episode ${episode.slug}`);
      });

    if (!existingEpisode && createdEpisode) {
      await onNewEpisode?.(createdEpisode.id);
    }

    console.log(`Scraped ${episode.slug} page ${page}`);
  }
}

async function scrapeEpisode(slug: string) {
  const html = await fetch(
    new URL(slug, `https://${domain.host}`).toString(),
  ).then((r) => r.text());

  const $ = cheerio.load(html);

  const animeSlug = $(".anime-info a").attr("href");

  return animeSlug;
}

//await scrapeAnimePage(1);
export async function scrapeAnimePage(page: number) {
  const url = new URL(
    `/anime-list.html?page=${page}`,
    `https://${domain.host}`,
  );

  const response = await fetch(url.toString()).then((r) => r.text());

  const $ = cheerio.load(response);

  const anime: {
    slug: string;
    status: string;
  }[] = [];

  $(".listing li[title]").each(function () {
    const title = $(this).attr("title");
    const _nameDisplay = $(title).find("a.bigChar").first().text().trim();

    const types = (() => {
      const types: [string, string][] = [];

      $(title)
        .find(".type,.sumer")
        .each(function () {
          const type = $(this).find("span").text().trim();

          if (type) {
            const value = $(this).text().replace(type, "").trim();
            types.push([type.replace(":", "").trim(), value]);
          }
        });

      return new Map(types);
    })();

    const status = types.get("Status");
    const slug = $(this).find("a").attr("href");

    if (status && slug) {
      anime.push({ slug, status });
    }
  });

  return anime;
}

export function getLanguage(type: number): Language {
  switch (type) {
    case 1:
      return Language.Subbed;
    case 2:
      return Language.Dubbed;
    case 3:
      return Language.Chinese;
    default:
      throw new Error("Invalid type");
  }
}

export async function scrapeAnime(slug: string) {
  const url = new URL(slug, `https://${domain.host}`);

  const html = await fetch(url.toString()).then((r) => r.text());

  const $ = cheerio.load(html);

  const genres = ((t) => {
    const genres: {
      name: string;
      slug: string;
    }[] = [];

    $(t)
      .find("a")
      .each(function () {
        const slug = $(this)
          .attr("href")
          ?.replace(/https?:\/\/.*?\//, "/");
        const name = $(this).text().trim().replace(/^,\s*/, "");

        if (slug && name && slug.includes("/genre/")) {
          genres.push({ slug, name });
        }
      });

    return genres;
  })($(".anime_info_body"));

  const types = (() => {
    const types: [string, string][] = [];

    $(".type,.sumer").each(function () {
      const type = $(this).find("span").text().trim();

      if (type) {
        const value = $(this).text().replace(type, "").trim();
        types.push([type.replace(":", "").trim(), value]);
      }
    });

    return new Map(types);
  })();

  const nameDisplay = $("h1").text().trim();
  const type = types.get("Type")?.trim();
  const status = types.get("Status")?.trim();
  const year = Number.parseInt(types.get("Released") ?? "");
  const description = $(".description").text().trim();
  const otherNames = types
    .get("Other name")
    ?.split(/\n/g)
    .map((v) => v.trim())
    .filter((v) => Boolean(v));
  const cover = $(".anime_info_body_bg img").attr("src");

  if (type && status && cover) {
    const anime = await prisma.anime
      .upsert({
        where: {
          slug,
        },
        update: {
          type,
          status,
          year,
          description,
          nameDisplay,
          cover,
        },
        create: {
          type,
          status,
          year,
          description,
          nameDisplay,
          cover,
          slug,
          language: nameDisplay.includes("(Dub)")
            ? getLanguage(2)
            : getLanguage(1),
        },
      })
      .catch(() => {
        console.error(`Failed to add anime ${slug}`);
      });

    if (!anime) {
      return;
    }

    if (anime.status === "Ongoing" || anime.status === "Upcoming") {
      (await ongoingIndex).add({
        id: anime.id,
        title: anime.nameDisplay,
        names: otherNames ?? [],
      });
    }

    for (const genre of genres) {
      await prisma.animeGenre
        .upsert({
          where: {
            slug: genre.slug,
          },
          update: {
            anime: {
              connect: {
                id: anime.id,
              },
            },
          },
          create: {
            anime: {
              connect: {
                id: anime.id,
              },
            },
            genre: genre.name,
            slug: genre.slug,
          },
        })
        .catch(() => {
          console.error(
            `Failed to add genre ${genre.name} to anime ${anime.slug}`,
          );
        });
    }

    for (const name of otherNames ?? []) {
      await prisma.animeName.create({
        data: {
          anime: {
            connect: {
              id: anime.id,
            },
          },
          name,
        },
      });
    }

    return anime;
  }
}
