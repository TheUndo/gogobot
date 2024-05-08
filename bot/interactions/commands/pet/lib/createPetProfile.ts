import { EmbedBuilder } from "@discordjs/builders";
import type { TSPet } from "./types";
import { sprintf } from "sprintf-js";
import type { InteractionReplyOptions } from "discord.js";
import { createProgressBar } from "../../utils/createProgressBar";
import { calculatePersonalCPH } from "./calculatePersonalCPH";
import { formatNumber } from "!/bot/utils/formatNumber";
import { maxHappiness, maxHunger, maxLevel } from "./petConfig";

type Options = {
  userId: string;
  guildId: string;
  pet: TSPet;
};

export async function createPetProfile({
  pet,
}: Options): Promise<InteractionReplyOptions> {
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

  return {
    content,
    embeds: [embed],
  };
}
