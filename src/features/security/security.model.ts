import db from '../../core/db';
import { MS_PER_DAY } from '../../core/format';
import { isRecord } from '../../core/json';

const COLLECTION = 'guildSecurity';

export const DEFAULT_ALT_TRACKER_MIN_AGE_MS = 7 * MS_PER_DAY;

export interface AltTrackerSettings {
  enabled: boolean;
  channelId: string | null;
  minAccountAgeMs: number;
}

export interface GuildSecurity {
  antibots: boolean;
  antilink: boolean;
  alttracker: AltTrackerSettings;
}

function asGuildSecurity(value: unknown): GuildSecurity {
  const record = isRecord(value) ? value : {};
  const alttracker = isRecord(record.alttracker) ? record.alttracker : {};
  return {
    antibots: record.antibots === true,
    antilink: record.antilink === true,
    alttracker: {
      enabled: alttracker.enabled === true,
      channelId: typeof alttracker.channelId === 'string' ? alttracker.channelId : null,
      minAccountAgeMs: typeof alttracker.minAccountAgeMs === 'number' && alttracker.minAccountAgeMs > 0
        ? alttracker.minAccountAgeMs
        : DEFAULT_ALT_TRACKER_MIN_AGE_MS,
    },
  };
}

export async function getGuildSecurity(guildId: string): Promise<GuildSecurity> {
  return asGuildSecurity(await db.get(COLLECTION, guildId));
}

export async function setAntibots(guildId: string, enabled: boolean): Promise<void> {
  const current = await getGuildSecurity(guildId);
  await db.set(COLLECTION, guildId, { ...current, antibots: enabled });
}

export async function setAntilink(guildId: string, enabled: boolean): Promise<void> {
  const current = await getGuildSecurity(guildId);
  await db.set(COLLECTION, guildId, { ...current, antilink: enabled });
}

export async function setAltTrackerChannel(guildId: string, channelId: string): Promise<void> {
  const current = await getGuildSecurity(guildId);
  await db.set(COLLECTION, guildId, { ...current, alttracker: { ...current.alttracker, enabled: true, channelId } });
}

export async function setAltTrackerEnabled(guildId: string, enabled: boolean): Promise<void> {
  const current = await getGuildSecurity(guildId);
  await db.set(COLLECTION, guildId, { ...current, alttracker: { ...current.alttracker, enabled } });
}

export async function setAltTrackerMinAge(guildId: string, minAccountAgeMs: number): Promise<void> {
  const current = await getGuildSecurity(guildId);
  await db.set(COLLECTION, guildId, { ...current, alttracker: { ...current.alttracker, minAccountAgeMs } });
}
