import { Events } from "discord.js";
import { client } from "../client";
import { z } from "zod";
import { makeCommand } from "~/scraper/debug";
import { env } from "~/env";
import { sprintf } from "sprintf-js";
import { getCommands } from "./commands";

export const activeGuildId =
  env.BUN_ENV === "development"
    ? env.DISCORD_DEV_GUILD_ID
    : "724158993320116276";

client.on(Events.GuildMemberAdd, async (member) => {
  const guildId = member.guild.id;

  if (guildId !== activeGuildId) {
    return;
  }
  try {
    await member.send(welcomeMessage());
  } catch (error) {
    console.error(error);
  }
});

export function welcomeMessage() {
  const commandSnippet = getCommandSnippet();
  //const embed = new EmbedBuilder();

  const description = [
    "## 👋 Welcome to Gogoanime",
    "Thank you for joining the official Gogoanime Discord server!",
    "",
    "My name is GoGoBot and I'm at your service! I keep track of new anime and notify subscribers when a new episode is out.",
    "### Some useful commands:",
    commandSnippet
      .map((command) => {
        return sprintf("- %s", command);
      })
      .join("\n"),
    "### Need help?",
    "We're here to help you! If you have any questions or need help, feel free to ask in the <#724159374100135984> channel. We're always happy to help!",
    "### Chat with us",
    "We have a dedicated channel for chatting with other members. Feel free to join the conversation in <#726421062392217721>.",
  ].join("\n");

  //embed.setColor(Colors.Accent);

  return {
    content: description,
  };
}

function getCommandSnippet() {
  const commands = getCommands();

  return [
    { description: "Subscribe to an anime", name: "subscribe" },
    { description: "Stop receiving notifications", name: "unsubscribe" },
    { description: "Manage your subscriptions", name: "subscriptions" },
    { description: "Get info of an anime", name: "anime" },
    { description: "List all my commands", name: "help" },
  ].map((command) => {
    const id = z.string().parse(commands.get(command.name)?.id);
    return sprintf(
      "%s - %s",
      makeCommand(command.name, id),
      command.description,
    );
  });
}
