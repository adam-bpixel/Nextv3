import { ContainerBuilder, type User } from 'discord.js';
import config from '../../../core/config';
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

function dangerLine(entry: MutualGuildEntry): string {
  return entry.dangerous.length
    ? entry.dangerous.map((p) => `- \`${formatPermission(p)}\``).join('\n')
    : '✅ None';
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
    .addTextDisplayComponents(text(`# ${FULLCHECK_ICON} __Full check — ${user.tag}__\n-# Across ${totalPages} shared server(s)`))
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
          `- __Members:__ \`${entry.members.toLocaleString()}\``,
        entry.iconURL ?? avatar,
      ),
    )
    .addSeparatorComponents(sep())
    .addTextDisplayComponents(text(`## ${SERVERS_ICON} Dangerous permissions`))
    .addSeparatorComponents(sep())
    .addTextDisplayComponents(text(dangerLine(entry)));

  if (totalPages > 1) {
    container.addSeparatorComponents(sep()).addActionRowComponents(navRow('fc', invokerId, user.id, safeIndex, totalPages));
  }

  return toPage(container);
}
