import { Colors } from "!/bot/types";
import { prisma } from "!/core/db/prisma";
import { derivePetState } from "./derivePetState";
import { parseRawPet } from "./getPet";
import type { PetType, TSPet } from "./types";

type Options = {
  userId: string;
  guildId: string;
  name: string;
  type: PetType;
};

export async function createPet({
  userId,
  guildId,
  name,
  type,
}: Options): Promise<TSPet> {
  const happiness = 50;
  const hunger = 50;
  const result = await prisma.pet.create({
    data: {
      userId,
      guildId,
      name,
      type,
      happiness,
      hunger,
      color: Colors.Info,
      derivedState: derivePetState({ happiness, hunger }),
    },
  });

  return parseRawPet(result);
}
