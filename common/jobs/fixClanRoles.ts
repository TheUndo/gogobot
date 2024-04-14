import { clanRoleUpdate } from "~/interactions/commands/clan/clanUtils";
import { prisma } from "~/prisma";

export async function fixClanRoles() {
  const clans = await prisma.clan.findMany({
    where: {
      roleId: {
        not: null,
      },
    },
    select: {
      id: true,
      discordGuildId: true,
      roleId: true,
      members: {
        select: {
          discordUserId: true,
        },
      },
    },
  });

  for (const clan of clans) {
    const result = await clanRoleUpdate(clan.id);

    if (!result) {
      continue;
    }

    const { guild, role } = result;

    if (!role || !guild) {
      continue;
    }

    for (const clanMember of clan.members) {
      const guildMember = role.members.find(
        (v) => v.id === clanMember.discordUserId,
      );

      if (!guildMember) {
        await guild.members
          .fetch(clanMember.discordUserId)
          .then((member) => member?.roles.add(role.id))
          .catch((e) => {
            console.error(
              `Failed to add role to ${clanMember.discordUserId}`,
              e,
            );
            return null;
          });
      }
    }
  }
}
