import { maxHappiness, maxHunger } from "./petConfig";
import { PetState } from "./types";

type Options = {
  happiness: number;
  hunger: number;
};

export function derivePetState({ happiness, hunger }: Options): PetState {
  switch (true) {
    case happiness < (3 / 100) * maxHappiness || hunger < (3 / 100) * maxHunger:
      return PetState.Dead;
    case happiness > (3 / 4) * maxHappiness && hunger > (3 / 4) * maxHunger:
      return PetState.Happy;
    case happiness < (1 / 4) * maxHappiness && hunger < (1 / 4) * maxHunger:
      return PetState.Sick;
    case hunger < (1 / 4) * maxHunger:
      return PetState.Hungry;
    case happiness < (1 / 4) * maxHappiness:
      return PetState.Sad;
    default:
      return PetState.Normal;
  }
}
