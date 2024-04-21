import type {
  AnySelectMenuInteraction,
  ButtonInteraction,
  CacheType,
  Interaction,
  ModalSubmitInteraction,
  SlashCommandBuilder,
} from "discord.js";
import type { prisma } from "../prisma";

export type Command = {
  data: Partial<SlashCommandBuilder>;
  execute(interaction: Interaction): Promise<unknown>;
  dev?: boolean;
  private?: boolean;
};

export enum Language {
  Subbed = "Subbed",
  Dubbed = "Dubbed",
  Chinese = "Chinese",
}

export enum ButtonAction {
  Subscribe = "button::subscribe",
  Unsubscribe = "button::unsubscribe",
  ShowSubscribeModal = "button::showSubscribeModal",
  SubscriptionListChangePage = "button::subscriptionListChangePage",
  LeaderBoardChangePage = "button::leaderBoardChangePage",
}

export enum ModalAction {
  Subscribe = "modal::subscribe",
  Unsubscribe = "modal::unsubscribe",
  AnimeSearch = "modal::animeSearch",
  PollCount = "modal::pollCount",
}

export enum SelectAction {
  Subscribe = "select::subscribe",
  Unsubscribe = "select::unsubscribe",
  UnsubscribeFromSubscriptions = "select::unsubscribeFromSubscriptions",
  ShowAnimeInfo = "select::showAnimeInfo",
  PollOptionCount = "select::pollOptionCount",
}

export enum Colors {
  Success = 0x00ff00,
  Error = 0xff0000,
  Warning = 0xffc01a,
  Info = 0x4569cc,
  Accent = 0xffc01a,
}

export type ButtonActionFormat = `${ButtonAction}+${string}`;

export enum NewsCategory {
  Announcement = "Announcement",
  Trailer = "Trailer",
  News = "News",
  WhatToWatch = "WhatToWatch",
  Reviews = "Reviews",
}

export type AnyInteraction =
  | AnySelectMenuInteraction<CacheType>
  | ButtonInteraction<CacheType>
  | ModalSubmitInteraction<CacheType>;
export type InteractionContext = NonNullable<
  Awaited<ReturnType<typeof prisma.interaction.findUnique>>
>;

export enum InteractionType {
  ClanCreate = "CLAN_CREATE",
  ClanCreatePromptName = "CLAN_CREATE_PROMPT_NAME",
  ClanCreateWizardCancel = "GUILD_CREATE_WIZARD_CANCEL",
  ClanPromptSettings = "CLAN_PROMPT_SETTINGS",
  ClanJoin = "CLAN_JOIN",
  ClanRejectInvitation = "CLAN_REJECT_INVITATION",
  ClanSettingsModalSubmit = "CLAN_SETTINGS_MODAL_SUBMIT",
  ClanTransferLeadership = "CLAN_TRANSFER_LEADERSHIP",
  ClanCancelLeadershipTransfer = "CLAN_CANCEL_LEADERSHIP_TRANSFER",
  ClanChangeJoinSettingSelect = "CLAN_CHANGE_JOIN_SETTING_SELECT",
  ClanRequestJoinApprove = "CLAN_REQUEST_JOIN_APPROVE",
  ClanRequestJoinReject = "CLAN_REQUEST_JOIN_REJECT",
  ClanShowInfo = "CLAN_SHOW_INFO",
  ClanShowMemberList = "CLAN_SHOW_MEMBER_LIST",
  LeaderBoardChangeType = "LEADER_BOARD_CHANGE_TYPE",
  ClanListChangePage = "CLAN_LIST_PREVIOUS_PAGE",
  ClanListJoinClan = "CLAN_LIST_JOIN_CLAN",
  ClanMakeAnnouncement = "CLAN_MAKE_ANNOUNCEMENT",
  Gamble = "GAMBLE",
  Connect4AcceptInvitation = "CONNECT4_ACCEPT_INVITATION",
  Connect4DeclineInvitation = "CONNECT4_DECLINE_INVITATION",
  Connect4Move = "CONNECT4_MOVE",
  Connect4Forfeit = "CONNECT4_FORFEIT",
  Connect4Draw = "CONNECT4_DRAW",
}

export enum ClanMemberRole {
  Leader = "LEADER",
  CoLeader = "CO_LEADER",
  Officer = "OFFICER",
  Senior = "SENIOR",
  Member = "MEMBER",
}

export enum ClanJoinSetting {
  Open = "OPEN",
  Approval = "APPROVAL",
  Closed = "CLOSED",
}

export enum TransactionType {
  ClanDeposit = "CLAN_DEPOSIT",
}
