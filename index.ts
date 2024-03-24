import { Events } from "discord.js";
import { client } from "./common/client";
import { commandRouter } from "./common/routers/commands";
import { buttonRouter } from "./common/routers/buttons";
import { selectRouter } from "./common/routers/selects";
import { modalRouter } from "./common/routers/modals";

client.on(Events.InteractionCreate, async (interaction) => {
  if (interaction.isChatInputCommand()) {
    await commandRouter(interaction);
  } else if (interaction.isButton()) {
    await buttonRouter(interaction);
  } else if (interaction.isAnySelectMenu()) {
    await selectRouter(interaction);
  } else if (interaction.isModalSubmit()) {
    await modalRouter(interaction);
  }
});

import "./common/routers/commands";
import "./common/routers/userJoin";
