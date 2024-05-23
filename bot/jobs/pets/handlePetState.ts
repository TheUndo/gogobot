import { calculatePersonalCPH } from "!/bot/interactions/commands/pet/lib/calculatePersonalCPH";
import { derivePetState } from "!/bot/interactions/commands/pet/lib/derivePetState";
import {
  happinessDecay,
  hungerDecay,
} from "!/bot/interactions/commands/pet/lib/petConfig";
import { PetState } from "!/bot/interactions/commands/pet/lib/types";
import { TransactionType } from "!/bot/types";
import { prisma } from "!/core/db/prisma";
import * as R from "remeda";

export async function handlePetState() {
  const pets = await prisma.pet.findMany({
    where: {
      derivedState: {
        not: PetState.Dead,
      },
    },
  });

  const chunks = R.chunk(pets, 50);

  for (const chunk of chunks) {
    const transaction = [];

    for (const pet of chunk) {
      const happiness = Math.max(0, pet.happiness - happinessDecay);
      const hunger = Math.max(0, pet.hunger - hungerDecay);

      const derivedState = derivePetState({
        happiness,
        hunger,
      });

      const cph = calculatePersonalCPH({
        happiness,
        hunger,
        level: pet.level,
      });

      transaction.push(
        prisma.pet.update({
          where: {
            id: pet.id,
          },
          data: {
            happiness,
            hunger,
            derivedState,
          },
        }),
        // If user has a pet they must have a wallet...
        prisma.wallet.update({
          where: {
            userDiscordId_guildId: {
              userDiscordId: pet.userId,
              guildId: pet.guildId,
            },
          },
          data: {
            balance: {
              increment: cph,
            },
          },
        }),
        prisma.transaction.create({
          data: {
            amount: cph,
            type: TransactionType.PetPersonalCPH,
            userDiscordId: pet.userId,
            guildId: pet.guildId,
          },
        }),
      );
    }

    await prisma.$transaction(transaction);
  }
}
