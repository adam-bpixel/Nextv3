import { ContainerBuilder, type User } from 'discord.js';
import config from '../../../core/config';
import { CHECKROLES_ICON, SERVERS_ICON } from '../../../core/emojis';
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

export function rolesCheckPage(user: User, dangerous: readonly MutualGuildEntry[], index: number, invokerId: string): CheckerPage {
  const avatar = user.displayAvatarURL({ size: THUMBNAIL_SIZE });
  if (!dangerous.length) {
    return emptyPage(`${CHECKROLES_ICON} __Role check — ${user.tag}__`, `✅ No dangerous roles found for <@${user.id}> in any shared server.`, avatar);
  }

  const totalPages = dangerous.length;
  const safeIndex = clampIndex(index, totalPages);
  const entry = dangerous.at(safeIndex);
  if (!entry) return emptyPage(`${CHECKROLES_ICON} __Role check — ${user.tag}__`, `✅ No dangerous roles found for <@${user.id}> in any shared server.`, avatar);

  const container = new ContainerBuilder()
    .setAccentColor(config.color)
    .addTextDisplayComponents(text(`# ${CHECKROLES_ICON} __Role check — ${user.tag}__\n-# ${totalPages} flagged server(s)`))
    .addSeparatorComponents(sep())
    .addTextDisplayComponents(text(`Page ${safeIndex + 1}/${totalPages}`))
    .addSeparatorComponents(sep())
    .addTextDisplayComponents(text(`## ${entry.name}`))
    .addSeparatorComponents(sep())
    .addSectionComponents(
      headerSection(
        `- __Target user:__ <@${user.id}>\n` + `- __Status:__ **${statusOf(entry)}**\n` + `- __Members:__ \`${entry.members.toLocaleString()}\``,
        entry.iconURL ?? avatar,
      ),
    )
    .addSeparatorComponents(sep())
    .addTextDisplayComponents(text(`## ${SERVERS_ICON} Dangerous permissions`))
    .addSeparatorComponents(sep())
    .addTextDisplayComponents(text(entry.dangerous.map((p) => `- \`${formatPermission(p)}\``).join('\n')));

  if (totalPages > 1) {
    container.addSeparatorComponents(sep()).addActionRowComponents(navRow('cr', invokerId, user.id, safeIndex, totalPages));
  }

  return toPage(container);
}
