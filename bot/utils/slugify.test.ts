import { describe, expect, test } from "bun:test";
import { slugify } from "./slugify";

describe("slugify", () => {
  test("should slugify a string", () => {
    expect(slugify("Hello, World!")).toBe("hello-world");
  });

  test("should slugify a string with multiple spaces", () => {
    expect(slugify("Hello,    World!")).toBe("hello-world");
  });

  test("should slugify a string with special characters", () => {
    expect(slugify("Hello, World!@#$%^&*()")).toBe("hello-world");
  });

  test("should slugify a string with numbers", () => {
    expect(slugify("Hello, World! 123")).toBe("hello-world-123");
  });

  test("should slugify a string with multiple spaces and special characters", () => {
    expect(slugify("Hello,    World!@#$%^&*()")).toBe("hello-world");
  });
});
