import { clanAnnouncementModalSubmission } from "!/bot/interactions/commands/clan/clanAnnouncement";
import { clanChangeJoinSetting } from "!/bot/interactions/commands/clan/clanChangeJoinSetting";
import {
  clanInfoButton,
  clanMembersButton,
} from "!/bot/interactions/commands/clan/clanInfo";
import { clanInviteReject } from "!/bot/interactions/commands/clan/clanInvite";
import {
  clanJoin,
  clanRequestJoinApprove,
  clanRequestJoinReject,
} from "!/bot/interactions/commands/clan/clanJoin";
import { clanListChangePage } from "!/bot/interactions/commands/clan/clanList";
import {
  clanCancelLeadershipTransfer,
  clanTransferLeadershipConfirm,
} from "!/bot/interactions/commands/clan/clanPromote";
import {
  clanSettingsButton,
  clanSettingsModalSubmit,
} from "!/bot/interactions/commands/clan/clanSettings";
import {
  clanCreateCancelWizard,
  clanCreateNamePrompt,
  createGuildWizardStep2,
} from "!/bot/interactions/commands/clan/createClanWizard";
import {
  connect4forfeit,
  connect4move,
} from "!/bot/interactions/commands/connect4/connect4move";
import {
  connect4accept,
  connect4decline,
} from "!/bot/interactions/commands/connect4/connect4start";
import { gambleInteractionButton } from "!/bot/interactions/commands/economy/economyGamble";
import { leaderBoardClanChangeType } from "!/bot/interactions/commands/economy/leaderBoard/economyLeaderBoard";
import { prisma } from "!/core/db/prisma";
import { Events } from "discord.js";
import { client } from "../client";
import {
  economyShopSellButton,
  economyShopSellMenu,
} from "../interactions/commands/economy/shop/economyShopInteraction";
import { shopToolBuy } from "../interactions/commands/economy/shop/economyShopItemBuy";
import {
  inventoryToolDispose,
  inventoryToolDisposeAccept,
  inventoryToolDisposeDecline,
} from "../interactions/commands/inventory/inventoryDispose";
import { inventoryView } from "../interactions/commands/inventory/inventoryInteraction";
import { petPlayButton } from "../interactions/commands/pet/actions/petPlayButton";
import { cacheName } from "../logic/discordCache/store";
import { InteractionType } from "../types";
import { buttonRouter } from "./buttons";
import { commandRouter } from "./commands";
import { modalRouter } from "./modals";
import { selectRouter } from "./selects";

client.on(Events.InteractionCreate, async (interaction): Promise<void> => {
  // Intercepts all interactions and populate the Discord username cache
  cacheName(interaction);

  if ("customId" in interaction && !interaction.customId.includes("+")) {
    const interactionContext = await prisma.interaction.findUnique({
      where: {
        id: interaction.customId,
      },
    });

    if (interactionContext) {
      switch (interactionContext.type) {
        case InteractionType.ClanCreate:
          return void (await createGuildWizardStep2(
            interactionContext,
            interaction,
          ));
        case InteractionType.ClanCreateWizardCancel:
          return void (await clanCreateCancelWizard(
            interactionContext,
            interaction,
          ));
        case InteractionType.ClanCreatePromptName:
          return void (await clanCreateNamePrompt(
            interactionContext,
            interaction,
          ));
        case InteractionType.ClanJoin:
          return void (await clanJoin(interactionContext, interaction));
        case InteractionType.ClanRejectInvitation:
          return void (await clanInviteReject(interactionContext, interaction));
        case InteractionType.ClanPromptSettings:
          return void (await clanSettingsButton(
            interactionContext,
            interaction,
          ));
        case InteractionType.ClanSettingsModalSubmit:
          return void (await clanSettingsModalSubmit(
            interactionContext,
            interaction,
          ));
        case InteractionType.ClanTransferLeadership:
          return void (await clanTransferLeadershipConfirm(
            interactionContext,
            interaction,
          ));
        case InteractionType.ClanCancelLeadershipTransfer:
          return void (await clanCancelLeadershipTransfer(
            interactionContext,
            interaction,
          ));
        case InteractionType.ClanChangeJoinSettingSelect:
          return void (await clanChangeJoinSetting(
            interactionContext,
            interaction,
          ));
        case InteractionType.ClanRequestJoinApprove:
          return void (await clanRequestJoinApprove(
            interactionContext,
            interaction,
          ));
        case InteractionType.ClanRequestJoinReject:
          return void (await clanRequestJoinReject(
            interactionContext,
            interaction,
          ));
        case InteractionType.ClanShowInfo:
          return void (await clanInfoButton(interactionContext, interaction));
        case InteractionType.ClanShowMemberList:
          return void (await clanMembersButton(
            interactionContext,
            interaction,
          ));
        case InteractionType.ClanListChangePage:
          return void (await clanListChangePage(
            interactionContext,
            interaction,
          ));
        case InteractionType.LeaderBoardChangeType:
          return void (await leaderBoardClanChangeType(
            interactionContext,
            interaction,
          ));
        case InteractionType.Gamble:
          return void (await gambleInteractionButton(
            interactionContext,
            interaction,
          ));
        case InteractionType.ClanMakeAnnouncement:
          return void (await clanAnnouncementModalSubmission(
            interactionContext,
            interaction,
          ));
        case InteractionType.Connect4AcceptInvitation:
          return void (await connect4accept(interactionContext, interaction));
        case InteractionType.Connect4Move:
          return void (await connect4move(interactionContext, interaction));
        case InteractionType.Connect4DeclineInvitation:
          return void (await connect4decline(interactionContext, interaction));
        case InteractionType.Connect4Forfeit:
          return void (await connect4forfeit(interactionContext, interaction));
        case InteractionType.ShopBuyToolMenu:
          return void (await shopToolBuy(interactionContext, interaction));
        case InteractionType.ShopSellResourceMenu:
          return void (await economyShopSellMenu(
            interactionContext,
            interaction,
          ));
        case InteractionType.ShopSellResourceButton:
          return void (await economyShopSellButton(
            interactionContext,
            interaction,
          ));
        case InteractionType.InventoryDisposeToolMenu:
          return void (await inventoryToolDispose(
            interactionContext,
            interaction,
          ));
        case InteractionType.InventoryDisposeToolAccept:
          return void (await inventoryToolDisposeAccept(
            interactionContext,
            interaction,
          ));
        case InteractionType.InventoryDisposeToolDecline:
          return void (await inventoryToolDisposeDecline(
            interactionContext,
            interaction,
          ));
        case InteractionType.InventoryViewButton:
          return void (await inventoryView(interactionContext, interaction));
        case InteractionType.PetPlay:
          return void (await petPlayButton(interactionContext, interaction));
      }
    }
  }

  if (interaction.isChatInputCommand()) {
    await commandRouter(interaction);
    /* everything below is deprecated */
  } else if (interaction.isButton()) {
    await buttonRouter(interaction);
  } else if (interaction.isAnySelectMenu()) {
    await selectRouter(interaction);
  } else if (interaction.isModalSubmit()) {
    await modalRouter(interaction);
  }
});
