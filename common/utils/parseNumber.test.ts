import { describe, it, expect } from "bun:test";
import { parseNumber } from "./parseNumber";

describe("parseNumber", () => {
  it("should throw on empty input", () => {
    expect(() => parseNumber("")).toThrow("Invalid input");
  });

  it("should trim the input", () => {
    expect(parseNumber("  1  ")).toBe(1);
  });

  it("should strip commas", () => {
    expect(parseNumber("1,000")).toBe(1000);
  });

  it("should strip dollar signs", () => {
    expect(parseNumber("$1")).toBe(1);
  });

  it("should strip dollar signs and commas", () => {
    expect(parseNumber("$1,000")).toBe(1e3);
  });

  it("should round decimals", () => {
    expect(parseNumber("1.5")).toBe(2);
  });

  it("should convert k to 1000", () => {
    expect(parseNumber("1k")).toBe(1e3);
    expect(parseNumber("1.5k")).toBe(15e2);
    expect(parseNumber("100k")).toBe(1e5);
  });

  it("should convert m to 1000000", () => {
    expect(parseNumber("1m")).toBe(1e6);
  });

  it("should handle k and m", () => {
    expect(parseNumber("1k 500")).toBe(15e2);
    expect(parseNumber("1m 500k")).toBe(15e5);
    expect(parseNumber("9.69m 123k")).toBe(9813e3);
    expect(parseNumber("1k 1k 1k")).toBe(3e3);
  });

  it("should throw on invalid suffix", () => {
    expect(() => parseNumber("1z")).toThrow("Invalid suffix: z");
  });

  it("should handle negative numbers", () => {
    expect(parseNumber("-1")).toBe(-1);
    expect(parseNumber("-1k")).toBe(-1e3);
    expect(parseNumber("-1m")).toBe(-1e6);
  });

  it("should handle uppercase suffixes", () => {
    expect(parseNumber("1K")).toBe(1e3);
    expect(parseNumber("1M")).toBe(1e6);
  });

  it("should handle 0 with suffix", () => {
    expect(parseNumber("0k")).toBe(0);
    expect(parseNumber("0m")).toBe(0);
  });

  it("should handle whitespace between number and suffix", () => {
    expect(parseNumber("1 k")).toBe(1e3);
    expect(parseNumber("1  m")).toBe(1e6);
  });
});
