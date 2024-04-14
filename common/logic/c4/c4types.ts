export type Board = {
  slots: Slot[][];
};

export type Slot = {
  x: number;
  y: number;
  state: SlotState;
};

export enum SlotState {
  Empty = "EMPTY",
  Red = "RED",
  Yellow = "YELLOW",
}
