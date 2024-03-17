import type { CacheType, StringSelectMenuInteraction } from "discord.js";
import { prisma } from "../../prisma";
import { createSubscription } from "../../common/logic/subscribe";
import { unsubscribeAction } from "../../common/logic/unsubscribe";

export async function unsubscribe(
	interaction: StringSelectMenuInteraction<CacheType>,
) {
	const [id] = interaction.values;

	if (typeof id !== "string") {
		return await interaction.reply({
			content: `Invalid anime id "${id}"`,
			ephemeral: true,
		});
	}

	const animeId = Number.parseInt(id);

	if (Number.isNaN(animeId)) {
		return await interaction.reply({
			content: `Invalid anime id "${id}"`,
			ephemeral: true,
		});
	}

	const anime = await prisma.anime.findUnique({
		where: {
			id: animeId,
		},
	});

	if (!anime) {
		return await interaction.reply({
			content: `Could not find anime with id ${animeId}`,
			ephemeral: true,
		});
	}

	const response = await unsubscribeAction(anime.id, interaction.user.id);

	return await interaction.reply(response);
}
