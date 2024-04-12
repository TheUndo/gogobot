export function parseNumber(input: string): number {
  const cleaned = input
    .trim()
    .toLowerCase()
    .replace(/[$,@#*|_~><"']/g, "")
    .replace(/[\s\n]+/g, " ");

  if (cleaned === "all") {
    return 0;
  }

  if (!cleaned) {
    throw new Error("Invalid input");
  }

  if (/^[\d.]+$/.test(input)) {
    const parsed = Number.parseFloat(cleaned);

    if (!Number.isNaN(parsed)) {
      return Math.round(parsed);
    }
  }

  const total = cleaned
    .toLowerCase()
    .replace(/([-\d.])\s*([a-z])/g, (_, num, suffix) => {
      if (suffix === "k") {
        return `${num}e3`;
      }

      if (suffix === "m") {
        return `${num}e6`;
      }

      throw new Error(`Invalid suffix: ${suffix}`);
    })
    .split(/\s+/g)
    .reduce((acc, curr) => {
      if (curr === "-") {
        return -acc;
      }

      return acc + Number.parseFloat(curr);
    }, 0);

  if (Number.isNaN(total)) {
    throw new Error("Invalid input");
  }

  return Math.round(total);
}

export function safeParseNumber(input: unknown): number | null {
  if (typeof input !== "string") {
    return null;
  }
  try {
    return parseNumber(input);
  } catch {
    return null;
  }
}
