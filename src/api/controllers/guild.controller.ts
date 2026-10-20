import type { Request, Response } from 'express';
import type { BotClient } from '../../core/client';
import { dangerousPermissionsOf } from '../../features/checker/checker.service';
import { notFound } from '../errors';
import { ok } from '../types';
import { requireParam } from '../utils/query';

export function listGuilds(client: BotClient) {
  return (_req: Request, res: Response): void => {
    const guilds = [...client.guilds.cache.values()].map((guild) => ({
      id: guild.id,
      name: guild.name,
      memberCount: guild.memberCount,
      ownerId: guild.ownerId,
    }));
    res.json(ok(guilds));
  };
}

export function getGuild(client: BotClient) {
  return (req: Request, res: Response): void => {
    const guildId = requireParam(req.params.guildId, 'guildId');
    const guild = client.guilds.cache.get(guildId);
    if (!guild) throw notFound(`Guild "${guildId}" was not found.`);
    res.json(
      ok({
        id: guild.id,
        name: guild.name,
        memberCount: guild.memberCount,
        ownerId: guild.ownerId,
        createdAt: guild.createdAt.toISOString(),
        channelCount: guild.channels.cache.size,
        roleCount: guild.roles.cache.size,
      }),
    );
  };
}

export function getMember(client: BotClient) {
  return async (req: Request, res: Response): Promise<void> => {
    const guildId = requireParam(req.params.guildId, 'guildId');
    const userId = requireParam(req.params.userId, 'userId');
    const guild = client.guilds.cache.get(guildId);
    if (!guild) throw notFound(`Guild "${guildId}" was not found.`);
    const member = await guild.members.fetch(userId).catch(() => null);
    if (!member) throw notFound(`Member "${userId}" was not found in guild "${guild.id}".`);
    res.json(
      ok({
        id: member.id,
        displayName: member.displayName,
        joinedAt: member.joinedAt?.toISOString() ?? null,
        roles: member.roles.cache.map((role) => ({ id: role.id, name: role.name })),
        dangerousPermissions: dangerousPermissionsOf(member.permissions),
      }),
    );
  };
}
