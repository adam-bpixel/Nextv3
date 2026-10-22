import { ContainerBuilder, type User } from 'discord.js';
import config from '../../../core/config';
import type { PermissionName } from '../../../core/permissions';
import { FULLCHECK_ICON, SERVERS_ICON } from '../../../core/emojis';
import type { MutualGuildEntry } from '../mutualGuilds';
import {
  type CheckerPage,
  THUMBNAIL_SIZE,
  clampIndex,
  emptyPage,
  formatPermission,
  headerSection,
  navRow,
  sep,
  statusOf,
  text,
  toPage,
} from './shared';

const TOP_DANGEROUS_PERMISSIONS: readonly PermissionName[] = [
  'administrator',
  'manage_guild',
  'manage_roles',
  'manage_channels',
  'kick_members',
  'ban_members',
  'manage_messages',
  'manage_webhooks',
  'manage_guild_expressions',
  'moderate_members',
  'mention_everyone',
];

function dangerLine(entry: MutualGuildEntry): string {
  return TOP_DANGEROUS_PERMISSIONS
    .map((p) => (entry.dangerous.includes(p) ? `- \`${formatPermission(p)}\`` : `- ~~${formatPermission(p)}~~`))
    .join('\n');
}

function rolesLine(entry: MutualGuildEntry): string {
  return entry.topRoles.length
    ? entry.topRoles.map((role) => `- \`${role.name}\` — \`${role.id}\``).join('\n')
    : 'None';
}

export function fullCheckPage(user: User, entries: readonly MutualGuildEntry[], index: number, invokerId: string): CheckerPage {
  const avatar = user.displayAvatarURL({ size: THUMBNAIL_SIZE });
  if (!entries.length) {
    return emptyPage(`${FULLCHECK_ICON} __Full check — ${user.tag}__`, `No shared servers found for <@${user.id}>.`, avatar);
  }

  const totalPages = entries.length;
  const safeIndex = clampIndex(index, totalPages);
  const entry = entries.at(safeIndex);
  if (!entry) return emptyPage(`${FULLCHECK_ICON} __Full check — ${user.tag}__`, `No shared servers found for <@${user.id}>.`, avatar);

  const container = new ContainerBuilder()
    .setAccentColor(config.color)
    .addTextDisplayComponents(text(`# ${FULLCHECK_ICON} __Full check — ${user.tag}__`))
    .addSeparatorComponents(sep())
    .addTextDisplayComponents(text(`Page ${safeIndex + 1}/${totalPages}`))
    .addSeparatorComponents(sep())
    .addTextDisplayComponents(text(`## ${SERVERS_ICON} ${entry.name}`))
    .addSeparatorComponents(sep())
    .addSectionComponents(
      headerSection(
        `- __Target user:__ <@${user.id}>\n` +
          `- __Status:__ **${statusOf(entry)}**\n` +
          `- __Nickname:__ \`${entry.nickname ?? 'None'}\`\n` +
          `- __Joined:__ ${entry.joinedAt !== null ? `<t:${entry.joinedAt}:R>` : 'Unknown'}\n` +
          `- __Members:__ \`${entry.members.toLocaleString()}\`\n` +
          `- __Shared ${totalPages === 1 ? 'server' : 'servers'}:__ \`${totalPages}\``,
        entry.iconURL ?? avatar,
      ),
    )
    .addSeparatorComponents(sep())
    .addTextDisplayComponents(text(`## ${SERVERS_ICON} __Dangerous permissions__`))
    .addSeparatorComponents(sep())
    .addTextDisplayComponents(text(dangerLine(entry)))
    .addSeparatorComponents(sep())
    .addTextDisplayComponents(text(`## ${SERVERS_ICON} Highest roles`))
    .addSeparatorComponents(sep())
    .addTextDisplayComponents(text(rolesLine(entry)));

  if (totalPages > 1) {
    container.addSeparatorComponents(sep()).addActionRowComponents(navRow('fc', invokerId, user.id, safeIndex, totalPages));
  }

  return toPage(container);
}
