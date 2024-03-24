import { Client, Events, GatewayIntentBits } from "discord.js";

export const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers],
});

client.login(process.env.DISCORD_TOKEN);

new Promise((r) => {
  client.once(Events.ClientReady, () => {
    console.log("ready.");
    r(undefined);
  });
});
