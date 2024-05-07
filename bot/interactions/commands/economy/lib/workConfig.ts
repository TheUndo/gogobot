export enum WorkType {
  Daily = "DAILY",
  Weekly = "WEEKLY",
  Rob = "ROB",
  Fish = "FISH",
  Gamble = "GAMBLE",
  Soldier = "SOLDIER",
  Mine = "MINE",
  Influencer = "INFLUENCER",
}

export const coolDowns: Record<WorkType, number> = {
  [WorkType.Daily]: 1000 * 60 * 60 * 23.5,
  [WorkType.Weekly]: 1000 * 60 * 60 * 24 * 7 - 1000 * 60 * 60,
  [WorkType.Rob]: 1000 * 60 * 60 * 3,
  [WorkType.Fish]: 1000 * 60 * 30,
  [WorkType.Gamble]: 1000 * 60 * 60 * 4,
  [WorkType.Soldier]: 1000 * 60 * 60 * 5,
  [WorkType.Mine]: 1000 * 60 * 60,
  [WorkType.Influencer]: 1000 * 60 * 60 * 4,
};

export const workNames: Record<WorkType, string> = {
  [WorkType.Daily]: "Daily",
  [WorkType.Weekly]: "Weekly",
  [WorkType.Rob]: "Robbing",
  [WorkType.Fish]: "Fishing",
  [WorkType.Gamble]: "Gambling",
  [WorkType.Soldier]: "Soldiering",
  [WorkType.Mine]: "Mining",
  [WorkType.Influencer]: "Influencer"
};

export const workCommands: Record<WorkType, string> = {
  [WorkType.Daily]: "daily",
  [WorkType.Weekly]: "weekly",
  [WorkType.Rob]: "rob",
  [WorkType.Fish]: "fish",
  [WorkType.Gamble]: "gamble",
  [WorkType.Soldier]: "soldier",
  [WorkType.Mine]: "mine",
  [WorkType.Influencer]: "influencer",
};

export const workCommandUses: Record<WorkType, number> = {
  [WorkType.Daily]: 1,
  [WorkType.Weekly]: 1,
  [WorkType.Rob]: 1,
  [WorkType.Fish]: 4,
  [WorkType.Gamble]: 5,
  [WorkType.Soldier]: 2,
  [WorkType.Mine]: 3,
  [WorkType.Influencer]: 3,
};
