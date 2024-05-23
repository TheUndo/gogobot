/* const images: Record<PetType, Record<PetState, string>> = {
  [PetType.Tom]: {
    [PetState.Normal]: "https://i.imgur.com/7Jb5w3W.png",
    [PetState.Hungry]: "https://i.imgur.com/7Jb5w3W.png",
    [PetState.Sick]: "https://i.imgur.com/7Jb5w3W.png",
    [PetState.Dead]: "https://i.imgur.com/7Jb5w3W.png",
    [PetState.Happy]: "https://i.imgur.com/7Jb5w3W.png",
  },
}
 */

import { PetType } from "./types";

export const petTypeNames: Record<PetType, string> = {
  [PetType.Tom]: "Tom",
  [PetType.ZeroTwo]: "Zero Two",
};

export const maxHappiness = 100;
export const maxHunger = 100;
export const happinessDecay = 3;
export const hungerDecay = 1;
export const happinessGain = 10;
export const maxLevel = 200;
