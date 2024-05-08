import { PetState } from "./types";

type Options = {
  happiness: number;
  hunger: number;
};

export function derivePetState({ happiness, hunger }: Options): PetState {
  switch (true) {
    case happiness < 3 || hunger < 3:
      return PetState.Dead;
    case happiness > 75 && hunger > 75:
      return PetState.Happy;
    case happiness < 25 && hunger < 25:
      return PetState.Sick;
    case hunger < 25:
      return PetState.Hungry;
    case happiness < 25:
      return PetState.Sad;
    default:
      return PetState.Normal;
  }
}
