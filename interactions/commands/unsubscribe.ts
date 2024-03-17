import { SlashCommandBuilder, type Interaction } from "discord.js";
import { type Command, ModalAction } from "../../common/types";
import { animeDialog } from "./utils/animeDialog";
import { unsubscribeFromQuery } from "../../common/logic/unsubscribeFromQuery";

export const unsubscribe = {
	data: new SlashCommandBuilder()
		.setName("unsubscribe")
		.setDescription("Unsubscribe to an anime and stop receiving notifications")
		.addStringOption((option) =>
			option.setName("anime").setDescription("Anime Name, URL or ID"),
		),
	async execute(interaction: Interaction) {
		if (!interaction.isRepliable() || !interaction.isChatInputCommand()) {
			return;
		}

		const query = interaction.options.getString("anime");

		if (!query) {
			return await interaction.showModal(
				animeDialog
					.setCustomId(ModalAction.Unsubscribe)
					.setTitle("Unsubscribe to Anime"),
			);
		}

		return await unsubscribeFromQuery(interaction, query);
	},
} satisfies Command;
