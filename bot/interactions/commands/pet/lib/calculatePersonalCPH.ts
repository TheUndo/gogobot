type Options = {
  happiness: number;
  hunger: number;
  level: number;
};

const basePay = 100;

export function calculatePersonalCPH({
  happiness,
  hunger,
  level,
}: Options): number {
  if (happiness < 5) {
    return 0;
  }

  if (hunger < 5) {
    return 0;
  }

  return Math.floor(
    Math.floor((happiness + hunger * 3) / 4) * level ** 1.1 * basePay,
  );
}
