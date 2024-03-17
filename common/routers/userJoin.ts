import { EmbedBuilder, Events } from "discord.js";
import { client } from "../client";
import { z } from "zod";
import { makeCommand } from "../../scraper/debug";
import { commands } from "./commands";
import { Colors } from "../types";

const activeGuildId =
	Bun.env.NODE_ENV === "development"
		? z.string().parse(Bun.env.DISCORD_DEV_GUILD_ID)
		: "724158993320116276";

client.on(Events.GuildMemberAdd, async (member) => {
	const guildId = member.guild.id;

	if (guildId !== activeGuildId) {
		return;
	}
	try {
		await member.send({ embeds: [welcomeEmbed()] });
	} catch (error) {
		console.error(error);
	}
});

export function welcomeEmbed(): EmbedBuilder {
	const embed = new EmbedBuilder();

	embed.setTitle("👋 Welcome to Gogoanime");

	embed.setDescription(
		[
			"Hello there,",
			"Welcome to the official Gogoanime Discord server!",
			"I'm GoGoBot, you can use me to subscribe to anime and get notified when new episodes are released.",
			`To get started, use ${makeCommand(
				"subscribe",
				z.string().parse(commands.get("subscribe")?.id),
			)}.`,
		].join("\n\n"),
	);

	embed.addFields([
		{
			name: "Server rules",
			value: "<#724159404194136074>",
		},
		{
			name: "Need help with the site?",
			value: "<#724159374100135984>",
		},
		{
			name: "General chatting",
			value: "<#726421062392217721>",
		},
	]);

	embed.setColor(Colors.Accent);

	return embed;
}
