import type { Client, Guild, GuildMember, PartialGuildMember, VoiceState } from 'discord.js';
import db from '../../core/db';
import { refreshClanLeaderboard } from './logic';
import { clanOf, deleteClan, listClans, saveClan, settingsOf } from './clans.model';

interface Session { guildId: string; userId: string; clanId: string; startedAt: number }
const SESSIONS = 'clanVoiceSessions';
const sessionKey = (guildId: string, userId: string): string => `${guildId}:${userId}`;

async function finishSession(guild: Guild, userId: string, now: number): Promise<void> {
  const key = sessionKey(guild.id, userId);
  const session = await db.get(SESSIONS, key) as Session | undefined;
  if (!session) return;
  const clan = (await listClans(guild.id)).find((item) => item.id === session.clanId);
  if (clan) {
    clan.hoursMs[userId] = (clan.hoursMs[userId] ?? 0) + Math.max(0, now - session.startedAt);
    await saveClan(clan);
    await refreshClanLeaderboard(guild);
  }
  await db.delete(SESSIONS, key);
}

async function beginSession(state: VoiceState, now: number): Promise<void> {
  const { guild, member, channelId } = state;
  if (!member || member.user.bot || !channelId) return;
  const clan = await clanOf(guild.id, member.id);
  if (!clan || clan.voiceChannelId !== channelId) return;
  const session: Session = { guildId: guild.id, userId: member.id, clanId: clan.id, startedAt: now };
  await db.set(SESSIONS, sessionKey(guild.id, member.id), session);
}

export async function trackClanVoiceChange(newState: VoiceState): Promise<void> {
  const userId = newState.id;
  await finishSession(newState.guild, userId, Date.now());
  await beginSession(newState, Date.now());
}

export async function rehydrateClanVoiceSessions(client: Client): Promise<void> {
  for (const entry of await db.all(SESSIONS)) await db.delete(SESSIONS, entry.key);
  for (const guild of client.guilds.cache.values()) {
    for (const state of guild.voiceStates.cache.values()) await beginSession(state, Date.now());
  }
}

export async function handleClanMemberLeave(member: GuildMember | PartialGuildMember): Promise<void> {
  await finishSession(member.guild, member.id, Date.now());
  const clan = await clanOf(member.guild.id, member.id);
  if (!clan) return;
  if (clan.roleId) await member.roles.remove(clan.roleId).catch(() => undefined);
  if (clan.leaderId === member.id) {
    const successor = clan.coLeaderIds.shift() ?? clan.memberIds.shift();
    if (!successor) {
      if (clan.roleId) await member.guild.roles.delete(clan.roleId, 'Clan leader left without a successor').catch(() => undefined);
      if (clan.voiceChannelId) await member.guild.channels.delete(clan.voiceChannelId, 'Clan leader left without a successor').catch(() => undefined);
      await deleteClan(clan.guildId, clan.id);
      await refreshClanLeaderboard(member.guild);
      return;
    }
    clan.leaderId = successor;
    clan.coLeaderIds = clan.coLeaderIds.filter((id) => id !== successor);
    clan.memberIds = clan.memberIds.filter((id) => id !== successor);
    const nextLeader = await member.guild.members.fetch(successor).catch(() => null);
    const settings = await settingsOf(member.guild.id);
    if (nextLeader && clan.roleId) await nextLeader.roles.add(clan.roleId).catch(() => undefined);
    if (nextLeader && settings.coLeaderRoleId && member.guild.roles.cache.has(settings.coLeaderRoleId)) await nextLeader.roles.remove(settings.coLeaderRoleId).catch(() => undefined);
    if (nextLeader && settings.leaderRoleId && member.guild.roles.cache.has(settings.leaderRoleId)) await nextLeader.roles.add(settings.leaderRoleId).catch(() => undefined);
  }
  clan.coLeaderIds = clan.coLeaderIds.filter((id) => id !== member.id);
  clan.memberIds = clan.memberIds.filter((id) => id !== member.id);
  delete clan.hoursMs[member.id];
  await saveClan(clan);
  await refreshClanLeaderboard(member.guild);
}
