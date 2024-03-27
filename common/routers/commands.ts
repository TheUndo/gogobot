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
import { github } from "../../interactions/commands/github";
import { format } from "../../interactions/commands/format";
import { releaseDate } from "../../interactions/commands/releaseDate";
import { bulk } from "../../interactions/commands/bulk";
import { adblock } from "../../interactions/commands/adblock";
import { virus } from "../../interactions/commands/virus";
import { domains } from "../../interactions/commands/domains";
import { showAnime } from "../../interactions/commands/showAnime";
import { env } from "../../env";
import { stats } from "../../interactions/commands/stats";

const commandsRegistrar = [
  ping,
  subscribe,
  subscriptions,
  unsubscribe,
  welcome,
  help,
  github,
  format,
  releaseDate,
  bulk,
  adblock,
  virus,
  domains,
  showAnime,
  stats,
].filter((v) =>
  env.BUN_ENV === "production" ? ("dev" in v ? !v.dev : true) : true,
);
const rest = new REST().setToken(env.DISCORD_TOKEN);

export async function commandRouter(
  interaction: ChatInputCommandInteraction<CacheType>,
) {
  const command = commandsRegistrar.find(
    (v) => v.data.name === interaction.commandName,
  );

  console.log(
    `${interaction.user.displayName} used /${interaction.commandName}`,
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

(async () => {
  try {
    /* const data = await rest.get(
		Routes.applicationCommands(z.string().parse(process.env.DISCORD_APPLICATION_ID)),
	);

	for (const command of z.array(z.any()).parse(data)) {
		await rest.delete(
			Routes.applicationCommand(
				z.string().parse(process.env.DISCORD_APPLICATION_ID),
				command.id,
			),
		);
	} */

    const data = await (async () => {
      if (env.BUN_ENV === "development") {
        return await rest.put(
          Routes.applicationGuildCommands(
            env.DISCORD_APPLICATION_ID,
            env.DISCORD_DEV_GUILD_ID,
          ),
          { body: commandsRegistrar.map((v) => v.data.toJSON()) },
        );
      }
      return await rest.put(
        Routes.applicationCommands(env.DISCORD_APPLICATION_ID),
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
})();
