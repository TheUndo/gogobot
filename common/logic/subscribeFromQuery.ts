import {
	StringSelectMenuBuilder,
	StringSelectMenuOptionBuilder,
	ActionRowBuilder,
	type CacheType,
	type ChatInputCommandInteraction,
	type ModalSubmitInteraction,
} from "discord.js";
import { findAnimeFromQuery } from "../../interactions/commands/utils/findAnimeFromQuery";
import {
	multipleAnimeFound,
	noAnimeFound,
} from "../../interactions/commands/utils/queryResponses";
import { SelectAction } from "../types";
import { ongoingIndex } from "../../search/fuse";
import { createSubscription } from "./subscribe";

/** Flow to search for anime from query, can be invoked by command or deferred by modal */
export async function subscribeFromQuery(
	interaction:
		| ChatInputCommandInteraction<CacheType>
		| ModalSubmitInteraction<CacheType>,
	query: string,
) {
	const animeFromUrlOrId = await findAnimeFromQuery(query);

	if (animeFromUrlOrId) {
		const response = await createSubscription(
			animeFromUrlOrId.id,
			interaction.user.id,
		);

		return await interaction.reply(response);
	}

	const search = ongoingIndex.search(query, {
		limit: 25,
	});

	if (!search.length) {
		return await interaction.reply({
			ephemeral: true,
			embeds: [noAnimeFound(query)],
		});
	}

	const firstAnime = search[0]?.item;

	if (search.length === 1 && firstAnime) {
		const response = await createSubscription(
			firstAnime.id,
			interaction.user.id,
		);

		return await interaction.reply(response);
	}

	const select = new StringSelectMenuBuilder()
		.setCustomId(SelectAction.Subscribe)
		.setPlaceholder("Choose Anime");

	for (const anime of search) {
		select.addOptions(
			new StringSelectMenuOptionBuilder()
				.setLabel(anime.item.title)
				.setValue(anime.item.id.toString()),
		);
	}

	await interaction.reply({
		ephemeral: true,
		embeds: [multipleAnimeFound(query, "subscribe")],
		components: [
			new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(select),
		],
	});
}
