import { ActionRowBuilder, ButtonBuilder, ButtonStyle, ContainerBuilder, MessageFlags, SectionBuilder, SeparatorBuilder, TextDisplayBuilder, ThumbnailBuilder } from 'discord.js';
import type { ReplyPayload } from '../../core/context';
import { ARROW_LEFT_GOLD, ARROW_RIGHT_GOLD, numberEmoji } from '../../core/emojis';

const text = (content: string): TextDisplayBuilder => new TextDisplayBuilder().setContent(content);
const sep = (): SeparatorBuilder => new SeparatorBuilder();

function toPayload(container: ContainerBuilder, mentionUserIds: readonly string[] = []): ReplyPayload {
  return { components: [container.toJSON()], flags: MessageFlags.IsComponentsV2, allowedMentions: { parse: [], users: [...mentionUserIds] } };
}

export const CLAN_INVITE_PREFIX = 'clan:invite:';
export const CLAN_INVITE_TTL_MS = 60_000;

export function clanInviteCustomId(action: 'accept' | 'decline', clanId: string, targetId: string, createdAt: number): string {
  return `${CLAN_INVITE_PREFIX}${action}:${clanId}:${targetId}:${createdAt}`;
}

export interface ClanInviteCard {
  clanId: string;
  clanName: string;
  targetId: string;
  inviterName: string;
  status: 'pending' | 'accepted' | 'declined' | 'expired';
  createdAt: number;
}

export function clanInviteCard(accentColor: number, card: ClanInviteCard): ReplyPayload {
  const body: Record<ClanInviteCard['status'], string> = {
    pending: `- Dear <@${card.targetId}>, do you want to join **${card.clanName}**?\n- Invited by **${card.inviterName}**.\n- You have 1 minute to answer.`,
    accepted: `- <@${card.targetId}> accepted and joined **${card.clanName}**.`,
    declined: `- <@${card.targetId}> declined the invitation to **${card.clanName}**.`,
    expired: `- The invitation of <@${card.targetId}> to **${card.clanName}** has expired.`,
  };
  const container = new ContainerBuilder()
    .setAccentColor(accentColor)
    .addTextDisplayComponents(text('# Clan Invitation'))
    .addSeparatorComponents(sep())
    .addTextDisplayComponents(text(body[card.status]));
  if (card.status === 'pending') {
    container.addSeparatorComponents(sep()).addActionRowComponents(
      new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder().setCustomId(clanInviteCustomId('accept', card.clanId, card.targetId, card.createdAt)).setLabel('Yes').setStyle(ButtonStyle.Success),
        new ButtonBuilder().setCustomId(clanInviteCustomId('decline', card.clanId, card.targetId, card.createdAt)).setLabel('No').setStyle(ButtonStyle.Danger),
      ),
    );
  }
  return toPayload(container, card.status === 'pending' ? [card.targetId] : []);
}

export const CLAN_PROMOTE_PREFIX = 'clan:promote:';
export const CLAN_PROMOTE_TTL_MS = 60_000;

export function clanPromoteCustomId(action: 'confirm' | 'cancel', clanId: string, targetId: string, leaderId: string, createdAt: number): string {
  return `${CLAN_PROMOTE_PREFIX}${action}:${clanId}:${targetId}:${leaderId}:${createdAt}`;
}

export interface ClanPromoteCard {
  clanId: string;
  clanName: string;
  targetId: string;
  leaderId: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'expired';
  createdAt: number;
}

export function clanPromoteCard(accentColor: number, card: ClanPromoteCard): ReplyPayload {
  const body: Record<ClanPromoteCard['status'], string> = {
    pending: `- <@${card.leaderId}>, are you sure you want to promote <@${card.targetId}> to co-leader of **${card.clanName}**?`,
    confirmed: `- <@${card.targetId}> is now a co-leader of **${card.clanName}**.`,
    cancelled: '- Promotion cancelled.',
    expired: '- The promotion request has expired.',
  };
  const container = new ContainerBuilder()
    .setAccentColor(accentColor)
    .addTextDisplayComponents(text('# Co-Leader Promotion'))
    .addSeparatorComponents(sep())
    .addTextDisplayComponents(text(body[card.status]));
  if (card.status === 'pending') {
    container.addSeparatorComponents(sep()).addActionRowComponents(
      new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder().setCustomId(clanPromoteCustomId('confirm', card.clanId, card.targetId, card.leaderId, card.createdAt)).setLabel('Confirm').setStyle(ButtonStyle.Success),
        new ButtonBuilder().setCustomId(clanPromoteCustomId('cancel', card.clanId, card.targetId, card.leaderId, card.createdAt)).setLabel('Cancel').setStyle(ButtonStyle.Secondary),
      ),
    );
  }
  return toPayload(container, []);
}

export interface ClanInfoCard {
  id: string;
  name: string;
  leaderId: string;
  coLeaderIds: string[];
  memberCount: number;
  memberLimit: number;
  roleId: string | null;
  voiceChannelId?: string | null | undefined;
  tag?: string | undefined;
  tagPosition?: 'prefix' | 'suffix' | undefined;
  voiceActivity: string;
  warningsCount: number;
  avatarUrl?: string | null | undefined;
}

