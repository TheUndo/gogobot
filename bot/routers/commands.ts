import { avatar } from "!/bot/interactions/commands/avatar";
import { clan } from "!/bot/interactions/commands/clan/clan";
import { connect4 } from "!/bot/interactions/commands/connect4/connect4";
import { economyChannel } from "!/bot/interactions/commands/ecnomyChannel";
import { balance } from "!/bot/interactions/commands/economy/economyBalance";
import { daily } from "!/bot/interactions/commands/economy/economyDaily";
import { deposit } from "!/bot/interactions/commands/economy/economyDeposit";
import { fish } from "!/bot/interactions/commands/economy/economyFish";
import { gamble } from "!/bot/interactions/commands/economy/economyGamble";
import { gift } from "!/bot/interactions/commands/economy/economyGift";
import { mine } from "!/bot/interactions/commands/economy/economyMine";
import { rob } from "!/bot/interactions/commands/economy/economyRob";
import { soldier } from "!/bot/interactions/commands/economy/economySoldier";
import { spawn } from "!/bot/interactions/commands/economy/economySpawn";
import { weekly } from "!/bot/interactions/commands/economy/economyWeekly";
import { withdraw } from "!/bot/interactions/commands/economy/economyWithdraw";
import { work } from "!/bot/interactions/commands/economy/economyWork";
import { leaderBoard } from "!/bot/interactions/commands/economy/leaderBoard/economyLeaderBoard";
import { fun } from "!/bot/interactions/commands/fun";
import { github } from "!/bot/interactions/commands/github";
import { help } from "!/bot/interactions/commands/help";
import { ping } from "!/bot/interactions/commands/ping";
import { showAnime } from "!/bot/interactions/commands/showAnime";
import { stats } from "!/bot/interactions/commands/stats";
import { subscribe } from "!/bot/interactions/commands/subscribe";
import { subscriptions } from "!/bot/interactions/commands/subscriptions";
import { unsubscribe } from "!/bot/interactions/commands/unsubscribe";
import { welcome } from "!/bot/interactions/commands/welcome";
import { env } from "!/core/misc/env";

import type { Command } from "!/bot/types";
import {
  type CacheType,
  type ChatInputCommandInteraction,
  REST,
  Routes,
} from "discord.js";
import { z } from "zod";

const commandsRegistrar: Command[] = [
  ping,
  subscribe,
  subscriptions,
  unsubscribe,
  welcome,
  help,
  github,
  /* format,
  releaseDate,
  bulk,
  adblock,
  virus,
  domains, */
  showAnime,
  stats,
  daily,
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
  rob,
  work,
  economyChannel,
  fish,
  gamble,
  soldier,
  mine,
  connect4,
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
