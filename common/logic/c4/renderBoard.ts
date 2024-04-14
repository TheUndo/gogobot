import { createCanvas, loadImage } from "@napi-rs/canvas";
import { SlotState, type Board } from "./c4types";
import path from "node:path";

export async function renderBoard(board: Board) {
  const boardImage = await loadImage(
    path.join(__dirname, "assets", "board.jpg"),
  );
  const redImage = await loadImage(path.join(__dirname, "assets", "red.png"));
  const yellowImage = await loadImage(
    path.join(__dirname, "assets", "yellow.png"),
  );

  const canvas = createCanvas(boardImage.width, boardImage.height);
  const ctx = canvas.getContext("2d");
  ctx.drawImage(boardImage, 0, 0, boardImage.width, boardImage.height);

  for (const row of board.slots) {
    for (const slot of row) {
      if (slot.state === SlotState.Empty) {
        continue;
      }
      const x = slot.x * 137.8 - 13.2;
      const y = slot.y * 138 - 13;
      if (slot.state === SlotState.Red) {
        ctx.drawImage(redImage, x, y, 200, 200);
      } else {
        ctx.drawImage(yellowImage, x, y, 200, 200);
      }
    }
  }

  const jpegData = await canvas.encode("jpeg");

  await Bun.write(path.join(__dirname, "board.jpeg"), jpegData);
}

await renderBoard({
  slots: [
    [
      {
        x: 0,
        y: 0,
        state: SlotState.Red,
      },
      {
        x: 0,
        y: 1,
        state: SlotState.Yellow,
      },
      {
        x: 1,
        y: 1,
        state: SlotState.Yellow,
      },
      {
        x: 6,
        y: 5,
        state: SlotState.Yellow,
      },
      {
        x: 4,
        y: 4,
        state: SlotState.Yellow,
      },
      {
        x: 6,
        y: 1,
        state: SlotState.Yellow,
      },
      {
        x: 2,
        y: 5,
        state: SlotState.Yellow,
      },
    ],
  ],
});
