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
  });
});

function setStatus() {
  client.user?.setActivity({
    type: ActivityType.Custom,
    name: `Using ${formatBytes(heapStats().heapSize)} of RAM, yum`,
  });
}

setInterval(
  () => {
    setStatus();
  },
  1000 * 60 * 15,
);

function formatBytes(bytes: number, decimals = 2) {
  if (!+bytes) return "0 Bytes";

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = [
    "Bytes",
    "KiB",
    "MiB",
    "GiB",
    "TiB",
    "PiB",
    "EiB",
    "ZiB",
    "YiB",
  ];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${Number.parseFloat((bytes / k ** i).toFixed(dm))} ${sizes[i]}`;
}
