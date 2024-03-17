import type { CacheType, ModalSubmitInteraction } from "discord.js";
import { subscribeFromQuery } from "../../common/logic/subscribeFromQuery";

export async function subscribe(
	interaction: ModalSubmitInteraction<CacheType>,
) {
	const query = interaction.fields.getField("query").value;

	if (!query) {
		return interaction.reply({
			content: "Invalid query",
			ephemeral: true,
		});
	}

	return await subscribeFromQuery(interaction, query);
}
