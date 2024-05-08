import { expect, it, describe } from "bun:test";
import { derivePetState } from "./derivePetState";
import { PetState } from "./types";

describe("derivePetState", () => {
  it("returns Happy when happiness and hunger are above 75", () => {
    expect(derivePetState({ happiness: 80, hunger: 80 })).toEqual(
      PetState.Happy,
    );
  });

  it("returns Sick when happiness and hunger are below 25", () => {
    expect(derivePetState({ happiness: 20, hunger: 20 })).toEqual(
      PetState.Sick,
    );
  });

  it("returns Hungry when hunger is below 25", () => {
    expect(derivePetState({ happiness: 80, hunger: 20 })).toEqual(
      PetState.Hungry,
    );
  });

  it("returns Sad when happiness is below 25", () => {
    expect(derivePetState({ happiness: 20, hunger: 80 })).toEqual(PetState.Sad);
  });

  it("returns Dead when happiness and hunger are below 5", () => {
    expect(derivePetState({ happiness: 2, hunger: 2 })).toEqual(PetState.Dead);
  });

  it("returns Normal when none of the above conditions are met", () => {
    expect(derivePetState({ happiness: 50, hunger: 50 })).toEqual(
      PetState.Normal,
    );
  });
});
