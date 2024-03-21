import { Client, Events, GatewayIntentBits } from "discord.js";
import { z } from "zod";

export const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers],
});

client.login(z.string().parse(process.env.DISCORD_TOKEN));

new Promise((r) => {
  client.once(Events.ClientReady, () => {
    console.log("ready.");
    r(undefined);
  });
});
