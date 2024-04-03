import type { CacheType, ButtonInteraction } from "discord.js";
import { createSubScriptionList } from "../commands/subscriptions";
import { z } from "zod";
import { createLeaderBoard } from "../commands/economy/economyLeaderboard";

export async function leaderBoardChangePage(
  interaction: ButtonInteraction<CacheType>,
  rawPage: string,
) {
  const page = z.coerce.number().int().positive().safeParse(rawPage);

  if (!page.success) {
    return interaction.reply({
      content: `Invalid page number "${rawPage}"`,
      ephemeral: true,
    });
  }

  const guildId = interaction.guildId;

  if (!guildId) {
    return interaction.reply({
      content: "Interaction can only be used inside a guild",
      ephemeral: true,
    });
  }

  if (interaction.message.interaction?.user.id !== interaction.user.id) {
    return interaction.reply({
      content: "This is not your interaction",
      ephemeral: true,
    });
  }

  const response = await createLeaderBoard({
    page: page.data,
    guildId,
    userId: interaction.user.id,
  });

  if (interaction.message.editable) {
    return await interaction.update(response);
  }

  return interaction.reply(response);
}
