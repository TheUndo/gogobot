export enum WorkType {
  Daily = "DAILY",
  Weekly = "WEEKLY",
  Rob = "ROB",
  Fish = "FISH",
  Gamble = "GAMBLE",
  Soldier = "SOLDIER",
  Mine = "MINE",
}

export const coolDowns: Record<WorkType, number> = {
  [WorkType.Daily]: 1000 * 60 * 60 * 23.5,
  [WorkType.Weekly]: 1000 * 60 * 60 * 24 * 7 - 1000 * 60 * 60,
  [WorkType.Rob]: 1000 * 60 * 60 * 3,
  [WorkType.Fish]: 1000 * 60 * 30,
  [WorkType.Gamble]: 1000 * 60 * 60 * 4,
  [WorkType.Soldier]: 1000 * 60 * 60 * 5,
  [WorkType.Mine]: 1000 * 60 * 60,
};

export const workNames: Record<WorkType, string> = {
  [WorkType.Daily]: "Daily",
  [WorkType.Weekly]: "Weekly",
  [WorkType.Rob]: "Robbing",
  [WorkType.Fish]: "Fishing",
  [WorkType.Gamble]: "Gambling",
  [WorkType.Soldier]: "Soldiering",
  [WorkType.Mine]: "Mining",
};

export const workCommands: Record<WorkType, string> = {
  [WorkType.Daily]: "daily",
  [WorkType.Weekly]: "weekly",
  [WorkType.Rob]: "rob",
  [WorkType.Fish]: "fish",
  [WorkType.Gamble]: "gamble",

  [WorkType.Soldier]: "soldier",
  [WorkType.Mine]: "mine",
};

export const workCommandUses: Record<WorkType, number> = {
  [WorkType.Daily]: 1,
  [WorkType.Weekly]: 1,
  [WorkType.Rob]: 1,
  [WorkType.Fish]: 3,
  [WorkType.Gamble]: 5,
  [WorkType.Soldier]: 1,
  [WorkType.Mine]: 4,
};
