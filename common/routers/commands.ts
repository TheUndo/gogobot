import {
	Routes,
	type CacheType,
	type ChatInputCommandInteraction,
	REST,
} from "discord.js";
import { subscribe } from "../../interactions/commands/subscribe";
import { ping } from "../../interactions/commands/ping";
import { z } from "zod";
import { subscriptions } from "../../interactions/commands/subscriptions";
import { unsubscribe } from "../../interactions/commands/unsubscribe";
import { welcome } from "../../interactions/commands/welcome";
import { help } from "../../interactions/commands/help";

const commandsRegistrar = [
	ping,
	subscribe,
	subscriptions,
	unsubscribe,
	welcome,
	help,
].filter((v) =>
	Bun.env.NODE_ENV === "production" ? ("dev" in v ? !v.dev : true) : true,
);
const rest = new REST().setToken(z.string().parse(Bun.env.DISCORD_TOKEN));

export async function commandRouter(
	interaction: ChatInputCommandInteraction<CacheType>,
) {
	const command = commandsRegistrar.find(
		(v) => v.data.name === interaction.commandName,
	);

	if (!command) {
		await interaction.reply(
			`No command matching ${interaction.commandName} was found.`,
		);
		return;
	}

	try {
		await command.execute(interaction);
	} catch (error) {
		console.error(error);
		if (interaction.replied || interaction.deferred) {
			await interaction.followUp({
				content: "There was an error while executing this command!",
				ephemeral: true,
			});
		} else {
			await interaction.reply({
				content: "There was an error while executing this command!",
				ephemeral: true,
			});
		}
	}
}

/** key is command name */
export const commands = new Map<
	string,
	{
		id: string;
	}
>();

try {
	/* const data = await rest.get(
		Routes.applicationCommands(z.string().parse(Bun.env.DISCORD_CLIENT_ID)),
	);

	for (const command of z.array(z.any()).parse(data)) {
		await rest.delete(
			Routes.applicationCommand(
				z.string().parse(Bun.env.DISCORD_CLIENT_ID),
				command.id,
			),
		);
	} */

	const data = await (async () => {
		if (Bun.env.NODE_ENV === "development") {
			return await rest.put(
				Routes.applicationGuildCommands(
					z.string().parse(Bun.env.DISCORD_CLIENT_ID),
					z.string().parse(Bun.env.DISCORD_DEV_GUILD_ID),
				),
				{ body: commandsRegistrar.map((v) => v.data.toJSON()) },
			);
		}
		return await rest.put(
			Routes.applicationCommands(z.string().parse(Bun.env.DISCORD_CLIENT_ID)),
			{ body: commandsRegistrar.map((v) => v.data.toJSON()) },
		);
	})();

	const dataCommands = z
		.array(
			z.object({
				id: z.string(),
				name: z.string(),
			}),
		)
		.parse(data);

	for (const command of dataCommands) {
		commands.set(command.name, { id: command.id });
	}
	console.log(
		`Successfully reloaded ${dataCommands.length} application (/) commands.`,
	);
} catch (error) {
	console.error(error);
	process.exit(1);
}
