import {
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle,
	EmbedBuilder,
	type ActionRowData,
	type MessageActionRowComponentData,
	type MessageActionRowComponentBuilder,
} from "discord.js";
import { ButtonAction, Colors, type ButtonActionFormat } from "../types";
import { prisma } from "../../prisma";
import { domain } from "../../scraper/utils";

/**
 * Causes db side effects db creation, checks for existing subscription
 * @returns Message payload - use as interaction.reply or .send
 * */
export async function createSubscription(animeId: number, userId: string) {
	const checkSubscription = await prisma.animeSubscription.findFirst({
		where: {
			animeId,
			userDiscordId: userId,
		},
		select: {
			anime: {
				select: {
					nameDisplay: true,
					slug: true,
				},
			},
		},
	});

	const unsubscribe = new ButtonBuilder()
		.setCustomId(
			`${ButtonAction.Unsubscribe}+${animeId}` satisfies ButtonActionFormat,
		)
		.setLabel("Unsubscribe")
		.setStyle(ButtonStyle.Secondary);

	const info = (slug: string) =>
		new ButtonBuilder()
			.setLabel("Anime Info")
			.setURL(new URL(slug, `https://${domain.host}`).toString())
			.setStyle(ButtonStyle.Link);

	const embed = new EmbedBuilder();

	if (checkSubscription) {
		return {
			embeds: [
				embed
					.setTitle("Already subscribed")
					.setDescription(
						`You are already subscribed to **${checkSubscription.anime.nameDisplay}**.`,
					)
					.setColor(Colors.Warning),
			],
			components: [
				new ActionRowBuilder().addComponents(
					unsubscribe,
					info(checkSubscription.anime.slug),
				) as unknown as ActionRowData<
					MessageActionRowComponentData | MessageActionRowComponentBuilder
				>,
			],
		};
	}

	const subscription = await prisma.animeSubscription.create({
		data: {
			animeId,
			userDiscordId: userId,
		},
		select: {
			anime: {
				select: {
					nameDisplay: true,
				},
			},
		},
	});

	return {
		embeds: [
			new EmbedBuilder()
				.setTitle("✅ Subscribed")
				.setDescription(
					`You are now subscribed to **${subscription.anime.nameDisplay}**. I will notify you when a new episode is released.`,
				)
				.setColor(Colors.Success),
		],
		components: [
			new ActionRowBuilder().addComponents(
				unsubscribe,
			) as unknown as ActionRowData<
				MessageActionRowComponentData | MessageActionRowComponentBuilder
			>,
		],
	};
}
