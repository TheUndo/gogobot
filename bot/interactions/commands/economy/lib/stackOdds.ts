import { z } from "zod";

export function stackOdds<T extends string>(
  odds: Record<T, number>,
): {
  totalOdds: number;
  stackedOdds: Record<
    T,
    {
      from: number;
      to: number;
    }
  >;
} {
  const totalOdds = Object.values(odds).reduce<number>((acc, curr) => {
    return z.number().parse(acc) + z.number().parse(curr);
  }, 0);
  const stackedOdds = (() => {
    let n = 0;
    const stack: Partial<
      Record<
        T,
        {
          from: number;
          to: number;
        }
      >
    > = {};

    for (const [rawScenario, rawChance] of Object.entries(odds)) {
      const chance = z.number().parse(rawChance);
      const scenario = rawScenario as T;
      stack[scenario] = {
        from: n,
        to: n + chance,
      };
      n += chance;
    }

    return stack as Record<
      T,
      {
        from: number;
        to: number;
      }
    >;
  })();

  return {
    totalOdds,
    stackedOdds,
  };
}
