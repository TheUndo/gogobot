export enum WorkType {
  Daily = "DAILY",
  Weekly = "WEEKLY",
  Rob = "ROB",
}

export const coolDowns: Record<WorkType, number> = {
  [WorkType.Daily]: 1000 * 60 * 60 * 23.5,
  [WorkType.Weekly]: 1000 * 60 * 60 * 24 * 7 - 1000 * 60 * 60,
  [WorkType.Rob]: 1000 * 60 * 60 * 3,
};

export const workNames: Record<WorkType, string> = {
  [WorkType.Daily]: "Daily",
  [WorkType.Weekly]: "Weekly",
  [WorkType.Rob]: "Rob",
};

export const workCommands: Record<WorkType, string> = {
  [WorkType.Daily]: "daily",
  [WorkType.Weekly]: "weekly",
  [WorkType.Rob]: "rob",
};
