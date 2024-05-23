import { InteractionType } from "!/bot/types";
import { formatNumber } from "!/bot/utils/formatNumber";
import { prisma } from "!/core/db/prisma";
import { EmbedBuilder } from "@discordjs/builders";
import { ActionRowBuilder, ButtonBuilder, ButtonStyle } from "discord.js";
import { sprintf } from "sprintf-js";
import { z } from "zod";
import { createProgressBar } from "../../utils/createProgressBar";
import { calculatePersonalCPH } from "./calculatePersonalCPH";
import { maxHappiness, maxHunger, maxLevel } from "./petConfig";
import type { TSPet } from "./types";

type Options = {
  userId: string;
  guildId: string;
  pet: TSPet;
};

const petInteractionContext = z.object({
  petId: z.string(),
});

const labels: Partial<Record<InteractionType, string>> = {
  [InteractionType.PetFeed]: "Feed",
  [InteractionType.PetPlay]: "Play",
};
const emojis: Partial<Record<InteractionType, string>> = {
  [InteractionType.PetSettings]: "⚙",
};

export async function createPetProfile({ pet, userId, guildId }: Options) {
  const content = sprintf("## %s", pet.name);

  const embed = new EmbedBuilder().setColor(pet.color);

  embed.addFields({
    name: "CPH",
    value: sprintf("%s $/h", formatNumber(calculatePersonalCPH(pet))),
    inline: true,
  });

  embed.addFields({
    name: "Level",
    value:
      pet.level >= maxLevel ? `MAX LEVEL ${maxLevel}` : pet.level.toString(),
    inline: true,
  });

  embed.addFields({
    name: "Happiness",
    value: sprintf(
      "%d/%s %s",
      pet.happiness,
      maxHappiness,
      createProgressBar(20, pet.happiness / maxHappiness),
    ),
    inline: false,
  });

  embed.addFields({
    name: "Hunger",
    value: sprintf(
      "%d/%d %s",
      pet.hunger,
      maxHunger,
      createProgressBar(20, pet.hunger / maxHunger),
    ),
    inline: false,
  });

  const interactionTypes = [
    InteractionType.PetFeed,
    InteractionType.PetPlay,
    InteractionType.PetSettings,
  ];

  const payload = JSON.stringify({
    petId: pet.id,
  } satisfies z.infer<typeof petInteractionContext>);

  const interactions = await prisma.$transaction(
    interactionTypes
      .filter(() => true)
      .map((type) =>
        prisma.interaction.create({
          data: {
            type,
            userDiscordId: userId,
            guildId: guildId,
            payload,
          },
        }),
      ),
  );

  if (!interactions) {
    return {
      content: "Failed to create interactions",
    };
  }

  const row = new ActionRowBuilder<ButtonBuilder>().addComponents();

  for (const interactionType of interactionTypes) {
    const interaction = interactions.find((v) => v.type === interactionType);
    const label = labels[interactionType];
    const emoji = emojis[interactionType];
    if (!label && !emoji) {
      continue;
    }
    const button = new ButtonBuilder()
      .setCustomId(interaction?.id ?? `noop:${interactionType}`)
      .setDisabled(interaction == null)
      .setStyle(ButtonStyle.Secondary);

    if (label) {
      button.setLabel(label);
    }
    if (emoji) {
      button.setEmoji(emoji);
    }

    row.addComponents(button);
  }

  return {
    content,
    embeds: [embed],
    components: row.components.length ? [row] : undefined,
  };
}
