import type { ButtonInteraction, CacheType } from "discord.js";
import { z } from "zod";
import { createSubScriptionList } from "../commands/subscriptions";

export async function subscriptionListChangePage(
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

  const response = await createSubScriptionList(interaction.user.id, page.data);

  if (interaction.message.editable) {
    return await interaction.update(response);
  }

  return interaction.reply(response);
}
