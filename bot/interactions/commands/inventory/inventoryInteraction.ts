import { notYourInteraction } from "!/bot/logic/responses/notYourInteraction";
import { wrongGuildForInteraction } from "!/bot/logic/responses/wrongGuildForInteraction";
import type { AnyInteraction, InteractionContext } from "!/bot/types";
import { ItemType } from "../economy/lib/shopCatalogue";
import {
  createResourceEmbed,
  createToolEmbed,
  inventoryContext,
} from "./inventory";

export async function inventoryView(
  interactionContext: InteractionContext,
  interaction: AnyInteraction,
) {
  if (!interaction.isButton()) {
    return void (await interaction.reply({
      ephemeral: true,
      content: "This interaction is a button",
    }));
  }

  const context = inventoryContext.safeParse(
    JSON.parse(interactionContext.payload ?? "{}"),
  );

  if (!context.success) {
    return void (await interaction.reply({
      content: "Invalid context.",
      ephemeral: true,
    }));
  }

  if (interaction.user.id !== interactionContext.userDiscordId) {
    return notYourInteraction(interactionContext, interaction);
  }

  const guild = interaction.guild;

  if (!guild) {
    return void (await interaction.reply({
      content: "This command is only available in servers.",
      ephemeral: true,
    }));
  }

  if (guild.id !== interactionContext.guildId) {
    return void (await interaction.reply(
      wrongGuildForInteraction(interactionContext, interaction),
    ));
  }

  switch (context.data.type) {
    case ItemType.Resources: {
      const InteractionReplyOptions = await createResourceEmbed(
        interaction.user,
        interaction.guild,
      );
      return await interaction.update(InteractionReplyOptions);
    }

    case ItemType.Tools: {
      const InteractionReplyOptions = await createToolEmbed(
        interaction.user,
        interaction.guild,
      );
      return await interaction.update(InteractionReplyOptions);
    }
  }
}
