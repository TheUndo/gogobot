import { ActivityType, Client, Events, GatewayIntentBits } from "discord.js";
import { heapStats } from "bun:jsc";

export const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers],
});

client.login(process.env.DISCORD_TOKEN);

await new Promise((r) => {
  client.once(Events.ClientReady, (c) => {
    console.log("ready.");
    r(undefined);
    c.user.setActivity({
      type: ActivityType.Custom,
      name: `Using ${(heapStats().heapSize / (1024 * 1024)).toFixed(2)} MB of RAM, yum`,
    });
  });
});
