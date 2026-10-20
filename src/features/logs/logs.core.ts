import {
  ContainerBuilder,
  MessageFlags,
  PermissionFlagsBits,
  PermissionsBitField,
  SeparatorBuilder,
  TextDisplayBuilder,
  type AuditLogEvent,
  type Guild,
  type GuildAuditLogsEntry,
  type PermissionResolvable,
} from 'discord.js';
import type { ReplyPayload } from '../../core/context';
import { activeLogChannels, categoryOfEvent } from './logs.model';

export type LogKind = 'create' | 'delete' | 'update' | 'warn' | 'info';
export type LogFieldValue = string | number | null | undefined;

export interface LogCardSpec {
  title: string;
  kind?: LogKind | undefined;
  fields?: readonly (readonly [string, LogFieldValue])[] | undefined;
  actor?: string | undefined;
  actorLabel?: string | undefined;
  reason?: string | undefined;
  event?: string | undefined;
}

export type LogBuilder = () => Promise<LogCardSpec | null>;

export const mention = (id: string): string => `<@${id}> \`${id}\``;
export const human = (name: string): string => name.replace(/([a-z])([A-Z])/g, '$1 $2');
export const yesNo = (value: boolean | null | undefined): string => (value ? 'Yes' : 'No');
export const time = (ms: number): string => `<t:${Math.floor(ms / 1000)}:F>`;

export function clip(value: LogFieldValue, max = 900): string {
  const text = String(value);
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}

type ChangeValue = string | number | boolean | null | undefined;

function describe(value: ChangeValue): string {
  return value === null || value === undefined ? 'None' : String(value);
}

export function changes(pairs: readonly (readonly [string, ChangeValue, ChangeValue])[]): [string, string][] {
  return pairs
    .filter(([, before, after]) => before !== after)
    .map(([label, before, after]) => [label, `${describe(before)} → ${describe(after)}`] as [string, string]);
}

function permissionNames(bits: readonly string[]): string {
  return bits.map(human).join(', ');
}

export function permissionChanges(before: PermissionResolvable, after: PermissionResolvable): [string, string][] {
  const oldPerms = new PermissionsBitField(before);
  const newPerms = new PermissionsBitField(after);
  const added = permissionNames(oldPerms.missing(newPerms));
  const removed = permissionNames(newPerms.missing(oldPerms));
  return ([['Permissions added', added], ['Permissions removed', removed]] as [string, string][]).filter(([, list]) => list);
}

const sleep = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));
const claimedEntries = new Set<string>();

export async function audit<T extends AuditLogEvent>(
  guild: Guild,
  types: readonly T[],
  match: (entry: GuildAuditLogsEntry<T>) => boolean = () => true,
  options: { claim?: boolean } = {},
): Promise<GuildAuditLogsEntry<T> | null> {
  if (!guild.members.me?.permissions.has(PermissionFlagsBits.ViewAuditLog)) return null;
  await sleep(900);
  const [firstType] = types;
  const fetchOptions = types.length === 1 && firstType !== undefined ? { type: firstType, limit: 10 } : { limit: 15 };
  const logs = await guild.fetchAuditLogs(fetchOptions).catch(() => null);
  if (!logs) return null;
  const now = Date.now();
  const entries = logs.entries as ReadonlyMap<string, GuildAuditLogsEntry<T>>;
  const entry = [...entries.values()].find((candidate) =>
    types.includes(candidate.action) &&
    now - candidate.createdTimestamp < 20_000 &&
    !(options.claim && claimedEntries.has(candidate.id)) &&
    match(candidate),
  );
  if (entry && options.claim) {
    claimedEntries.add(entry.id);
    setTimeout(() => claimedEntries.delete(entry.id), 60_000).unref();
  }
  return entry ?? null;
}

export function actorText(entry: GuildAuditLogsEntry<AuditLogEvent> | null): string {
  return entry?.executorId ? mention(entry.executorId) : 'Unknown';
}

export function done(entry: GuildAuditLogsEntry<AuditLogEvent> | null, extra: LogCardSpec): LogCardSpec {
  const reason = entry?.reason ?? undefined;
  return { actor: actorText(entry), reason, ...extra };
}

