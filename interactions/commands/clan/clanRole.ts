import { client } from "!/common/client";
import { slugify } from "!/common/utils/slugify";
import { prisma } from "!/prisma";
import type { Guild, Role } from "discord.js";
import { z } from "zod";

export async function removeClanRole(
  clanId: string,
  userId: string,
): Promise<undefined> {
  const result = await clanUpsertRole(clanId);

  if (!result) {
    return;
  }

  const { guild, role } = result;

  if (!guild || !role) {
    return;
  }

  const member = await guild.members.fetch(userId).catch((e) => {
    console.error(`Failed to fetch member ${userId}`, e);
    return null;
  });

  if (!member) {
    return;
  }

  await member?.roles.remove(role.id).catch((e) => {
    console.error(`Failed to remove role from ${userId}`, e);
    return null;
  });
}

export async function addClanRole(
  clanId: string,
  userId: string,
): Promise<undefined> {
  const result = await clanUpsertRole(clanId);

  if (!result) {
    return;
  }

  const { guild, role } = result;

  if (!guild || !role) {
    return;
  }

  const member = await guild.members.fetch(userId).catch((e) => {
    console.error(`Failed to fetch member ${userId}`, e);
    return null;
  });

  if (!member) {
    return;
  }

  await member?.roles.add(role.id).catch((e) => {
    console.error(`Failed to add role to ${userId}`, e);
    return null;
  });
}

export async function clanUpsertRole(clanId: string): Promise<{
  role: Role | null;
  guild: Guild | null;
} | null> {
  const clan = await prisma.clan.findUnique({
    where: {
      id: clanId,
    },
    select: {
      discordGuildId: true,
      roleId: true,
      settingsColor: true,
      name: true,
    },
  });

  if (!clan) {
    console.error(`Clan ${clanId} not found`);
    return null;
  }

  const guild = await client.guilds.fetch(clan.discordGuildId).catch((e) => {
    console.error(`Failed to fetch guild ${clan.discordGuildId}`, e);
    return null;
  });

  if (!guild) {
    return null;
  }

  const roleId = clan?.roleId;

  if (roleId) {
    const role = await guild.roles.fetch(roleId).catch((e) => {
      console.error(`Failed to fetch role ${roleId}`, e);
      return null;
    });

    if (role) {
      return { role, guild };
    }
  }

  const createdRole = await guild.roles
    .create({
      name: clan.name,
      color: clan.settingsColor ?? 0,
    })
    .catch((e) => {
      console.error(`Failed to create role for clan ${clanId}`, e);
      return null;
    });

  if (!createdRole) {
    return null;
  }

  await prisma.clan.update({
    where: {
      id: clanId,
    },
    data: {
      roleId: createdRole.id,
    },
  });

  return { role: createdRole, guild };
}

export async function clanRoleUpdate(clanId: string): Promise<{
  role: Role | null;
  guild: Guild | null;
} | null> {
  const result = await clanUpsertRole(clanId);

  if (!result) {
    return null;
  }

  const { role, guild } = result;

  if (!role || !guild) {
    return null;
  }

  const clan = await prisma.clan.findUnique({
    where: {
      id: clanId,
    },
    select: {
      id: true,
      settingsColor: true,
      name: true,
    },
  });

  if (!clan) {
    return null;
  }

  if (role.name !== clan.name || role.color !== (clan.settingsColor ?? 0)) {
    await role
      .edit({
        name: clan.name,
        color: clan.settingsColor ?? 0,
      })
      .catch(() => null);
  }

  return result;
}

export async function validateClanName(
  raw: string,
  guildId: string,
): Promise<
  | {
      error: string;
    }
  | {
      slug: string;
      name: string;
    }
> {
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

  const search = await prisma.clan.findFirst({
    where: {
      slug,
      discordGuildId: guildId,
    },
  });

  if (search) {
    return {
      error: "This clan name is already taken. Try another.",
    };
  }

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
