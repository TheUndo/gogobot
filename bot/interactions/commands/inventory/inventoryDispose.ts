import { getTool } from "!/bot/logic/inventory/getTool";
import { notYourInteraction } from "!/bot/logic/responses/notYourInteraction";
import { wrongGuildForInteraction } from "!/bot/logic/responses/wrongGuildForInteraction";
import {
  type AnyInteraction,
  type InteractionContext,
  InteractionType,
} from "!/bot/types";
import { formatItem } from "!/bot/utils/formatItem";
import { prisma } from "!/core/db/prisma";
import { ActionRowBuilder } from "@discordjs/builders";
import { ButtonBuilder, ButtonStyle } from "discord.js";
import { sprintf } from "sprintf-js";
import { z } from "zod";
import { type ToolTypes, toolIds } from "../economy/lib/shopConfig";
import { buyToolItems } from "../economy/lib/shopItems";
import { createToolEmbed, inventoryContext } from "./inventory";

const disposeContext = z.object({
  walletId: z.string(),
  toolUniqueId: z.string(),
});

export async function inventoryToolDispose(
  interactionContext: InteractionContext,
  interaction: AnyInteraction,
) {
  if (!interaction.isStringSelectMenu()) {
    return void (await interaction.reply({
      ephemeral: true,
      content: "This interaction is only available as string menu select.",
    }));
  }

  const context = inventoryContext.safeParse(
    JSON.parse(interactionContext.payload ?? "{}"),
  );

  if (!context.success) {
    return await interaction.reply({
      content: "Invalid interaction context",
      ephemeral: true,
    });
  }

  if (interaction.user.id !== interactionContext.userDiscordId) {
    return await interaction.reply(
      notYourInteraction(interactionContext, interaction),
    );
  }

  const guildId = interaction.guildId;

  if (!guildId) {
    return void (await interaction.reply({
      ephemeral: true,
      content: "This command is only available in servers.",
    }));
  }

  if (guildId !== interactionContext.guildId) {
    return await interaction.reply(
      wrongGuildForInteraction(interactionContext, interaction),
    );
  }

  const toolUniqueId = z.string().safeParse(interaction.values[0]);

  if (!toolUniqueId.success) {
    return await interaction.reply({
      content: "Invalid value",
      ephemeral: true,
    });
  }

  const selectedTool = await prisma.shopItem.findUnique({
    where: {
      id: toolUniqueId.data,
    },
  });

  if (!selectedTool) {
    return await interaction.reply({
      content: "Cannot find selected tool. Contact Developer.",
      ephemeral: true,
    });
  }

  const ToolType = (Object.keys(toolIds) as Array<ToolTypes>).find(
    (key) => toolIds[key] === selectedTool.itemId.toString(),
  ) as ToolTypes;
  const toolData = buyToolItems[ToolType];

  const [disposeInteractionAccept, disposeInteractionDecline] =
    await prisma.$transaction([
      prisma.interaction.create({
        data: {
          type: InteractionType.InventoryDisposeToolAccept,
          userDiscordId: interaction.user.id,
          guildId,
          payload: JSON.stringify({
            walletId: context.data.walletId,
            toolUniqueId: selectedTool.id,
          } satisfies z.infer<typeof disposeContext>),
        },
      }),
      prisma.interaction.create({
        data: {
          type: InteractionType.InventoryDisposeToolDecline,
          userDiscordId: interaction.user.id,
          guildId,
          payload: JSON.stringify({
            walletId: context.data.walletId,
            toolUniqueId: selectedTool.id,
          } satisfies z.infer<typeof disposeContext>),
        },
      }),
    ]);

  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId(disposeInteractionAccept.id)
      .setLabel("Accept")
      .setStyle(ButtonStyle.Success),
    new ButtonBuilder()
      .setCustomId(disposeInteractionDecline.id)
      .setLabel("Decline")
      .setStyle(ButtonStyle.Danger),
  );

  await interaction.update({
    content: sprintf(
      "Are you sure, You want to dispose %s",
      await formatItem(toolData),
    ),
    embeds: [],
    components: [row],
  });
}

export async function inventoryToolDisposeAccept(
  interactionContext: InteractionContext,
  interaction: AnyInteraction,
) {
  if (!interaction.isButton()) {
    return void (await interaction.reply({
      ephemeral: true,
      content: "This interaction is an button",
    }));
  }

  const context = disposeContext.safeParse(
    JSON.parse(interactionContext.payload ?? "{}"),
  );

  if (!context.success) {
    return await interaction.reply({
      content: "Invalid interaction context",
      ephemeral: true,
    });
  }

  if (interaction.user.id !== interactionContext.userDiscordId) {
    return await interaction.reply(
      notYourInteraction(interactionContext, interaction),
    );
  }

  const guild = interaction.guild;

  if (!guild) {
    return void (await interaction.reply({
      ephemeral: true,
      content: "This command is only available in servers.",
    }));
  }

  if (guild.id !== interactionContext.guildId) {
    return await interaction.reply(
      wrongGuildForInteraction(interactionContext, interaction),
    );
  }

  const toolUniqueId = z.string().safeParse(context.data.toolUniqueId);

  if (!toolUniqueId.success) {
    return await interaction.reply({
      content: "Invalid value",
      ephemeral: true,
    });
  }

  const selectedTool = await prisma.shopItem.findUnique({
    where: {
      id: toolUniqueId.data,
    },
  });

  if (!selectedTool) {
    return await interaction.reply({
      content: "Cannot find selected tool. Contact Developer.",
      ephemeral: true,
    });
  }

  const toolData = await getTool(selectedTool.itemId.toString());

  if (!toolData) {
    return await interaction.reply({
      content: "Something went wrong! Contact a Developer",
    });
  }

  await prisma.shopItem.delete({
    where: {
      id: selectedTool.id,
    },
  });

  await interaction.update(
    await createToolEmbed(
      interaction.user,
      interaction.guild,
      sprintf(
        "Sucessfully disposed %s from you inventory.",
        await formatItem(toolData),
      ),
    ),
  );
}

export async function inventoryToolDisposeDecline(
  interactionContext: InteractionContext,
  interaction: AnyInteraction,
) {
  if (!interaction.isButton()) {
    return void (await interaction.reply({
      ephemeral: true,
      content: "This interaction is an button",
    }));
  }

  const context = disposeContext.safeParse(
    JSON.parse(interactionContext.payload ?? "{}"),
  );

  if (!context.success) {
    return await interaction.reply({
      content: "Invalid interaction context",
      ephemeral: true,
    });
  }

  if (interaction.user.id !== interactionContext.userDiscordId) {
    return await interaction.reply(
      notYourInteraction(interactionContext, interaction),
    );
  }

  const guild = interaction.guild;

  if (!guild) {
    return void (await interaction.reply({
      ephemeral: true,
      content: "This command is only available in servers.",
    }));
  }

  if (guild.id !== interactionContext.guildId) {
    return await interaction.reply(
      wrongGuildForInteraction(interactionContext, interaction),
    );
  }

  return await interaction.update(
    await createToolEmbed(interaction.user, interaction.guild),
  );
}
