import {
  ModalBuilder,
  ActionRowBuilder,
  TextInputBuilder,
  TextInputStyle,
  type CacheType,
  type ButtonInteraction,
} from "discord.js";
import { ModalAction } from "../../common/types";
import { createSubScriptionList } from "../commands/subscriptions";

export async function subscriptionListChangePage(
  interaction: ButtonInteraction<CacheType>,
  rawPage: string,
) {
  const page = Number.parseInt(rawPage);

  if (Number.isNaN(page)) {
    return interaction.reply({
      content: `Invalid page number "${rawPage}"`,
      ephemeral: true,
    });
  }

  const response = await createSubScriptionList(interaction.user.id, page);

  if (interaction.message.editable) {
    return await interaction.update(response);
  }

  return interaction.reply(response);
}
