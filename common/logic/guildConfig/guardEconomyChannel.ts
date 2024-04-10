import { sprintf } from "sprintf-js";
import { getGuildConfig } from "./getGuildConfig";
import { client } from "~/common/client";
import { PermissionsBitField } from "discord.js";

export async function guardEconomyChannel(
  guildId: string,
  channelId: string,
  userId: string,
): Promise<null | {
  content: string;
}> {
  const user = await client.guilds
    .fetch(guildId)
    .then((guild) => guild.members.fetch(userId));

  const admin = user.permissions.has([PermissionsBitField.Flags.Administrator]);
  const config = await getGuildConfig(guildId);

  if (config.economyChannelId === channelId) {
    return null;
  }

  if (admin) {
    return {
      content: sprintf(
        "This command is configured to only be used in <#%s>. You can change it with `/economy-channel`",
        config.economyChannelId,
      ),
    };
  }

  return {
    content: sprintf(
      "This command can only be used in <#%s>",
      config.economyChannelId,
    ),
  };
}
