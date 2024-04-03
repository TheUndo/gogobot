import { Events } from "discord.js";
import { client } from "../client";
import { prisma } from "~/prisma";
import {
  clanCreateCancelWizard,
  clanCreateNamePrompt,
  createGuildWizardStep2,
} from "~/interactions/commands/clan/createClanWizard";
import { InteractionType } from "../types";
import {
  clanSettingsButton,
  clanSettingsModalSubmit,
} from "~/interactions/commands/clan/clanSettings";
import { clanInviteReject } from "~/interactions/commands/clan/clanInvite";
import {
  clanJoin,
  clanRequestJoinApprove,
  clanRequestJoinReject,
} from "~/interactions/commands/clan/clanJoin";
import {
  clanCancelLeadershipTransfer,
  clanTransferLeadershipConfirm,
} from "~/interactions/commands/clan/clanPromote";
import { clanChangeJoinSetting } from "~/interactions/commands/clan/clanChangeJoinSetting";
import {
  clanInfoButton,
  clanMembersButton,
} from "~/interactions/commands/clan/clanInfo";
import { commandRouter } from "./commands";
import { buttonRouter } from "./buttons";
import { selectRouter } from "./selects";
import { modalRouter } from "./modals";
import {
  leaderBoardClanButton,
  leaderBoardClanChangePage,
  leaderBoardUsersButton,
} from "~/interactions/commands/economy/economyLeaderboard";

client.on(Events.InteractionCreate, async (interaction) => {
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
        case InteractionType.LeaderBoardShowClans:
          return void (await leaderBoardClanButton(
            interactionContext,
            interaction,
          ));
        case InteractionType.LeaderBoardShowUsers:
          return void (await leaderBoardUsersButton(
            interactionContext,
            interaction,
          ));
        case InteractionType.LeaderBoardClanChangeChangePage:
          return void (await leaderBoardClanChangePage(
            interactionContext,
            interaction,
          ));
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
