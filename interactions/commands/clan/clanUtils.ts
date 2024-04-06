import type { Role } from "discord.js";
import { z } from "zod";
import { client } from "~/common/client";
import { Colors } from "~/common/types";
import { slugify } from "~/common/utils/slugify";
import { prisma } from "~/prisma";
import { debugPrint } from "~/scraper/logger";

export async function ensureClanRole(clanId: string) {
  const clan = await prisma.clan.findUnique({
    where: {
      id: clanId,
    },
    select: {
      discordGuildId: true,
      roleId: true,
      name: true,
      settingsColor: true,
      members: {
        select: {
          discordUserId: true,
        },
      },
    },
  });

  if (!clan) {
    return;
  }

  const guild = await client.guilds.fetch(clan.discordGuildId);

  if (!guild) {
    console.error(`Failed to fetch guild for clan ${clanId}`);
    return;
  }

  const role: Role | null = await (async () => {
    const fetchedRole = clan.roleId
      ? await guild.roles.fetch(clan.roleId).catch(() => null)
      : null;

    if (fetchedRole) {
      return fetchedRole;
    }

    const role = await guild.roles
      .create({
        name: clan.name,
        permissions: [],
        color: clan.settingsColor ?? Colors.Info,
        reason: "Clan role creation",
      })
      .catch(() => null);

    if (!role) {
      console.error(
        `Failed to create role for clan ${clanId} in guild ${guild.id}`,
      );
      return null;
    }

    await prisma.clan.update({
      where: {
        id: clanId,
      },
      data: {
        roleId: role.id,
      },
    });

    return role;
  })();

  if (!role) {
    console.error(`Failed to fetch or create role for clan ${clanId}`);
    return null;
  }

  if (
    role.name !== clan.name ||
    (clan.settingsColor != null && role.color !== clan.settingsColor)
  ) {
    debugPrint(
      `Updating role ${role.id} to name ${clan.name} color ${clan.settingsColor}`,
    );
    await role.edit({
      name: clan.name,
      color: clan.settingsColor ?? Colors.Info,
      reason: "Clan name update",
    });
  }

  const members = clan.members.map((member) => member.discordUserId);

  const roleOwners = await guild.roles
    .fetch(role.id)
    .then((role) => role?.members.map((member) => member.id) ?? []);

  const toAdd = members.filter((member) => !roleOwners.includes(member));
  const toRemove = roleOwners.filter((member) => !members.includes(member));

  for (const userId of toAdd) {
    debugPrint(`Adding role ${role.id} to user ${userId}`);
    await guild.members
      .addRole({
        user: userId,
        role: role.id,
        reason: "Clan role update",
      })
      .catch(() => {
        console.error(`Failed to add role ${role.id} to user ${userId}`);
      });
  }

  for (const userId of toRemove) {
    debugPrint(`Removing role ${role.id} from user ${userId}`);
    await guild.members
      .removeRole({
        user: userId,
        role: role.id,
        reason: "Clan role update",
      })
      .catch(() => {
        console.error(`Failed to remove role ${role.id} from user ${userId}`);
      });
  }
}

export function validateClanName(raw: string):
  | {
      error: string;
    }
  | {
      slug: string;
      name: string;
    } {
  const name = z
    .string()
    .trim()
    .transform((v) => v.trim().replace(/[\n\s]+/g, " "))
    .refine((v) => v.length > 0 && v.length <= 32)
    .safeParse(raw);

  if (!name.success) {
    return {
      error: "Invalid clan name",
    };
  }

  const slug = slugify(name.data);

  if (!slug.length) {
    return {
      error:
        "This clan name is invalid because it only contains non-alphanumeric characters. Try again.",
    };
  }

  if (/[<>@#*_~`|]/.test(name.data)) {
    return {
      error:
        "Clan name has <, >, @, #, *, _, ~, ` or | characters, which are not allowed.",
    };
  }

  return {
    slug,
    name: name.data,
  };
}
