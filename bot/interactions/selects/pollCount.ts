import {
  ActionRowBuilder,
  type CacheType,
  ModalBuilder,
  type StringSelectMenuInteraction,
  TextInputBuilder,
} from "discord.js";
import { ModalAction } from "../../types";

export async function pollCount(
  interaction: StringSelectMenuInteraction<CacheType>,
) {
  const [count] = interaction.values;

  if (typeof count !== "string") {
    return await interaction.reply({
      content: `Invalid poll option count "${count}"`,
      ephemeral: true,
    });
  }

  await interaction.showModal(
    new ModalBuilder()
      .setTitle("Create Poll")
      .setCustomId(`${ModalAction.PollCount}+${count}`)
      .addComponents(
        new ActionRowBuilder<TextInputBuilder>().addComponents(
          new TextInputBuilder().setCustomId("title").setLabel("Title"),
        ),
      ),
  );

  /* return await interaction.reply(response); */
}
