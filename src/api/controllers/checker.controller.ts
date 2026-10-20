import type { Request, Response } from 'express';
import type { BotClient } from '../../core/client';
import { findGuildAdmins, findGuildBots } from '../../features/checker/adminAudit';
import { getMutualGuilds } from '../../features/checker/mutualGuilds';
import { findVoiceLocations, getMyServerRank, getVoiceLeaderboard } from '../../features/checker/voiceActivity';
import { notFound } from '../errors';
import { ok } from '../types';
import { requireParam } from '../utils/query';

export function fullCheck(client: BotClient) {
  return async (req: Request, res: Response): Promise<void> => {
    const userId = requireParam(req.params.userId, 'userId');
    res.json(ok(await getMutualGuilds(client, userId)));
  };
}

export function roleCheck(client: BotClient) {
  return async (req: Request, res: Response): Promise<void> => {
    const userId = requireParam(req.params.userId, 'userId');
    const entries = await getMutualGuilds(client, userId);
    res.json(ok(entries.filter((entry) => entry.dangerous.length > 0)));
  };
}

export function voiceCheck(client: BotClient) {
  return async (req: Request, res: Response): Promise<void> => {
    const userId = requireParam(req.params.userId, 'userId');
    res.json(ok(await findVoiceLocations(client, userId)));
  };
}

export function voiceLeaderboard(client: BotClient) {
  return async (_req: Request, res: Response): Promise<void> => {
    res.json(ok(await getVoiceLeaderboard(client)));
  };
}

export function myServerRank(client: BotClient) {
  return async (req: Request, res: Response): Promise<void> => {
    const guildId = requireParam(req.params.guildId, 'guildId');
    const guild = client.guilds.cache.get(guildId);
    if (!guild) throw notFound(`Guild "${guildId}" was not found.`);
    res.json(ok(await getMyServerRank(client, guild)));
  };
}

export function listAdmins(client: BotClient) {
  return async (req: Request, res: Response): Promise<void> => {
    const guildId = requireParam(req.params.guildId, 'guildId');
    const audit = await findGuildAdmins(client, guildId);
    if (!audit) throw notFound(`Guild "${guildId}" was not found.`);
    res.json(ok(audit));
  };
}

export function listBots(client: BotClient) {
  return async (req: Request, res: Response): Promise<void> => {
    const guildId = requireParam(req.params.guildId, 'guildId');
    const audit = await findGuildBots(client, guildId);
    if (!audit) throw notFound(`Guild "${guildId}" was not found.`);
    res.json(ok(audit));
  };
}
