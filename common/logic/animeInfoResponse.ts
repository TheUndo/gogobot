import {
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle,
	EmbedBuilder,
	type InteractionReplyOptions,
} from "discord.js";
import { noAnimeFound } from "../../interactions/commands/utils/queryResponses";
import { prisma } from "../../prisma";
import { domain } from "../../scraper/utils";
import { ButtonAction, Colors, type ButtonActionFormat } from "../types";

export async function animeInfoResponse(animeId: number) {
	const anime = await prisma.anime.findUnique({
		where: {
			id: animeId,
		},
		include: {
			names: true,
			genres: true,
		},
	});

	if (!anime) {
		return {
			ephemeral: true,
			embeds: [noAnimeFound(animeId.toString())],
		};
	}

	const embed = new EmbedBuilder()
		.setTitle(anime.nameDisplay)
		.setDescription(anime.description)
		.setImage(anime.cover)
		.setColor(Colors.Accent)
		.addFields([
			{
				name: "Language",
				value: anime.language,
				inline: true,
			},
			{
				name: "Status",
				value: anime.status,
				inline: true,
			},
			{
				name: "Type",
				value: anime.type,
				inline: true,
			},
			{
				name: "Release year",
				value: anime.year.toString(),
				inline: true,
			},
			{
				name: "Other names",
				value: anime.names.map((n) => n.name).join(", "),
				inline: true,
			},
			{
				name: "Genres",
				value: anime.genres
					.map(
						(g) => `[${g.genre}](${new URL(g.slug, `https://${domain.host}`)})`,
					)
					.join(", "),
			},
		]);

	const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
		new ButtonBuilder()
			.setLabel("Subscribe")
			.setStyle(ButtonStyle.Primary)
			.setEmoji("🔔")
			.setCustomId(
				`${ButtonAction.Subscribe}+${anime.id}` satisfies ButtonActionFormat,
			),
		new ButtonBuilder()
			.setLabel("Gogoanime")
			.setURL(new URL(anime.slug, `https://${domain.host}`).toString())
			.setStyle(ButtonStyle.Link),
	);

	return {
		embeds: [embed],
		components: [row],
	} satisfies InteractionReplyOptions;
}
