import type { CacheType, ModalSubmitInteraction } from "discord.js";
import { unsubscribeFromQuery } from "../../common/logic/unsubscribeFromQuery";

export async function unsubscribe(
	interaction: ModalSubmitInteraction<CacheType>,
) {
	const query = interaction.fields.getField("query").value;

	if (!query) {
		return interaction.reply({
			content: "Invalid query",
			ephemeral: true,
		});
	}

	return await unsubscribeFromQuery(interaction, query);
}
