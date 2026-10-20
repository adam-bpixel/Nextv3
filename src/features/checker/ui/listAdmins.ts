import { ContainerBuilder } from 'discord.js';
import config from '../../../core/config';
import { SERVERS_ICON } from '../../../core/emojis';
import type { AdminEntry, GuildAdminAudit } from '../adminAudit';
import { type CheckerPage, clampIndex, emptyPage, headerSection, navRow, sep, text, toPage } from './shared';

export const ADMINS_PER_PAGE = 3;

function adminBlock(admin: AdminEntry): string {
  const memberLine = `- __Member:__ **[${admin.displayName}](https://discord.com/users/${admin.id})**`;
  const status = admin.isOwner ? '`Server Owner`' : '`Administrator`';
  const highestRole = admin.isOwner ? '`Server Owner`' : admin.highestRoleName ? `\`${admin.highestRoleName}\`` : '*None*';
  return `${memberLine}\n- __Status:__ ${status}\n- __Highest Role:__ ${highestRole}`;
}

function ownerLine(audit: GuildAdminAudit): string {
  const ownerName = audit.ownerName ?? audit.ownerId;
  const owner = `**[${ownerName}](https://discord.com/users/${audit.ownerId})**`;
  return `- __Owner:__ ${owner}`;
}

export function listAdminsPage(audit: GuildAdminAudit, index: number, invokerId: string): CheckerPage {
  if (!audit.admins.length) {
    return emptyPage(`${SERVERS_ICON} __Admin audit — ${audit.name}__`, `✅ No administrators found in **${audit.name}**.`, audit.iconURL);
  }

  const totalPages = Math.max(1, Math.ceil(audit.admins.length / ADMINS_PER_PAGE));
  const safeIndex = clampIndex(index, totalPages);
  const start = safeIndex * ADMINS_PER_PAGE;
  const shown = audit.admins.slice(start, start + ADMINS_PER_PAGE);

  const container = new ContainerBuilder()
    .setAccentColor(config.color)
    .addTextDisplayComponents(text(`# ${SERVERS_ICON} __Admin audit — ${audit.name}__`))
    .addSeparatorComponents(sep())
    .addTextDisplayComponents(text(`Page ${safeIndex + 1}/${totalPages}`))
    .addSeparatorComponents(sep())
    .addSectionComponents(
      headerSection(
        `- __Server ID:__ \`${audit.id}\`\n` +
          `${ownerLine(audit)}\n` +
          `- __Members:__ \`${audit.memberCount.toLocaleString()}\`\n` +
          `- __Administrators:__ \`${audit.admins.length}\``,
        audit.iconURL,
      ),
    )
    .addSeparatorComponents(sep());

  shown.forEach((admin, idx) => {
    container.addSectionComponents(headerSection(adminBlock(admin), admin.avatarURL));
    if (idx < shown.length - 1) container.addSeparatorComponents(sep());
  });

  if (totalPages > 1) {
    container.addSeparatorComponents(sep()).addActionRowComponents(navRow('la', invokerId, audit.id, safeIndex, totalPages));
  }

  return toPage(container);
}
