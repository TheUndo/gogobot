import { z } from "zod";
import "dotenv/config";

const envString = z
  .string({
    invalid_type_error: "Looks like your .env is missing a value. See .env.example",
  })
  .min(1);

export const env = z
  .object({
    NODE_ENV: z.enum(["development", "production"]),
    DATABASE_URL: envString,
    DISCORD_TOKEN: envString,
    DISCORD_DEV_GUILD_ID: envString,
    DISCORD_APPLICATION_ID: envString,
    DISCORD_DEBUG_CHANNEL_ID: envString,
    DISCORD_SUBBED_CHANNEL_ID: envString,
    DISCORD_DUBBED_CHANNEL_ID: envString,
    DISCORD_CHINESE_CHANNEL_ID: envString,
    OWNER_DISCORD_ID: envString,
  })
  .parse(process.env);
