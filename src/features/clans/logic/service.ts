import type { Guild } from 'discord.js';
import config from '../../../core/config';
import { clanOf, getClan, listClans, rankOf, saveClan, saveSettings, settingsOf } from '../clans.model';
import { assignRank, duration } from './helpers';

export async function performClanAdd(guild: Guild, clanId: string, targetId: string): Promise<string | null> {
  const clan = await getClan(guild.id, clanId);
  if (!clan) return 'That clan no longer exists.';
  if (await clanOf(guild.id, targetId)) return 'That user already belongs to a clan.';
  if (clan.memberIds.length + clan.coLeaderIds.length + 1 >= clan.memberLimit) return 'This clan has reached its member limit.';
  clan.memberIds.push(targetId);
  await saveClan(clan);
  const member = await guild.members.fetch(targetId).catch(() => null);
  if (member) await assignRank(member, clan, 'member');
  return null;
}

export async function performClanPromote(guild: Guild, clanId: string, targetId: string): Promise<string | null> {
  const clan = await getClan(guild.id, clanId);
  if (!clan) return 'That clan no longer exists.';
  if (!clan.memberIds.includes(targetId)) return "That user isn't in this clan anymore.";
  if (clan.coLeaderIds.length >= clan.coLeaderLimit) return 'This clan reached its co-leader limit.';
  clan.memberIds = clan.memberIds.filter((id) => id !== targetId);
  clan.coLeaderIds.push(targetId);
  await saveClan(clan);
  const member = await guild.members.fetch(targetId).catch(() => null);
  if (member) await assignRank(member, clan, 'co-leader');
  return null;
}

export async function syncClanRoleAssignments(guild: Guild): Promise<void> {
  for (const clan of await listClans(guild.id)) {
    for (const userId of [clan.leaderId, ...clan.coLeaderIds, ...clan.memberIds]) {
      const member = await guild.members.fetch(userId).catch(() => null);
      if (member) await assignRank(member, clan, rankOf(clan, userId));
    }
  }
}

export async function refreshClanLeaderboard(guild: Guild): Promise<void> {
  const settings = await settingsOf(guild.id);
  if (!settings.leaderboardChannelId) return;
  const channel = await guild.channels.fetch(settings.leaderboardChannelId).catch(() => null);
  if (!channel?.isTextBased() || !channel.isSendable()) return;
  const rows = (await listClans(guild.id))
    .sort((a, b) => Object.values(b.hoursMs).reduce((x, y) => x + y, 0) - Object.values(a.hoursMs).reduce((x, y) => x + y, 0))
    .slice(0, 10);
  const body = rows.map((clan, i) => `- **${i + 1}. ${clan.name}** · ${duration(Object.values(clan.hoursMs).reduce((x, y) => x + y, 0))}`).join('\n') || 'No clan activity has been recorded yet.';
  const embed = { title: `Clan Leaderboard · ${guild.name}`, description: body, color: config.color };
  if (settings.leaderboardMessageId) {
    const message = await channel.messages.fetch(settings.leaderboardMessageId).catch(() => null);
    if (message) { await message.edit({ embeds: [embed] }).catch(() => undefined); return; }
  }
  const sent = await channel.send({ embeds: [embed] }).catch(() => null);
  if (sent) await saveSettings(guild.id, { ...settings, leaderboardMessageId: sent.id });
}
