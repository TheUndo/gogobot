import { ClanJoinSetting, ClanMemberRole } from "!/common/types";

export const clanRoles: Record<ClanMemberRole, string> = {
  [ClanMemberRole.Leader]: "leader",
  [ClanMemberRole.CoLeader]: "co-leader",
  [ClanMemberRole.Officer]: "officer",
  [ClanMemberRole.Senior]: "senior",
  [ClanMemberRole.Member]: "member",
};

export const joinSettings: Record<ClanJoinSetting, string> = {
  [ClanJoinSetting.Open]: "Open",
  [ClanJoinSetting.Approval]: "Invite only",
  [ClanJoinSetting.Closed]: "Closed",
};
