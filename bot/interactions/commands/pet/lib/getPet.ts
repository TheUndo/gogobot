import { prisma } from "!/core/db/prisma";
import { z } from "zod";
import { PetState, PetType, type TSPet } from "./types";
import type { Pet } from "@prisma/client";

type Options = {
  guildId: string;
  userId: string;
};

export async function getPet({
  guildId,
  userId,
}: Options): Promise<TSPet | null> {
  const result = await prisma.pet.findUnique({
    where: {
      userId_guildId: {
        userId,
        guildId,
      },
    },
  });

  if (!result) {
    return null;
  }

  return parseRawPet(result);
}

export function parseRawPet(pet: Pet): TSPet {
  const type = z.nativeEnum(PetType).parse(pet.type);
  const derivedState = z.nativeEnum(PetState).parse(pet.derivedState);

  return {
    ...pet,
    type,
    derivedState,
  };
}
