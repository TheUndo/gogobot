export enum WorkType {
  Daily = "DAILY",
  Weekly = "WEEKLY",
  Rob = "ROB",
  Fish = "FISH",
  Gamble = "GAMBLE",
  Prostitute = "PROSTITUTE",
  Soldier = "SOLDIER",
}

export const coolDowns: Record<WorkType, number> = {
  [WorkType.Daily]: 1000 * 60 * 60 * 23.5,
  [WorkType.Weekly]: 1000 * 60 * 60 * 24 * 7 - 1000 * 60 * 60,
  [WorkType.Rob]: 1000 * 60 * 60 * 3,
  [WorkType.Fish]: 1000 * 60 * 30,
  [WorkType.Gamble]: 1000 * 60 * 60 * 4,
  [WorkType.Prostitute]: 1000 * 60 * 60 * 4,
  [WorkType.Soldier]: 1000 * 60 * 60 * 5,
};

export const workNames: Record<WorkType, string> = {
  [WorkType.Daily]: "Daily",
  [WorkType.Weekly]: "Weekly",
  [WorkType.Rob]: "Robbing",
  [WorkType.Fish]: "Fishing",
  [WorkType.Gamble]: "Gambling",
  [WorkType.Prostitute]: "Prostitution",
  [WorkType.Soldier]: "Soldiering",
};

export const workCommands: Record<WorkType, string> = {
  [WorkType.Daily]: "daily",
  [WorkType.Weekly]: "weekly",
  [WorkType.Rob]: "rob",
  [WorkType.Fish]: "fish",
  [WorkType.Gamble]: "gamble",
  [WorkType.Prostitute]: "prostitute",
  [WorkType.Soldier]: "soldier",
};

export const workCommandUses: Record<WorkType, number> = {
  [WorkType.Daily]: 1,
  [WorkType.Weekly]: 1,
  [WorkType.Rob]: 1,
  [WorkType.Fish]: 3,
  [WorkType.Gamble]: 5,
  [WorkType.Prostitute]: 2,
  [WorkType.Soldier]: 1,
};
