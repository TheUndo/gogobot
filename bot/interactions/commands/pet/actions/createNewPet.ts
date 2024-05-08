import { makePossessive } from "!/bot/utils/makePossessive";
import type { CacheType, ChatInputCommandInteraction } from "discord.js";
import { sprintf } from "sprintf-js";
import { z } from "zod";
import { validatePetName } from "../../utils/validatePetName";
import { createPet } from "../lib/createPet";
import { createPetProfile } from "../lib/createPetProfile";
import { getPet } from "../lib/getPet";
import { PetType } from "../lib/types";

export async function createNewPet(
  interaction: ChatInputCommandInteraction<CacheType>,
): Promise<void> {
  const guildId = interaction.guildId;

  if (!guildId) {
    return void (await interaction.reply(
      "Pets are only available in servers.",
    ));
  }

  const existingPet = await getPet({
    guildId,
    userId: interaction.user.id,
  });

  if (existingPet) {
    return void (await interaction.reply({
      content: "You already have a pet.",
      ephemeral: true,
    }));
  }

  const name = z
    .string()
    .trim()
    .safeParse(interaction.options.getString("name"));

  if (!name.success) {
    return void (await interaction.reply({
      content: "Invalid name",
      ephemeral: true,
    }));
  }

  const validation = validatePetName(name.data);

  if (validation) {
    return void (await interaction.reply({
      content: `Invalid pet name: ${validation}`,
      ephemeral: true,
    }));
  }

  const type = z
    .nativeEnum(PetType)
    .safeParse(interaction.options.getString("type"));

  if (!type.success) {
    return void (await interaction.reply("Invalid type"));
  }

  const pet = await createPet({
    userId: interaction.user.id,
    guildId,
    name: name.data,
    type: type.data,
  });

  const message = await createPetProfile({
    userId: interaction.user.id,
    guildId,
    pet,
  });

  return void (await interaction.reply({
    ...message,
    content: sprintf(
      "Pet created! Use `/pet info` to see your %s profile.",
      makePossessive(pet.name),
    ),
  }));
}
