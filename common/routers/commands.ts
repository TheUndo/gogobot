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
import { daily } from "../../interactions/commands/economy/economyDaily";
import { resetCoolDowns } from "../../interactions/commands/resetCooldowns";
import type { Command } from "../types";
import { weekly } from "../../interactions/commands/economy/economyWeekly";
import { deposit } from "../../interactions/commands/deposit";
import { balance } from "../../interactions/commands/economy/economyBalance";
import { withdraw } from "../../interactions/commands/economy/economyWithdraw";
import { leaderBoard } from "../../interactions/commands/economy/economyLeaderboard";
import { fun } from "../../interactions/commands/fun";
import { avatar } from "../../interactions/commands/avatar";
import { gift } from "../../interactions/commands/economy/economyGift";
import { spawn } from "../../interactions/commands/economy/economySpawn";
import { clan } from "../../interactions/commands/clan/clan";

const commandsRegistrar: Command[] = [
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
  daily,
  resetCoolDowns,
  weekly,
  deposit,
  balance,
  withdraw,
  leaderBoard,
  fun,
  avatar,
  gift,
  spawn,
  clan,
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

  if ("private" in command && command.private) {
    if (interaction.user.id !== env.OWNER_DISCORD_ID) {
      return await interaction.reply({
        content: "Sorry, this command is only available to the bot owner.",
      });
    }
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
const commands = new Map<
  string,
  {
    id: string;
    private: boolean;
  }
>();

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
        { body: commandsRegistrar.map((v) => v.data.toJSON?.()) },
      );
    }
    return await rest.put(
      Routes.applicationCommands(env.DISCORD_APPLICATION_ID),
      { body: commandsRegistrar.map((v) => v.data.toJSON?.()) },
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
    commands.set(command.name, {
      id: command.id,
      private: (() => {
        const match = commandsRegistrar.find(
          (v) => v.data.name === command.name,
        );

        if (!match) {
          return false;
        }

        return "private" in match ? match.private ?? false : false;
      })(),
    });
  }
  console.log(
    `Successfully reloaded ${dataCommands.length} application (/) commands.`,
  );
} catch (error) {
  console.error(error);
  process.exit(1);
}

export function getCommands() {
  return commands;
}
