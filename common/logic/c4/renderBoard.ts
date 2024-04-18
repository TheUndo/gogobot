import path from "node:path";
import { createCanvas, loadImage } from "@napi-rs/canvas";
import { type Board, GameState, type Slot, SlotState } from "./c4types";

export async function renderBoard(board: Board): Promise<void> {
  const boardImage = await loadImage(
    path.join(__dirname, "assets", "board.png"),
  );
  const redImage = await loadImage(path.join(__dirname, "assets", "red.png"));
  const yellowImage = await loadImage(
    path.join(__dirname, "assets", "yellow.png"),
  );

  const canvas = createCanvas(boardImage.width, boardImage.height);
  const ctx = canvas.getContext("2d");

  ctx.drawImage(boardImage, 0, 0, boardImage.width, boardImage.height);

  const lines: Slot[] = board.winningSlots?.length
    ? [board.winningSlots.at(0), board.winningSlots.at(-1)].filter(
        (v): v is Slot => v != null,
      )
    : [];

  for (const row of board.slots) {
    for (const slot of row) {
      if (slot.state === SlotState.Empty) {
        continue;
      }
      const size = 201;
      const x = slot.x * 137.8 - 14;
      const y = slot.y * 137.8 + 106.5;
      if (slot.state === SlotState.Red) {
        ctx.drawImage(redImage, x, y, size, size);
      } else {
        ctx.drawImage(yellowImage, x, y, size, size);
      }
    }
  }

  if (lines.length > 0) {
    ctx.strokeStyle = "#111";
    ctx.lineWidth = 10;
    ctx.lineCap = "round";
    ctx.beginPath();
    for (const line of lines) {
      const x = line.x * 137.8 + 90;
      const y = line.y * 137.8 + 206;
      ctx.lineTo(x, y);
    }
    ctx.stroke();
  }

  console.log(board.gameState)
  const smallSize = 90;
  const smallX = 160;
  const smallY = boardImage.height - 100;
  switch (board.gameState) {
    case GameState.RedTurn:
      ctx.drawImage(redImage, smallX, smallY, smallSize, smallSize);
      break;
    case GameState.YellowTurn:
      ctx.drawImage(yellowImage, smallX, smallY, smallSize, smallSize);
      break;
  }

  const jpegData = await canvas.encode("jpeg");

  await Bun.write(path.join(__dirname, "board.jpeg"), jpegData);
}
