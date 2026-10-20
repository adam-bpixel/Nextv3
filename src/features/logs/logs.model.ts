import db from '../../core/db';
import { isRecord } from '../../core/json';

const COLLECTION = 'guildLogs';

export interface LogEventDef {
  key: string;
  label: string;
}

export interface LogCategoryDef {
  key: string;
  label: string;
  events: readonly LogEventDef[];
}

function events(...pairs: readonly (readonly [string, string])[]): LogEventDef[] {
  return pairs.map(([key, label]) => ({ key, label }));
}

export const LOG_CATEGORIES: readonly LogCategoryDef[] = [
  {
    key: 'role_events',
    label: 'Role Events',
    events: events(['role_created', 'Role Created'], ['role_deleted', 'Role Deleted'], ['role_updated', 'Role Updated']),
  },
  {
    key: 'member_events',
    label: 'Member Events',
    events: events(
      ['member_banned', 'Member Banned'],
      ['member_joined', 'Member Joined'],
      ['member_kicked', 'Member Kicked'],
      ['member_left', 'Member Left'],
      ['member_timeout', 'Member Timeout'],
      ['member_unbanned', 'Member Unbanned'],
      ['members_pruned', 'Members Pruned'],
      ['nickname_changed', 'Nickname Changed'],
      ['role_given', 'Role Given'],
      ['role_removed', 'Role Removed'],
    ),
  },
  {
    key: 'channel_events',
    label: 'Channel Events',
    events: events(['channel_created', 'Channel Created'], ['channel_deleted', 'Channel Deleted'], ['channel_updated', 'Channel Updated']),
  },
  {
    key: 'message_events',
    label: 'Message Events',
    events: events(['message_deleted', 'Message Deleted'], ['messages_bulk_deleted', 'Messages Bulk Deleted'], ['message_edited', 'Message Edited']),
  },
  {
    key: 'webhook_events',
    label: 'Webhook Events',
    events: events(['webhook_created', 'Webhook Created'], ['webhook_updated', 'Webhook Updated'], ['webhook_deleted', 'Webhook Deleted']),
  },
  {
    key: 'integration_events',
    label: 'Integration Events',
    events: events(
      ['integration_created', 'Integration Created'],
      ['integration_updated', 'Integration Updated'],
      ['integration_deleted', 'Integration Deleted'],
      ['bot_added', 'Bot Added'],
    ),
  },
  {
    key: 'invite_events',
    label: 'Invite Events',
    events: events(['invite_created', 'Invite Created'], ['invite_deleted', 'Invite Deleted']),
  },
  {
    key: 'voice_events',
    label: 'Voice Events',
    events: events(
      ['voice_joined', 'Voice Joined'],
      ['voice_left', 'Voice Left'],
      ['voice_moved', 'Voice Moved'],
      ['voice_server_mute', 'Server Mute'],
      ['voice_server_deaf', 'Server Deafen'],
    ),
  },
  {
    key: 'thread_events',
    label: 'Thread Events',
    events: events(['thread_created', 'Thread Created'], ['thread_deleted', 'Thread Deleted'], ['thread_updated', 'Thread Updated']),
  },
  {
    key: 'server_events',
    label: 'Server Events',
    events: events(
      ['server_updated', 'Server Updated'],
      ['event_created', 'Event Created'],
      ['event_updated', 'Event Updated'],
      ['event_deleted', 'Event Deleted'],
    ),
  },
  {
    key: 'emoji_sticker_events',
    label: 'Stickers & Emoji Events',
    events: events(
      ['emoji_created', 'Emoji Created'],
      ['emoji_updated', 'Emoji Updated'],
      ['emoji_deleted', 'Emoji Deleted'],
      ['sticker_created', 'Sticker Created'],
      ['sticker_updated', 'Sticker Updated'],
      ['sticker_deleted', 'Sticker Deleted'],
    ),
  },
  {
    key: 'automod_events',
    label: 'AutoMod Events',
    events: events(
      ['automod_rule_created', 'Rule Created'],
      ['automod_rule_updated', 'Rule Updated'],
      ['automod_rule_deleted', 'Rule Deleted'],
      ['automod_blocked', 'Message Blocked'],
    ),
  },
  {
    key: 'soundboard_events',
    label: 'Soundboard Events',
    events: events(['sound_created', 'Sound Created'], ['sound_updated', 'Sound Updated'], ['sound_deleted', 'Sound Deleted']),
  },
] as const;

export function categoryOf(key: string): LogCategoryDef | undefined {
  return LOG_CATEGORIES.find((category) => category.key === key);
}

export function eventLabel(eventKey: string): string {
  for (const category of LOG_CATEGORIES) {
    const event = category.events.find((candidate) => candidate.key === eventKey);
    if (event) return event.label;
  }
  return eventKey;
}

export function categoryOfEvent(eventKey: string): LogCategoryDef | undefined {
  return LOG_CATEGORIES.find((category) => category.events.some((event) => event.key === eventKey));
}

export interface LogEventSetting {
  channelId: string;
  enabled: boolean;
}

export interface GuildLogsConfig {
  events: Record<string, LogEventSetting>;
}

function asConfig(value: unknown): GuildLogsConfig {
  if (!isRecord(value) || !isRecord(value.events)) return { events: {} };
  return { events: value.events as Record<string, LogEventSetting> };
}

export async function getGuildLogsConfig(guildId: string): Promise<GuildLogsConfig> {
  return asConfig(await db.get(COLLECTION, guildId));
}

export async function setLogEventChannel(guildId: string, eventKeys: readonly string[], channelId: string): Promise<GuildLogsConfig> {
  const config = await getGuildLogsConfig(guildId);
  const next: GuildLogsConfig = { events: { ...config.events } };
  for (const key of eventKeys) next.events[key] = { channelId, enabled: true };
  await db.set(COLLECTION, guildId, next);
  return next;
}

export async function setLogEventEnabled(guildId: string, eventKey: string, enabled: boolean): Promise<GuildLogsConfig> {
  const config = await getGuildLogsConfig(guildId);
  const existing = config.events[eventKey];
  if (!existing) return config;
  const next: GuildLogsConfig = { events: { ...config.events, [eventKey]: { ...existing, enabled } } };
  await db.set(COLLECTION, guildId, next);
  return next;
}

const CACHE_TTL_MS = 30_000;
const channelCache = new Map<string, { at: number; channels: Record<string, string> }>();

export async function activeLogChannels(guildId: string): Promise<Record<string, string>> {
  const hit = channelCache.get(guildId);
  if (hit && Date.now() - hit.at < CACHE_TTL_MS) return hit.channels;
  const config = await getGuildLogsConfig(guildId);
  const channels: Record<string, string> = {};
  for (const [key, setting] of Object.entries(config.events)) {
    if (setting.enabled) channels[key] = setting.channelId;
  }
  channelCache.set(guildId, { at: Date.now(), channels });
  return channels;
}

export function forgetGuildLogs(guildId: string): void {
  channelCache.delete(guildId);
}
