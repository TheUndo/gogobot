import { z } from "zod";

export enum GameState {
  RedTurn = "RED_TURN",
  YellowTurn = "YELLOW_TURN",
  RedWin = "RED_WIN",
  YellowWin = "YELLOW_WIN",
  Draw = "DRAW",
}

export enum ForfeitState {
  Red = "RED",
  Yellow = "YELLOW",
}

export enum SlotState {
  Empty = "EMPTY",
  Red = "RED",
  Yellow = "YELLOW",
}

const slot = z.object({
  x: z.number(),
  y: z.number(),
  state: z.nativeEnum(SlotState),
});

export enum Column {
  A = "A",
  B = "B",
  C = "C",
  D = "D",
  E = "E",
  F = "F",
  G = "G",
}

export const boardSchema = z.object({
  slots: z.array(z.array(slot)),
  gameState: z.nativeEnum(GameState).optional(),
  winningSlots: z.array(slot).optional(),
  moves: z.array(z.nativeEnum(Column)).optional(),
  forfeitState: z.nativeEnum(ForfeitState).optional(),
});

export type Board = z.infer<typeof boardSchema>;
export type Slot = z.infer<typeof slot>;
