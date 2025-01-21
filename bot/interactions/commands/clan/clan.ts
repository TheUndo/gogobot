import type { Command } from "!/bot/types";
import { type Interaction, SlashCommandBuilder } from "discord.js";
import { z } from "zod";
import { clanAdminChangeLeader } from "./clanAdminChangeLeader";
import { clanAdminChangeName } from "./clanAdminChangeName";
import { clanAnnouncementCommand } from "./clanAnnouncement";
import { clanChangeName } from "./clanChangeName";
import { clanDemote } from "./clanDemote";
import { clanDeposit } from "./clanDeposit";
import { showClanInfoCommand } from "./clanInfo";
import { clanInvite } from "./clanInvite";
import { clanKick } from "./clanKick";
import { clanLeaveCommand } from "./clanLeave";
import { clanListCommand } from "./clanList";
import { clanMembersCommand } from "./clanMembers";
import { clanPromote } from "./clanPromote";
import { clanSetChannel } from "./clanSetChannel";
import { clanSettingsCommand } from "./clanSettings";
import { clanUpgradeCommand } from "./clanUpgrade";
import { createGuildWizardStep1 } from "./createClanWizard";

export const clan = {
  data: new SlashCommandBuilder()
    .setName("clan")
    .setDescription("Clan management")
    .setDMPermission(false)
    .addSubcommand((subCommand) =>
      subCommand
        .setName("info")
        .setDescription("Get clan information")
        .addUserOption((option) =>
          option
            .setName("user")
            .setDescription("The user whose clan you want to see"),
        ),
    )
    .addSubcommand((subCommand) =>
      subCommand.setName("create").setDescription("Create a new clan"),
    )
    .addSubcommand((subCommand) =>
      subCommand
        .setName("invite")
        .setDescription("Invite a user to your clan")
        .addUserOption((option) =>
          option
            .setRequired(true)
            .setName("user")
            .setDescription("User to invite"),
        ),
    )
    .addSubcommand((subCommand) =>
      subCommand.setName("settings").setDescription("Change clan settings"),
    )
    .addSubcommand((subCommand) =>
      subCommand
        .setName("kick")
        .setDescription("Kick a user from your clan")
        .addUserOption((option) =>
          option
            .setRequired(true)
            .setName("user")
            .setDescription("User to kick"),
        ),
    )
    .addSubcommand((subCommand) =>
      subCommand
        .setName("promote")
        .setDescription("Promote a member in your clan")
        .addUserOption((option) =>
          option
            .setRequired(true)
            .setName("user")
            .setDescription("User to promote"),
        ),
    )
    .addSubcommand((subCommand) =>
      subCommand
        .setName("demote")
        .setDescription("Demote a member in your clan")
        .addUserOption((option) =>
          option
            .setRequired(true)
            .setName("user")
            .setDescription("User to demote"),
        ),
    )
    .addSubcommand((subCommand) =>
      subCommand.setName("leave").setDescription("Leave your clan"),
    )
    .addSubcommand((subCommand) =>
      subCommand.setName("members").setDescription("Show your clan's members"),
    )
    .addSubcommand((subCommand) =>
      subCommand.setName("upgrade").setDescription("Upgrade your clan"),
    )
    .addSubcommand((subCommand) =>
      subCommand
        .setName("change-name")
        .setDescription("Change your clan's name")
        .addStringOption((option) =>
          option
            .setName("name")
            .setDescription("The new name")
            .setRequired(true),
        ),
    )
    .addSubcommand((subCommand) =>
      subCommand
        .setName("admin-change-name")
        .setDescription("Change a clan's name as admin")
        .addStringOption((option) =>
          option
            .setName("old_name")
            .setDescription("The old name")
            .setRequired(true),
        )
        .addStringOption((option) =>
          option
            .setName("new_name")
            .setDescription("The new name")
            .setRequired(true),
        )
        .addStringOption((option) =>
          option
            .setName("reason")
            .setDescription("Why are you changing the name?")
            .setRequired(true),
        ),
    )
    .addSubcommand((subCommand) =>
      subCommand
        .setName("admin-change-leader")
        .setDescription("Change a clan's leader as admin")
        .addStringOption((option) =>
          option
            .setName("clan")
            .setDescription("The clan's name")
            .setRequired(true),
        )
        .addStringOption((option) =>
          option
            .setName("new_leader")
            .setDescription("The new leader's id")
            .setRequired(true),
        ),
    )
    .addSubcommand((subCommand) =>
      subCommand.setName("list").setDescription("List all clans in the server"),
    )
    .addSubcommand((subCommand) =>
      subCommand
        .setName("deposit")
        .setDescription("Deposit the money in your wallet to your clan")
        .addStringOption((option) =>
          option
            .setName("amount")
            .setRequired(true)
            .setDescription("Amount to deposit. Put 0 for all"),
        ),
    )
    .addSubcommand((subCommand) =>
      subCommand
        .setName("set-clan-channel")
        .setDescription("Set the clan channel")
        .addStringOption((option) =>
          option
            .setName("clan")
            .setDescription("The clan's name")
            .setRequired(true),
        )
        .addChannelOption((option) =>
          option
            .setName("channel")
            .setDescription("The channel to set as the clan channel")
            .setRequired(true),
        ),
    )
    .addSubcommand((subCommand) =>
      subCommand
        .setName("announcement")
        .setDescription("Make a clan announcement"),
    ),
  async execute(interaction: Interaction) {
    if (!interaction.isRepliable() || !interaction.isChatInputCommand()) {
      return;
    }

    const guildId = interaction.guildId;

    if (!guildId) {
      return await interaction.reply("Clans are only available in servers.");
    }

    const subcommand = interaction.options.getSubcommand();

    switch (subcommand) {
      case "create":
        return await interaction.reply(
          await createGuildWizardStep1({
            userId: interaction.user.id,
            guildId,
          }),
        );
      case "info":
        return await interaction.reply(
          await showClanInfoCommand({
            authorId: interaction.user.id,
            guildId,
            mentionedId: interaction.options.getUser("user")?.id,
          }),
        );
      case "invite":
        return await interaction.reply(
          await clanInvite({
            userId: interaction.user.id,
            guildId,
            inviteeId: z
              .string()
              .parse(interaction.options.getUser("user")?.id),
          }),
        );
      case "settings":
        return void (await clanSettingsCommand({
          userId: interaction.user.id,
          guildId,
          interaction,
        }));
      case "kick":
        return await interaction.reply(
          await clanKick({
            authorId: interaction.user.id,
            mentionedId: z
              .string()
              .parse(interaction.options.getUser("user")?.id),
            guildId,
          }),
        );
      case "leave":
        return await interaction.reply(
          await clanLeaveCommand({
            userId: interaction.user.id,
            guildId,
          }),
        );
      case "promote":
        return await interaction.reply(
          await clanPromote({
            authorId: interaction.user.id,
            mentionedId: z
              .string()
              .parse(interaction.options.getUser("user")?.id),
            guildId,
          }),
        );
      case "demote":
        return await interaction.reply(
          await clanDemote({
            authorId: interaction.user.id,
            mentionedId: z
              .string()
              .parse(interaction.options.getUser("user")?.id),
            guildId,
          }),
        );
      case "members":
        return await interaction.reply(
          await clanMembersCommand({
            authorId: interaction.user.id,
            guildId,
          }),
        );
      case "upgrade":
        return await interaction.reply(
          await clanUpgradeCommand({
            authorId: interaction.user.id,
            guildId,
          }),
        );
      case "change-name":
        return await interaction.reply(
          await clanChangeName({
            authorId: interaction.user.id,
            guildId,
            name: interaction.options.getString("name") ?? "",
          }),
        );
      case "admin-change-name":
        return await interaction.reply(
          await clanAdminChangeName({
            authorId: interaction.user.id,
            guildId,
            newClanName: interaction.options.getString("new_name") ?? "",
            oldClanName: interaction.options.getString("old_name") ?? "",
            reason: interaction.options.getString("reason") ?? "",
          }),
        );
      case "admin-change-leader":
        return await interaction.reply(
          await clanAdminChangeLeader({
            authorId: interaction.user.id,
            guildId,
            clanName: interaction.options.getString("clan") ?? "",
            newLeaderId: interaction.options.getString("new_leader") ?? "",
          }),
        );
      case "list":
        return await interaction.reply(
          await clanListCommand({
            authorId: interaction.user.id,
            guildId,
            page: 1,
          }),
        );
      case "deposit":
        return await interaction.reply(
          await clanDeposit({
            authorId: interaction.user.id,
            guildId,
            amount: interaction.options.getString("amount") ?? "0",
          }),
        );
      case "set-clan-channel":
        return await interaction.reply(
          await clanSetChannel(
            interaction.user.id,
            guildId,
            interaction.options.getString("clan") ?? "",
            interaction.options.getChannel("channel")?.id ?? "",
          ),
        );
      case "announcement": {
        const result = await clanAnnouncementCommand(
          guildId,
          interaction.user.id,
        );

        if ("modal" in result) {
          return await interaction.showModal(result.modal);
        }
        return await interaction.reply(result);
      }
      default:
        return await interaction.reply({
          ephemeral: true,
          content: "Unknown sub command",
        });
    }
  },
} satisfies Command;
