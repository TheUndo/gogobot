import { Client, Events, GatewayIntentBits } from "discord.js";

export const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers],
});

await client.login(Bun.env.DISCORD_TOKEN);

await new Promise((r) => {
  client.once(Events.ClientReady, () => {
    console.log("ready.");
    r(undefined);
  });
});