function clanIdentityBlock(card: ClanInfoCard): string {
  const lines = [
    `- __**Clan ID**__ ﹕ \`${card.id}\``,
    `- __**Leader**__ ﹕ <@${card.leaderId}>`,
    `- __**Co-Leaders**__ ﹕ ${card.coLeaderIds.length ? card.coLeaderIds.map((id) => `<@${id}>`).join(', ') : '*None*'}`,
    `- __**Members**__ ﹕ \`${card.memberCount}/${card.memberLimit}\``,
  ];
  if (card.roleId) lines.push(`- __**Role**__ ﹕ <@&${card.roleId}>`);
  if (card.voiceChannelId) lines.push(`- __**Voice Channel**__ ﹕ <#${card.voiceChannelId}>`);
  if (card.tag) lines.push(`- __**Tag**__ ﹕ \`${card.tagPosition === 'suffix' ? `${card.name} [${card.tag}]` : `[${card.tag}] ${card.name}`}\``);
  return lines.join('\n');
}

function clanActivityBlock(card: ClanInfoCard): string {
  return [`- __**Voice Activity**__ ﹕ \`${card.voiceActivity}\``, `- __**Warnings**__ ﹕ \`${card.warningsCount}\``].join('\n');
}

export function clanInfoCard(accentColor: number, card: ClanInfoCard): ReplyPayload {
  const container = new ContainerBuilder().setAccentColor(accentColor).addTextDisplayComponents(text(`# ${card.name}`)).addSeparatorComponents(sep());
  if (card.avatarUrl) {
    container.addSectionComponents(new SectionBuilder().addTextDisplayComponents(text(clanIdentityBlock(card))).setThumbnailAccessory(new ThumbnailBuilder().setURL(card.avatarUrl)));
  } else {
    container.addTextDisplayComponents(text(clanIdentityBlock(card)));
  }
  container.addSeparatorComponents(sep()).addTextDisplayComponents(text(clanActivityBlock(card)));
  return toPayload(container);
}

export interface ClanListEntry {
  id: string;
  name: string;
  memberCount: number;
  memberLimit: number;
  leaderId: string;
  roleId: string | null;
  warningsCount: number;
  avatarUrl?: string | null | undefined;
}

export const CLANS_LIST_PER_PAGE = 5;
const DEFAULT_CLAN_ICON = 'https://cdn.discordapp.com/embed/avatars/0.png';

export function clansListCustomId(invokerId: string, page: number): string {
  return `clans:page:${invokerId}:${page}`;
}

function clanListSection(rank: number, clan: ClanListEntry): SectionBuilder {
  const lines = [
    `${numberEmoji(rank)} **${clan.name}**`,
    `> **Members:** \`${clan.memberCount}/${clan.memberLimit}\``,
    `> **Leader:** <@${clan.leaderId}>`,
    `> **Role:** ${clan.roleId ? `<@&${clan.roleId}>` : '\`None\`'}`,
    `> **Warnings:** \`${clan.warningsCount}\``,
  ].join('\n');
  return new SectionBuilder().addTextDisplayComponents(text(lines)).setThumbnailAccessory(new ThumbnailBuilder().setURL(clan.avatarUrl ?? DEFAULT_CLAN_ICON));
}

export function clansListCard(accentColor: number, guildName: string, entries: readonly ClanListEntry[], page: number, invokerId: string): ReplyPayload {
  const totalPages = Math.max(1, Math.ceil(entries.length / CLANS_LIST_PER_PAGE));
  const safePage = Math.min(Math.max(page, 0), totalPages - 1);
  const start = safePage * CLANS_LIST_PER_PAGE;
  const shown = entries.slice(start, start + CLANS_LIST_PER_PAGE);

  const container = new ContainerBuilder()
    .setAccentColor(accentColor)
    .addTextDisplayComponents(text(`# Clans · ${guildName}`))
    .addSeparatorComponents(sep());

  if (!shown.length) container.addTextDisplayComponents(text('*No clans have been created yet.*'));
  else shown.forEach((clan, index) => container.addSectionComponents(clanListSection(start + index + 1, clan)));

  container.addSeparatorComponents(sep());
  container.addActionRowComponents(
    new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder().setCustomId(clansListCustomId(invokerId, safePage - 1)).setEmoji(ARROW_LEFT_GOLD).setStyle(ButtonStyle.Secondary).setDisabled(safePage <= 0),
      new ButtonBuilder().setCustomId('clans:page:noop').setLabel(`${safePage + 1} / ${totalPages}`).setStyle(ButtonStyle.Secondary).setDisabled(true),
      new ButtonBuilder().setCustomId(clansListCustomId(invokerId, safePage + 1)).setEmoji(ARROW_RIGHT_GOLD).setStyle(ButtonStyle.Secondary).setDisabled(safePage >= totalPages - 1),
    ),
  );
  return toPayload(container);
}

export interface ClanWarningEntry {
  reason: string;
  byId: string;
  at: number;
}

export function clanWarningsCard(accentColor: number, clanName: string, entries: ClanWarningEntry[]): ReplyPayload {
  const body = entries.length
    ? entries.map((warning, index) => `- **${index + 1}.** ${warning.reason} ﹕ <@${warning.byId}> • <t:${Math.floor(warning.at / 1000)}:R>`).join('\n')
    : '*This clan has no warnings.*';
  const container = new ContainerBuilder()
    .setAccentColor(accentColor)
    .addTextDisplayComponents(text(`# ${clanName} · Warnings`))
    .addSeparatorComponents(sep())
    .addTextDisplayComponents(text(body));
  return toPayload(container);
}
