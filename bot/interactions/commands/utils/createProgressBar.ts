const filledSymbol = "▰";
const emptySymbol = "▱";

export function createProgressBar(steps: number, decimal: number) {
  const progress = Math.round(decimal * steps);
  const empty = steps - progress;

  return `[${filledSymbol.repeat(
    progress,
  )}](https://bot.undo.club)${emptySymbol.repeat(empty)}`;
}
