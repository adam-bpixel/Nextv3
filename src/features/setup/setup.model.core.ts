import db from '../../core/db';
import { isRecord } from '../../core/json';
import type { LevelKind } from '../levels/levels.model';

export type { LevelKind };

export const COLLECTION = 'guildSetup';

export const MAX_SETUP_ROLE_LIST = 10;

export interface JailSetup {
  jailerRoleIds: string[];
  jailedRoleId: string | null;
  logsChannelId: string | null;
}

export interface VerificationSetup {
  verifiedRoleId: string | null;
  verifiedFemaleRoleId: string | null;
  unverifiedRoleId: string | null;
  verificatorRoleIds: string[];
  logsChannelId: string | null;
}

export interface WarnSetup {
  firstWarnRoleId: string | null;
  secondWarnRoleId: string | null;
  lastWarnRoleId: string | null;
  warnerRoleIds: string[];
  logsChannelId: string | null;
}

export interface MuteSetup {
  muterRoleIds: string[];
  mutedRoleId: string | null;
  logsChannelId: string | null;
}

export interface TicketCategory {
  id: string;
  name: string;
  description?: string;
  emoji?: string;
}

export type TicketPanelStyle = 'button' | 'menu';

export interface TicketSettings {
  categoryId: string;
  logChannelId: string;
  panelStyle: TicketPanelStyle;
  panelChannelId?: string;
  panelImageURL?: string;
}

export interface PanelText {
  title?: string;
  text?: string;
}

export interface OpenTicket {
  channelId: string;
  userId: string;
  categoryId: string;
}

export interface ApplyCategory {
  id: string;
  name: string;
  description?: string;
  emoji?: string;
  questions: string[];
}

export interface ApplySettings {
  logChannelId: string;
  panelStyle: TicketPanelStyle;
  managerRoleIds: string[];
  panelChannelId?: string;
  panelImageURL?: string;
}

export interface PendingApply {
  userId: string;
  categoryId: string;
  messageId: string;
  channelId: string;
  answers: string[];
}

export type AutoReplyMatchType = 'exact' | 'contains';

export interface AutoReplyEntry {
  id: string;
  trigger: string;
  response: string;
  matchType: AutoReplyMatchType;
}

export type SelfRoleMode = 'single' | 'multiple';
export type SelfRolePanelStyle = 'embed' | 'components';
export type SelfRolePanelInteraction = 'buttons' | 'select_menu';

export interface SelfRoleButton {
  roleId: string;
  label: string;
  emoji?: string;
}

export interface SelfRoleSection {
  id: string;
  name: string;
  mode: SelfRoleMode;
  buttons: SelfRoleButton[];
  channelId?: string;
  description?: string;
  imageURL?: string;
  color?: string;
  panelStyle?: SelfRolePanelStyle;
  panelInteraction?: SelfRolePanelInteraction;
}

export interface SelfRoleSettings {
  logChannelId?: string;
}

export interface LevelRoleEntry {
  id: string;
  roleId: string;
  level: number;
  kind: LevelKind;
}

export interface VoiceCountSettings {
  enabled: boolean;
  channelId: string | null;
}

export interface GuildSetup {
  jail: JailSetup;
  verification: VerificationSetup;
  warn: WarnSetup;
  mute: MuteSetup;
  ticketCategories?: TicketCategory[];
  ticket?: TicketSettings;
  ticketPanelText?: PanelText;
  openTickets?: OpenTicket[];
  applyCategories?: ApplyCategory[];
  apply?: ApplySettings;
  applyPanelText?: PanelText;
  pendingApplies?: PendingApply[];
  autoReplies?: AutoReplyEntry[];
  autoRoleIds?: string[];
  selfRoleSections?: SelfRoleSection[];
  selfRole?: SelfRoleSettings;
  levelRoles?: LevelRoleEntry[];
  voiceCount?: VoiceCountSettings;
  blacklistedChannelIds?: string[];
  checkerRoleIds?: string[];
}

function asRecord(value: unknown): Record<string, unknown> {
  return isRecord(value) ? value : {};
}

export function toStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];
}

export function toNullableString(value: unknown): string | null {
  return typeof value === 'string' ? value : null;
}

// Older records were saved with a single `xRoleId` string before these became `xRoleIds` arrays;
// normalizing on every read/write migrates those documents in place instead of crashing on `.length`.
export function normalizeJailSetup(value: unknown): JailSetup {
  const raw = isRecord(value) ? value : {};
  const legacyJailer = typeof raw.jailerRoleId === 'string' ? [raw.jailerRoleId] : [];
  return {
    jailerRoleIds: raw.jailerRoleIds !== undefined ? toStringArray(raw.jailerRoleIds) : legacyJailer,
    jailedRoleId: toNullableString(raw.jailedRoleId),
    logsChannelId: toNullableString(raw.logsChannelId),
  };
}

export function normalizeVerificationSetup(value: unknown): VerificationSetup {
  const raw = isRecord(value) ? value : {};
  const legacyVerificator = typeof raw.verificatorRoleId === 'string' ? [raw.verificatorRoleId] : [];
  return {
    verifiedRoleId: toNullableString(raw.verifiedRoleId),
    verifiedFemaleRoleId: toNullableString(raw.verifiedFemaleRoleId),
    unverifiedRoleId: toNullableString(raw.unverifiedRoleId),
    verificatorRoleIds: raw.verificatorRoleIds !== undefined ? toStringArray(raw.verificatorRoleIds) : legacyVerificator,
    logsChannelId: toNullableString(raw.logsChannelId),
  };
}

export function normalizeWarnSetup(value: unknown): WarnSetup {
  const raw = isRecord(value) ? value : {};
  const legacyWarner = typeof raw.warnerRoleId === 'string' ? [raw.warnerRoleId] : [];
  return {
    firstWarnRoleId: toNullableString(raw.firstWarnRoleId),
    secondWarnRoleId: toNullableString(raw.secondWarnRoleId),
    lastWarnRoleId: toNullableString(raw.lastWarnRoleId),
    warnerRoleIds: raw.warnerRoleIds !== undefined ? toStringArray(raw.warnerRoleIds) : legacyWarner,
    logsChannelId: toNullableString(raw.logsChannelId),
  };
}

export function normalizeMuteSetup(value: unknown): MuteSetup {
  const raw = isRecord(value) ? value : {};
  const legacyMuter = typeof raw.muterRoleId === 'string' ? [raw.muterRoleId] : [];
  return {
    muterRoleIds: raw.muterRoleIds !== undefined ? toStringArray(raw.muterRoleIds) : legacyMuter,
    mutedRoleId: toNullableString(raw.mutedRoleId),
    logsChannelId: toNullableString(raw.logsChannelId),
  };
}

// Normalizes jail/verification/warn/mute on every read so older documents saved under the previous
// single-role shape (e.g. `verificatorRoleId` instead of `verificatorRoleIds`) never reach a consumer
// expecting the current shape, regardless of whether they go through a feature-specific getter below.
export async function getGuildSetup(guildId: string): Promise<GuildSetup> {
  const raw = asRecord(await db.get(COLLECTION, guildId));
  return {
    ...(raw as Partial<GuildSetup>),
    jail: normalizeJailSetup(raw.jail),
    verification: normalizeVerificationSetup(raw.verification),
    warn: normalizeWarnSetup(raw.warn),
    mute: normalizeMuteSetup(raw.mute),
  };
}
