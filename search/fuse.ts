import Fuse from "fuse.js";
import { prisma } from "../prisma";

const ongoingAnime = await prisma.anime
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

const allAnime = await prisma.anime
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

export const ongoingIndex = new Fuse(ongoingAnime, {
	keys: ["title", "names"],
});

export const animeIndex = new Fuse(allAnime, {
	keys: ["title", "names"],
});
