export const BigIntMath = {
  min: (a: bigint, b: bigint) => (a < b ? a : b),
  max: (a: bigint, b: bigint) => (a > b ? a : b),
  abs: (a: bigint) => (a < 0n ? -a : a),
  clamp: (value: bigint, min: bigint, max: bigint) =>
    BigIntMath.min(BigIntMath.max(value, min), max),
};
