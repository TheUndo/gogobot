import { prisma } from "../prisma";
import { scrapeAnime, scrapeAnimePage } from "./utils";

let page = 1;
while (true) {
  const anime = await scrapeAnimePage(page);

  if (!anime.length) {
    console.log("done");
    break;
  }

  for (const item of anime) {
    const reference = await prisma.anime.findUnique({
      where: {
        slug: item.slug,
      },
      select: {
        status: true,
        id: true,
      },
    });

    if (reference?.status === item.status) {
      console.log(`Skipping ${item.slug} because it's already up to date.`);
      continue;
    }

    await scrapeAnime(item.slug);
    console.log(`Scraped ${item.slug} page ${page}`);
  }

  page++;
}

console.log("Done. Idle.");

setInterval(() => {}, 1 << 30);
