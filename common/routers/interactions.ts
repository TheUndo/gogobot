import { clanAnnouncementModalSubmission } from "!/interactions/commands/clan/clanAnnouncement";
import { clanChangeJoinSetting } from "!/interactions/commands/clan/clanChangeJoinSetting";
import {
  clanInfoButton,
  clanMembersButton,
} from "!/interactions/commands/clan/clanInfo";
import { clanInviteReject } from "!/interactions/commands/clan/clanInvite";
import {
  clanJoin,
  clanRequestJoinApprove,
  clanRequestJoinReject,
} from "!/interactions/commands/clan/clanJoin";
import { clanListChangePage } from "!/interactions/commands/clan/clanList";
import {
  clanCancelLeadershipTransfer,
  clanTransferLeadershipConfirm,
} from "!/interactions/commands/clan/clanPromote";
import {
  clanSettingsButton,
  clanSettingsModalSubmit,
} from "!/interactions/commands/clan/clanSettings";
import {
  clanCreateCancelWizard,
  clanCreateNamePrompt,
  createGuildWizardStep2,
} from "!/interactions/commands/clan/createClanWizard";
import { gambleInteractionButton } from "!/interactions/commands/economy/economyGamble";
import {
  leaderBoardChangeTypeButton,
  leaderBoardClanButton,
  leaderBoardClanChangePage,
  leaderBoardUsersButton,
} from "!/interactions/commands/economy/economyLeaderboard";
import { prisma } from "!/prisma";
import { Events } from "discord.js";
import { client } from "../client";
import { InteractionType } from "../types";
import { buttonRouter } from "./buttons";
import { commandRouter } from "./commands";
import { modalRouter } from "./modals";
import { selectRouter } from "./selects";

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
        case InteractionType.ClanListChangePage:
          return void (await clanListChangePage(
            interactionContext,
            interaction,
          ));
        case InteractionType.LeaderBoardChangeType:
          return void (await leaderBoardChangeTypeButton(
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