const PALETTE: Record<string, Record<LogKind, number>> = {
  role_events: { create: 0x3fd67e, delete: 0xff5d73, update: 0xffb347, warn: 0xffd23f, info: 0x6c8cff },
  member_events: { create: 0x2fe0a2, delete: 0xe5384f, update: 0xffa63d, warn: 0xffc933, info: 0x5b9dff },
  channel_events: { create: 0x4ad8c7, delete: 0xff6b6b, update: 0xffc14d, warn: 0xffd23f, info: 0x4dabf7 },
  message_events: { create: 0x7ddc5a, delete: 0xff4d6d, update: 0xf7b731, warn: 0xffd23f, info: 0x74a9ff },
  webhook_events: { create: 0x5bd6a0, delete: 0xf0506e, update: 0xffaa5a, warn: 0xffd23f, info: 0x66b3ff },
  integration_events: { create: 0x3ecfb2, delete: 0xe8455f, update: 0xffb86b, warn: 0xffd23f, info: 0x5ec2ff },
  invite_events: { create: 0x8fe36b, delete: 0xff6f7d, update: 0xffc766, warn: 0xffd23f, info: 0x7c9bff },
  voice_events: { create: 0x33d4b8, delete: 0xff5c8a, update: 0xff9f43, warn: 0xffc933, info: 0x8b7bff },
  thread_events: { create: 0x6fdc8c, delete: 0xff7285, update: 0xffbe55, warn: 0xffd23f, info: 0x7d8bff },
  server_events: { create: 0x9ae65c, delete: 0xdc3c55, update: 0xf5a623, warn: 0xffd23f, info: 0x5c7cfa },
  emoji_sticker_events: { create: 0x5fdc9c, delete: 0xff5a64, update: 0xffb03b, warn: 0xffd23f, info: 0x6ea8ff },
  automod_events: { create: 0x4fd18b, delete: 0xc92a45, update: 0xff9a3c, warn: 0xffab00, info: 0x6b8afd },
  soundboard_events: { create: 0x44e0a8, delete: 0xf2557a, update: 0xffa94d, warn: 0xffd23f, info: 0x9a8cff },
};
const EVENT_COLOR: Record<string, number> = {
  member_banned: 0xb3122f,
  member_kicked: 0xff7043,
  member_left: 0xff8a9b,
  member_timeout: 0xffc107,
  members_pruned: 0xa8102e,
  messages_bulk_deleted: 0xa8102e,
  automod_blocked: 0xffab00,
  role_given: 0x5ee6a8,
  role_removed: 0xff9aa8,
  voice_moved: 0x7c8cff,
};
const DEFAULT_COLOR: Record<LogKind, number> = { create: 0x57f287, delete: 0xed4245, update: 0xfaa61a, warn: 0xfee75c, info: 0x5865f2 };

function colorOf(eventKey: string, kind: LogKind): number {
  const eventColor = EVENT_COLOR[eventKey];
  if (eventColor !== undefined) return eventColor;
  const category = categoryOfEvent(eventKey);
  return (category && PALETTE[category.key]?.[kind]) ?? DEFAULT_COLOR[kind];
}

function render(spec: LogCardSpec, eventKey: string): ReplyPayload {
  const body = (spec.fields ?? [])
    .filter(([, value]) => value !== null && value !== undefined && value !== '')
    .map(([label, value]) => `- -# **__${label}__** · ${clip(value)}`)
    .join('\n');
  const who = [
    spec.actor ? `- -# **__${spec.actorLabel ?? 'Executor'}__** · ${spec.actor}` : null,
    spec.reason ? `- -# **__Reason__** · ${clip(spec.reason, 500)}` : null,
  ]
    .filter((line): line is string => line !== null)
    .join('\n');

  const container = new ContainerBuilder().setAccentColor(colorOf(eventKey, spec.kind ?? 'info'));
  container.addTextDisplayComponents(new TextDisplayBuilder().setContent(`# ${spec.title}`));
  container.addSeparatorComponents(new SeparatorBuilder());
  if (body) {
    container.addTextDisplayComponents(new TextDisplayBuilder().setContent(body));
    container.addSeparatorComponents(new SeparatorBuilder());
  }
  if (who) {
    container.addTextDisplayComponents(new TextDisplayBuilder().setContent(who));
    container.addSeparatorComponents(new SeparatorBuilder());
  }
  container.addTextDisplayComponents(new TextDisplayBuilder().setContent(`-# ${time(Date.now())}`));

  return {
    components: [container.toJSON()],
    flags: MessageFlags.IsComponentsV2,
    allowedMentions: { parse: [] },
  };
}

export async function emit(guild: Guild, eventKeys: string | readonly string[], build: LogBuilder): Promise<void> {
  const keys: readonly string[] = Array.isArray(eventKeys) ? eventKeys : [eventKeys];
  try {
    const configured: Record<string, string> = await activeLogChannels(guild.id);
    if (!keys.some((key) => Boolean(configured[key]))) return;
    const spec = await build();
    if (!spec) return;
    const fallbackKey: string | undefined = keys[0];
    const eventKey: string | undefined = spec.event ?? fallbackKey;
    const channelId: string | undefined = eventKey ? configured[eventKey] : undefined;
    if (!channelId) return;
    const channel = guild.channels.cache.get(channelId) ?? (await guild.channels.fetch(channelId).catch(() => null));
    if (!channel?.isTextBased() || !channel.isSendable()) return;
    await channel.send(render(spec, eventKey ?? fallbackKey ?? 'info')).catch(() => {});
  } catch (error) {
    console.error(`Logs (${keys.join(',')}) failed:`, error);
  }
}
