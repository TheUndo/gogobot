import { prisma } from "../../../prisma";

/** does not search, only checks for perfect matches */
export async function findAnimeFromQuery(query: string) {
	const id = query ? Number.parseInt(query) : Number.NaN;
	const checkAnimeOrName = !Number.isNaN(id)
		? await prisma.anime.findUnique({
				where: {
					id,
				},
		  })
		: await prisma.anime.findFirst({
				where: {
					nameDisplay: query.trim(),
				},
		  });

	if (checkAnimeOrName) {
		return checkAnimeOrName;
	}

	try {
		const { pathname } = new URL(query);

		const checkAnime = await prisma.anime.findFirst({
			where: {
				slug: pathname,
			},
		});

		if (checkAnime) {
			return checkAnime;
		}

		const episode = await prisma.animeEpisode.findFirst({
			where: {
				slug: pathname,
			},
			include: {
				anime: true,
			},
		});

		if (episode) {
			return episode.anime;
		}

		return null;
	} catch {
		return null;
	}
}
