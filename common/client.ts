import { heapStats } from "bun:jsc";
import { ActivityType, Client, Events, GatewayIntentBits } from "discord.js";

export const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers],
});

client.login(process.env.DISCORD_TOKEN);

await new Promise((r) => {
  client.once(Events.ClientReady, () => {
    console.log("ready.");
    r(undefined);
  });
});

function setStatus() {
  client.user?.setActivity({
    type: ActivityType.Custom,
    name:
      Math.random() > 0.5
        ? "Use /subscribe for notifications!"
        : `Using ${formatBytes(heapStats().heapSize)} of RAM, yum`,
  });
}

setInterval(
  () => {
    setStatus();
  },
  1000 * 60 * 30,
);

function formatBytes(bytes: number, decimals = 2) {
  if (!+bytes) {
    return "0 Bytes";
  }

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
