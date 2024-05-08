import type { Pet } from "@prisma/client";

export enum PetType {
  Tom = "TOM",
  ZeroTwo = "ZERO_TWO",
  /* Pikachu = "PIKACHU",
  Aqua = "AQUA",
  Pepe = "PEPE",
  Doge = "DOGE",
  Kermit = "KERMIT",
  Luffy = "LUFFY",
  Naruto = "NARUTO",
  Umaru = "UMARU", */
}

export enum PetState {
  Normal = "NORMAL",
  Hungry = "HUNGRY",
  Sick = "SICK",
  Dead = "DEAD",
  Happy = "HAPPY",
  Sad = "SAD",
}

export type TSPet = Omit<Pet, "type" | "derivedState"> & {
  type: PetType;
  derivedState: PetState;
};
