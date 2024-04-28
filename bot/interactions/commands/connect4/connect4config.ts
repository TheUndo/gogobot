import { z } from "zod";

export const connect4clockTimes = [
  { name: "10 seconds", value: (15).toString() },
  { name: "30 seconds", value: (30).toString() },
  { name: "1 minute", value: (60).toString() },
  { name: "5 minutes", value: (60 * 5).toString() },
  { name: "10 minutes", value: (60 * 10).toString() },
  { name: "30 minutes", value: (60 * 30).toString() },
];

export const connect4interactionContext = z.object({
  gameId: z.string(),
});
