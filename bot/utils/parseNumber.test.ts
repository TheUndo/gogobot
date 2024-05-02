import { describe, expect, it } from "bun:test";
import { parseNumber } from "./parseNumber";

describe("parseNumber", () => {
  it("should parse all", () => {
    expect(parseNumber("all")).toBe(0n);
  });

  it("should throw on empty input", () => {
    expect(() => parseNumber("")).toThrow("Invalid input");
  });

  it("should trim the input", () => {
    expect(parseNumber("  1  ")).toBe(1n);
  });

  it("should strip commas", () => {
    expect(parseNumber("1,000")).toBe(1000n);
  });

  it("should strip dollar signs", () => {
    expect(parseNumber("$1")).toBe(1n);
  });

  it("should strip dollar signs and commas", () => {
    expect(parseNumber("$1,000")).toBe(1000n);
  });

  it("should convert k to 1000", () => {
    expect(parseNumber("1k")).toBe(1000n);
    expect(parseNumber("1.5k")).toBe(1500n);
    expect(parseNumber("100k")).toBe(100000n);
  });

  it("should convert m to 1000000", () => {
    expect(parseNumber("1m")).toBe(1000000n);
  });

  it("should handle k and m", () => {
    expect(parseNumber("1k 500")).toBe(1500n);
    expect(parseNumber("1m 500k")).toBe(1500000n);
    expect(parseNumber("9.69m 123k")).toBe(9813000n);
    expect(parseNumber("1k 1k 1k")).toBe(3000n);
  });

  it("should throw on invalid suffix", () => {
    expect(() => parseNumber("1z")).toThrow("Invalid suffix: z");
  });

  it("should handle negative numbers", () => {
    expect(parseNumber("-1")).toBe(-1n);
    expect(parseNumber("-1k")).toBe(-1000n);
    expect(parseNumber("-1m")).toBe(-1000000n);
  });

  it("should handle uppercase suffixes", () => {
    expect(parseNumber("1K")).toBe(1000n);
    expect(parseNumber("1M")).toBe(1000000n);
  });

  it("should handle 0 with suffix", () => {
    expect(parseNumber("0k")).toBe(0n);
    expect(parseNumber("0m")).toBe(0n);
  });

  it("should handle whitespace between number and suffix", () => {
    expect(parseNumber("1 k")).toBe(1000n);
    expect(parseNumber("1  m")).toBe(1000000n);
  });
});
