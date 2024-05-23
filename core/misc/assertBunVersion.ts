import { semver } from "bun";
import { sprintf } from "sprintf-js";

const minimumBunVersion = "1.1.9";

if (semver.order(minimumBunVersion, Bun.version) === 1) {
  console.log(
    sprintf(
      [
        "Error: refusing to start the bot because the Bun version you are currently using (%s) is too old.",
        "Please upgrade to the latest version with `bun upgrade` and start the bot again.",
      ].join("\n"),
      Bun.version,
    ),
  );
  process.exit(1);
}
