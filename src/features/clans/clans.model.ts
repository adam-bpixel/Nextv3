import db from '../../core/db';

const CLANS = 'clans';
const SETTINGS = 'clanSettings';
const COUNTERS = 'clanCounters';

export interface ClanWarning { by: string; reason: string; at: number }
export interface Clan {
  guildId: string; id: string; name: string; leaderId: string; coLeaderIds: string[]; memberIds: string[];
  roleId: string | null; memberLimit: number; coLeaderLimit: number; hoursMs: Record<string, number>;
  warnings: ClanWarning[]; createdAt: number; tag?: string; tagPosition?: 'prefix' | 'suffix'; color?: string;
  chatChannelId?: string | null; voiceChannelId?: string | null; avatarUrl?: string | null;
}
export interface ClanSettings {
  managerRoleIds: string[]; leaderRoleId: string | null; coLeaderRoleId: string | null; logChannelId: string | null;
  voiceCategoryId: string | null; leaderboardChannelId: string | null; leaderboardMessageId: string | null;
}
const emptySettings = (): ClanSettings => ({
  managerRoleIds: [], leaderRoleId: null, coLeaderRoleId: null, logChannelId: null,
  voiceCategoryId: null, leaderboardChannelId: null, leaderboardMessageId: null,
});
export const clanKey = (guildId: string, id: string): string => `${guildId}:${id}`;
export async function getClan(guildId: string, id: string): Promise<Clan | null> {
  const value = await db.get(CLANS, clanKey(guildId, id));
  return value && typeof value === 'object' ? value as Clan : null;
}
export async function saveClan(clan: Clan): Promise<void> { await db.set(CLANS, clanKey(clan.guildId, clan.id), clan); }
export async function deleteClan(guildId: string, id: string): Promise<void> { await db.delete(CLANS, clanKey(guildId, id)); }
export async function listClans(guildId: string): Promise<Clan[]> {
  return (await db.all(CLANS)).filter((entry) => entry.key.startsWith(`${guildId}:`)).map((entry) => entry.value as Clan);
}
export async function clanOf(guildId: string, userId: string): Promise<Clan | null> {
  return (await listClans(guildId)).find((clan) => clan.leaderId === userId || clan.coLeaderIds.includes(userId) || clan.memberIds.includes(userId)) ?? null;
}
export function rankOf(clan: Clan, userId: string): 'leader' | 'co-leader' | 'member' | null {
  if (clan.leaderId === userId) return 'leader';
  if (clan.coLeaderIds.includes(userId)) return 'co-leader';
  if (clan.memberIds.includes(userId)) return 'member';
  return null;
}
export async function settingsOf(guildId: string): Promise<ClanSettings> {
  const value = await db.get(SETTINGS, guildId);
  return value && typeof value === 'object' ? { ...emptySettings(), ...(value as Partial<ClanSettings>) } : emptySettings();
}
export async function saveSettings(guildId: string, settings: ClanSettings): Promise<void> { await db.set(SETTINGS, guildId, settings); }
export async function nextClanId(guildId: string): Promise<string> {
  const current = Number(await db.get(COUNTERS, guildId)) || 0;
  const next = current + 1;
  await db.set(COUNTERS, guildId, next);
  return String(next);
}
export async function setClanHours(guildId: string, clanId: string, userId: string, ms: number): Promise<void> {
  const clan = await getClan(guildId, clanId); if (!clan) return;
  clan.hoursMs[userId] = Math.max(0, ms); await saveClan(clan);
}
