export enum WorkType {
  Daily = "DAILY",
  Weekly = "WEEKLY",
  Rob = "ROB",
  Fish = "FISH",
}

export const coolDowns: Record<WorkType, number> = {
  [WorkType.Daily]: 1000 * 60 * 60 * 23.5,
  [WorkType.Weekly]: 1000 * 60 * 60 * 24 * 7 - 1000 * 60 * 60,
  [WorkType.Rob]: 1000 * 60 * 60 * 3,
  [WorkType.Fish]: 1000 * 60 * 60 * 1,
};

export const workNames: Record<WorkType, string> = {
  [WorkType.Daily]: "Daily",
  [WorkType.Weekly]: "Weekly",
  [WorkType.Rob]: "Rob",
  [WorkType.Fish]: "Fish",
};

export const workCommands: Record<WorkType, string> = {
  [WorkType.Daily]: "daily",
  [WorkType.Weekly]: "weekly",
  [WorkType.Rob]: "rob",
  [WorkType.Fish]: "fish",
};

export const workCommandUses: Record<WorkType, number> = {
  [WorkType.Daily]: 1,
  [WorkType.Weekly]: 1,
  [WorkType.Rob]: 1,
  [WorkType.Fish]: 3,
};
