import { randomNumber } from "!/common/utils/randomNumber";

export function getRandomizedScenario<T extends string>({
  stackedOdds,
  totalOdds,
}: {
  totalOdds: number;
  stackedOdds: Record<
    T,
    {
      from: number;
      to: number;
    }
  >;
}): T {
  const rng = randomNumber(0, totalOdds - 1);
  const entries = Object.entries(stackedOdds) as [
    T,
    { from: number; to: number },
  ][];
  const randomizedScenario = entries.find(
    ([, { from, to }]) => rng >= from && rng < to,
  )?.[0];

  return randomizedScenario as T;
}
