import db from '../../core/db';

const DIRECT_KEY_COLLECTIONS = [
  'guildThemes',
  'guildPrefixes',
  'guildSecurity',
  'guildSetup',
  'guildLogs',
  'premiumGuilds',
  'guildProfiles',
  'suggestionSettings',
  'gameFinderSettings',
  'clanSettings',
  'clanCounters',
] as const;

const PREFIXED_KEY_COLLECTIONS = [
  'jailedMembers',
  'jailLogs',
  'warnings',
  'levels',
  'clans',
  'gameFinderCooldowns',
  'inviteJoins',
  'verificationLogs',
  'clanVoiceSessions',
  'gameAliases',
] as const;

async function clearCollections(guildId: string, direct: readonly string[], prefixed: readonly string[]): Promise<number> {
  let cleared = 0;
  for (const collection of direct) {
    if (await db.get(collection, guildId)) {
      await db.delete(collection, guildId);
      cleared += 1;
    }
  }
  for (const collection of prefixed) {
    const prefix = `${guildId}:`;
    for (const entry of await db.all(collection)) {
      if (!entry.key.startsWith(prefix)) continue;
      await db.delete(collection, entry.key);
      cleared += 1;
    }
  }
  return cleared;
}

export async function clearGuildData(guildId: string): Promise<number> {
  return clearCollections(guildId, DIRECT_KEY_COLLECTIONS, PREFIXED_KEY_COLLECTIONS);
}

export const RESET_DATA_TARGETS = ['verif', 'clans', 'top'] as const;
export type ResetDataTarget = (typeof RESET_DATA_TARGETS)[number];

export function isResetDataTarget(value: string | undefined): value is ResetDataTarget {
  return RESET_DATA_TARGETS.includes(value as ResetDataTarget);
}

const RESET_DATA_LABELS: Record<ResetDataTarget, string> = {
  verif: 'Verification logs',
  clans: 'Clans',
  top: 'Chat/voice leveling and invite stats (the data behind `top`)',
};

export function resetDataLabel(target: ResetDataTarget): string {
  return RESET_DATA_LABELS[target];
}

export async function clearGuildDataFor(guildId: string, target: ResetDataTarget): Promise<number> {
  if (target === 'verif') return clearCollections(guildId, [], ['verificationLogs']);
  if (target === 'clans') return clearCollections(guildId, ['clanSettings', 'clanCounters'], ['clans', 'clanVoiceSessions']);
  return clearCollections(guildId, [], ['levels', 'inviteJoins']);
}
