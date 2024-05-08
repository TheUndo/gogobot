import type { CacheType, ChatInputCommandInteraction } from "discord.js";
import { createPetProfile } from "../lib/createPetProfile";
import { getPet } from "../lib/getPet";

export async function showPetInfo(
  interaction: ChatInputCommandInteraction<CacheType>,
): Promise<void> {
  const guildId = interaction.guildId;

  if (!guildId) {
    return void (await interaction.reply(
      "Pets are only available in servers.",
    ));
  }

  const pet = await getPet({
    guildId,
    userId: interaction.user.id,
  });

  if (!pet) {
    return void (await interaction.reply({
      content: "You don't have a pet. Create one with `/pet create`",
      ephemeral: true,
    }));
  }

  const message = await createPetProfile({
    pet,
    userId: interaction.user.id,
    guildId,
  });

  return void (await interaction.reply(message));
}
