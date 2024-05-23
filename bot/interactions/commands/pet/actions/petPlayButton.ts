import { notYourInteraction } from "!/bot/logic/responses/notYourInteraction";
import { wrongGuildForInteraction } from "!/bot/logic/responses/wrongGuildForInteraction";
import { wrongInteractionType } from "!/bot/logic/responses/wrongInteractionType";
import type { AnyInteraction, InteractionContext } from "!/bot/types";
import { prisma } from "!/core/db/prisma";
import { createPetProfile } from "../lib/createPetProfile";
import { getPet } from "../lib/getPet";
import { happinessGain, maxHappiness } from "../lib/petConfig";

export async function petPlayButton(
  interactionContext: InteractionContext,
  interaction: AnyInteraction,
) {
  if (!interaction.isButton()) {
    return await interaction.reply(
      wrongInteractionType(interactionContext, interaction),
    );
  }

  if (interaction.guildId !== interactionContext.guildId) {
    return await interaction.reply(
      wrongGuildForInteraction(interactionContext, interaction),
    );
  }

  if (interaction.user.id !== interactionContext.userDiscordId) {
    return await interaction.reply(
      notYourInteraction(interactionContext, interaction),
    );
  }

  const guildId = interaction.guildId;

  if (!guildId) {
    return await interaction.reply({
      content: "This command can only be used in a server.",
      ephemeral: true,
    });
  }

  const pet = await getPet({
    guildId,
    userId: interaction.user.id,
  });

  if (!pet) {
    return await interaction.reply({
      content: "You don't have a pet. Create one with `/pet create`",
      ephemeral: true,
    });
  }

  if (pet.happiness >= maxHappiness) {
    return await interaction.reply({
      content: "Your pet is already at max happiness.",
      ephemeral: true,
    });
  }

  const newHappiness = Math.min(pet.happiness + happinessGain, maxHappiness);

  const updatedPet = await prisma.pet.update({
    where: {
      userId_guildId: {
        guildId,
        userId: interaction.user.id,
      },
    },
    data: {
      happiness: newHappiness,
    },
    select: {
      happiness: true,
    },
  });

  const newPet = {
    ...pet,
    happiness: updatedPet.happiness,
  };

  const message = await createPetProfile({
    pet: newPet,
    userId: interaction.user.id,
    guildId,
  });

  return await interaction.update(message);
}
