import { ChannelType, EmbedBuilder } from "discord.js";
import { client } from "../../bot/client";
import { env } from "../../core/misc/env";

const debugChannel = env.DISCORD_DEBUG_CHANNEL_ID;

export enum DebugLevel {
  Error = 0,
  Warning = 1,
  Info = 2,
}

const colors: Record<DebugLevel, number> = {
  [DebugLevel.Error]: 0xff0000,
  [DebugLevel.Warning]: 0xffc01a,
  [DebugLevel.Info]: 0x00ff00,
};

const prefix: Record<DebugLevel, string> = {
  [DebugLevel.Error]: "Error",
  [DebugLevel.Warning]: "Warning",
  [DebugLevel.Info]: "Info",
};

export async function debug(level: DebugLevel, message: string) {
  await client.channels.fetch(debugChannel).then(async (channel) => {
    if (!channel || channel.type !== ChannelType.GuildText) {
      throw new Error(`Could not find channel with id ${debugChannel}`);
    }

    await channel.send({
      embeds: [
        new EmbedBuilder()
          .setColor(colors[level])
          .setTitle(`[${prefix[level]}]`)
          .setDescription(message)
          .setTimestamp(),
      ],
    });
  });
}

export function makeCodeBlock(str: string, lang?: string) {
  return `\`\`\`${lang ?? ""}\n${str}\n\`\`\``;
}

export function makeInlineCodeBlock(str: string) {
  return `\`${str}\``;
}

export function makeCommand(name: string, id: string) {
  return `</${name}:${id}>`;
}
