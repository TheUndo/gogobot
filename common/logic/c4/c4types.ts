export type Board = {
  slots: Slot[][];
  gameState?: GameState;
  winningSlots?: Slot[];
  moveCount?: number;
};

export type Slot = {
  x: number;
  y: number;
  state: SlotState;
};

export enum GameState {
  RedTurn = "RED_TURN",
  YellowTurn = "YELLOW_TURN",
  RedWin = "RED_WIN",
  YellowWin = "YELLOW_WIN",
  Draw = "DRAW",
}

export enum SlotState {
  Empty = "EMPTY",
  Red = "RED",
  Yellow = "YELLOW",
}

export enum Column {
  A = "A",
  B = "B",
  C = "C",
  D = "D",
  E = "E",
  F = "F",
  G = "G",
}
