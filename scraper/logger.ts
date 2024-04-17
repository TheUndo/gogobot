import { env } from "!/env";

export function debugPrint(...args: unknown[]) {
  if (env.BUN_ENV === "development") {
    console.log(...args);
  }
}
